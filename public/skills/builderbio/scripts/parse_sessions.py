#!/usr/bin/env python3
"""Batch-parse all local Coding Agent sessions into a Builder Profile data model.

Scans Claude Code, Codex, Trae, Antigravity, Kiro, Windsurf, OpenClaw, and
generic import sessions. Extracts lightweight summaries, computes aggregate
stats, and outputs a single JSON ready for profile generation.

Usage:
    python parse_sessions.py \
        --claude-dir ~/.claude \
        --codex-dir ~/.codex \
        --trae-dir "~/Library/Application Support/Trae" \
        --antigravity-dir ~/.antigravity_tools \
        --kiro-dir ~/.kiro \
        --windsurf-dir ~/.windsurf \
        --openclaw-dir ~/.openclaw \
        --import-dir /path/to/imports \
        --days 30 \
        --output /tmp/builder_profile_data.json
"""

import json
import sys
import os
import glob
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone
from collections import Counter, defaultdict
from pathlib import Path


def main():
    args = parse_args()
    days = int(args.get("days", 30))
    if days <= 0:
        cutoff = datetime.fromtimestamp(0, tz=timezone.utc)
    else:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    sessions = []

    # Parse Claude Code sessions
    claude_dir = os.path.expanduser(args.get("claude_dir", "~/.claude"))
    if os.path.isdir(claude_dir):
        history = load_claude_history(claude_dir)
        cc_sessions = parse_claude_code_sessions(claude_dir, cutoff, history)
        sessions.extend(cc_sessions)

    # Parse Codex sessions
    codex_dir = os.path.expanduser(args.get("codex_dir", "~/.codex"))
    if os.path.isdir(codex_dir):
        cx_sessions = parse_codex_sessions(codex_dir, cutoff)
        sessions.extend(cx_sessions)

    # Parse Trae sessions (global + CN variant)
    trae_dir = os.path.expanduser(args.get("trae_dir", "~/Library/Application Support/Trae"))
    trae_cn_dir = os.path.expanduser("~/Library/Application Support/Trae CN")
    if os.path.isdir(trae_dir) or os.path.isdir(trae_cn_dir):
        trae_sessions = parse_trae_sessions(trae_dir, trae_cn_dir, cutoff)
        sessions.extend(trae_sessions)

    # Parse Antigravity sessions
    antigravity_dir = os.path.expanduser(args.get("antigravity_dir", "~/.antigravity_tools"))
    if os.path.isdir(antigravity_dir):
        ag_sessions = parse_antigravity_sessions(antigravity_dir, cutoff)
        sessions.extend(ag_sessions)

    # Parse Kiro sessions
    kiro_dir = os.path.expanduser(args.get("kiro_dir", "~/.kiro"))
    if os.path.isdir(kiro_dir):
        kiro_sessions = parse_kiro_sessions(kiro_dir, cutoff)
        sessions.extend(kiro_sessions)

    # Parse Windsurf sessions
    windsurf_dir = os.path.expanduser(args.get("windsurf_dir", "~/.windsurf"))
    if os.path.isdir(windsurf_dir):
        ws_sessions = parse_windsurf_sessions(windsurf_dir, cutoff)
        sessions.extend(ws_sessions)

    # Parse OpenClaw sessions
    openclaw_dir = os.path.expanduser(args.get("openclaw_dir", "~/.openclaw"))
    if os.path.isdir(openclaw_dir):
        oc_sessions = parse_openclaw_sessions(openclaw_dir, cutoff)
        sessions.extend(oc_sessions)

    # Parse generic import sessions
    import_dir = args.get("import_dir", "")
    if import_dir:
        import_dir = os.path.expanduser(import_dir)
        if os.path.isdir(import_dir):
            imp_sessions = parse_import_sessions(import_dir, cutoff)
            sessions.extend(imp_sessions)

    # Sort by date descending
    sessions.sort(key=lambda s: s.get("date", ""), reverse=True)

    # Compute aggregates
    profile = compute_profile(sessions, days)
    heatmap = compute_heatmap(sessions, days)
    style = compute_style(sessions)
    highlights = compute_highlights(sessions)

    # Build agent_dirs for time distribution (legacy agents need file-based hour extraction)
    agent_dirs = {"claude-code": claude_dir, "codex": codex_dir}
    time_dist = compute_time_distribution(sessions, agent_dirs)

    tech_stack = compute_tech_stack(sessions)
    keywords = compute_keywords(sessions)
    evolution = compute_evolution(sessions)
    comparison = compute_agent_comparison(sessions)

    # Strip private _start_hour before output
    for s in sessions:
        s.pop("_start_hour", None)

    result = {
        "profile": profile,
        "sessions": sessions,
        "heatmap": heatmap,
        "style": style,
        "highlights": highlights,
        "time_distribution": time_dist,
        "tech_stack": tech_stack,
        "keywords": keywords,
        "evolution": evolution,
        "agent_comparison": comparison,
        "projects": [],  # Agent fills this via clustering
    }

    output = args.get("output", "/tmp/builder_profile_data.json")
    with open(output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    # Dynamic print summary
    agent_counts = Counter(s["agent"] for s in sessions)
    print(f"Parsed {len(sessions)} sessions \u2192 {output}")
    for agent, count in agent_counts.most_common():
        print(f"  {agent}: {count}")


def load_claude_history(claude_dir):
    """Load session display names from history.jsonl."""
    history = {}
    hpath = os.path.join(claude_dir, "history.jsonl")
    if not os.path.exists(hpath):
        return history
    with open(hpath, "r", encoding="utf-8") as f:
        for line in f:
            try:
                e = json.loads(line.strip())
                sid = e.get("sessionId", "")
                if sid:
                    history[sid] = e.get("display", "")[:120]
            except (json.JSONDecodeError, KeyError):
                continue
    return history


def infer_claude_session_id(filepath):
    """Infer the Claude session ID from the file path when an entry omits it."""
    path = Path(filepath)
    if path.stem and not path.stem.startswith("agent-"):
        return path.stem
    if path.parent.name == "subagents":
        parent = path.parent.parent.name
        if parent:
            return parent
    return ""


def extract_text_content(content):
    """Extract plain text from Claude/Trae content blocks."""
    if isinstance(content, str):
        return content[:200]
    if isinstance(content, list):
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                return str(block.get("text", ""))[:200]
    return ""


def sum_claude_usage(usage):
    """Count Claude usage fields including cache and reasoning buckets."""
    if not isinstance(usage, dict):
        return 0

    total = 0
    for key in [
        "input_tokens",
        "cache_read_input_tokens",
        "cache_creation_input_tokens",
        "cached_input_tokens",
        "output_tokens",
        "reasoning_output_tokens",
    ]:
        value = usage.get(key, 0)
        if isinstance(value, (int, float)):
            total += int(value)
    return total


def new_claude_session_accumulator(session_id, history):
    """Initialize a logical Claude session aggregator."""
    return {
        "id": session_id,
        "history_display": history.get(session_id, ""),
        "user_turns": 0,
        "assistant_turns": 0,
        "tool_counter": Counter(),
        "tokens": 0,
        "model": "",
        "version": "",
        "cwd": "",
        "git_branch": "",
        "start_ts": None,
        "end_ts": None,
        "first_user_msg": "",
    }


def update_claude_session_accumulator(acc, entry):
    """Merge one Claude JSONL entry into a logical session summary."""
    ts = parse_ts(entry.get("timestamp"))
    if ts:
        if acc["start_ts"] is None or ts < acc["start_ts"]:
            acc["start_ts"] = ts
        if acc["end_ts"] is None or ts > acc["end_ts"]:
            acc["end_ts"] = ts

    etype = entry.get("type", "")
    if etype == "user" and entry.get("userType") == "external":
        acc["user_turns"] += 1
        if not acc["cwd"]:
            acc["cwd"] = entry.get("cwd", "")
        if not acc["version"]:
            acc["version"] = entry.get("version", "")
        if not acc["git_branch"]:
            acc["git_branch"] = entry.get("gitBranch", "")
        if not acc["first_user_msg"]:
            acc["first_user_msg"] = extract_text_content(
                entry.get("message", {}).get("content", "")
            )
        return

    if etype != "assistant":
        return

    acc["assistant_turns"] += 1
    message = entry.get("message", {})
    if not acc["model"] and message.get("model"):
        acc["model"] = message["model"]
    acc["tokens"] += sum_claude_usage(message.get("usage", {}))
    for block in message.get("content") or []:
        if isinstance(block, dict) and block.get("type") == "tool_use":
            acc["tool_counter"][block.get("name", "unknown")] += 1


def finalize_claude_session(acc):
    """Convert a Claude session accumulator into the output session schema."""
    if acc["user_turns"] == 0 and acc["assistant_turns"] == 0:
        return None

    display = acc["history_display"] or acc["first_user_msg"][:100]
    for prefix in [
        "[Request interrupted",
        "<task-notification",
        "<local-command",
        "This session is being continued",
    ]:
        if display.startswith(prefix):
            display = acc["first_user_msg"][:100]
            break

    duration = 0
    date_str = ""
    if acc["start_ts"] and acc["end_ts"]:
        duration = int((acc["end_ts"] - acc["start_ts"]).total_seconds())
        date_str = acc["start_ts"].strftime("%Y-%m-%d")

    return {
        "id": acc["id"],
        "agent": "claude-code",
        "model": acc["model"],
        "version": acc["version"],
        "date": date_str,
        "display": display,
        "first_msg": acc["first_user_msg"][:200],
        "turns": acc["user_turns"] + acc["assistant_turns"],
        "user_turns": acc["user_turns"],
        "assistant_turns": acc["assistant_turns"],
        "tool_calls": sum(acc["tool_counter"].values()),
        "tools": dict(acc["tool_counter"]),
        "tokens": acc["tokens"],
        "duration_seconds": duration,
        "cwd": acc["cwd"],
        "git_branch": acc["git_branch"],
        "_start_hour": acc["start_ts"].hour if acc["start_ts"] else None,
    }


def parse_claude_code_sessions(claude_dir, cutoff, history):
    """Parse all Claude Code logs, including sidechains, into logical sessions."""
    sessions = []
    accumulators = {}
    pattern = os.path.join(claude_dir, "projects", "**", "*.jsonl")

    for fp in glob.glob(pattern, recursive=True):
        fallback_sid = infer_claude_session_id(fp)
        try:
            with open(fp, "r", encoding="utf-8") as f:
                for line in f:
                    try:
                        entry = json.loads(line.strip())
                    except json.JSONDecodeError:
                        continue

                    session_id = entry.get("sessionId") or fallback_sid
                    if not session_id:
                        continue

                    acc = accumulators.get(session_id)
                    if acc is None:
                        acc = new_claude_session_accumulator(session_id, history)
                        accumulators[session_id] = acc
                    update_claude_session_accumulator(acc, entry)
        except (OSError, IOError):
            continue

    for acc in accumulators.values():
        if acc["end_ts"] and acc["end_ts"] < cutoff:
            continue
        summary = finalize_claude_session(acc)
        if summary and summary["turns"] > 0:
            sessions.append(summary)

    return sessions


def parse_claude_code_session(filepath, session_id, history):
    """Extract a lightweight summary from one Claude Code session JSONL."""
    user_turns = 0
    assistant_turns = 0
    tool_counter = Counter()
    total_in = 0
    total_out = 0
    model = ""
    version = ""
    cwd = ""
    git_branch = ""
    start_ts = None
    end_ts = None
    first_user_msg = ""

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    e = json.loads(line.strip())
                except json.JSONDecodeError:
                    continue

                etype = e.get("type", "")
                ts = parse_ts(e.get("timestamp"))

                if ts:
                    if start_ts is None or ts < start_ts:
                        start_ts = ts
                    if end_ts is None or ts > end_ts:
                        end_ts = ts

                if etype == "user" and e.get("userType") == "external":
                    user_turns += 1
                    if not cwd:
                        cwd = e.get("cwd", "")
                    if not version:
                        version = e.get("version", "")
                    if not git_branch:
                        git_branch = e.get("gitBranch", "")
                    if not first_user_msg:
                        msg = e.get("message", {}).get("content", "")
                        if isinstance(msg, list):
                            for b in msg:
                                if isinstance(b, dict) and b.get("type") == "text":
                                    first_user_msg = b["text"][:200]
                                    break
                        elif isinstance(msg, str):
                            first_user_msg = msg[:200]

                elif etype == "assistant":
                    assistant_turns += 1
                    m = e.get("message", {})
                    if not model and m.get("model"):
                        model = m["model"]
                    usage = m.get("usage", {})
                    total_in += usage.get("input_tokens", 0)
                    total_out += usage.get("output_tokens", 0)
                    for block in (m.get("content") or []):
                        if isinstance(block, dict) and block.get("type") == "tool_use":
                            tool_counter[block.get("name", "unknown")] += 1

    except (OSError, IOError):
        return None

    if user_turns == 0 and assistant_turns == 0:
        return None

    display = history.get(session_id, "") or first_user_msg[:100]
    # Clean display
    for prefix in ["[Request interrupted", "<task-notification", "<local-command", "This session is being continued"]:
        if display.startswith(prefix):
            display = first_user_msg[:100]
            break

    duration = 0
    date_str = ""
    if start_ts and end_ts:
        duration = int((end_ts - start_ts).total_seconds())
        date_str = start_ts.strftime("%Y-%m-%d")

    return {
        "id": session_id,
        "agent": "claude-code",
        "model": model,
        "version": version,
        "date": date_str,
        "display": display,
        "first_msg": first_user_msg[:200],
        "turns": user_turns + assistant_turns,
        "user_turns": user_turns,
        "assistant_turns": assistant_turns,
        "tool_calls": sum(tool_counter.values()),
        "tools": dict(tool_counter),
        "tokens": total_in + total_out,
        "duration_seconds": duration,
        "cwd": cwd,
        "git_branch": git_branch,
        "_start_hour": start_ts.hour if start_ts else None,
    }


def extract_codex_token_total(snapshot):
    """Return a comparable total token count from one Codex usage snapshot."""
    if not isinstance(snapshot, dict):
        return None

    explicit_total = snapshot.get("total_tokens")
    if isinstance(explicit_total, (int, float)):
        return int(explicit_total)

    total = 0
    found = False
    for key in [
        "input_tokens",
        "cached_input_tokens",
        "cached_tokens",
        "output_tokens",
        "reasoning_output_tokens",
        "reasoning_tokens",
    ]:
        value = snapshot.get(key)
        if isinstance(value, (int, float)):
            total += int(value)
            found = True
    return total if found else None


def parse_codex_sessions(codex_dir, cutoff):
    """Parse all Codex session files."""
    sessions = []
    pattern = os.path.join(codex_dir, "sessions", "*", "*", "*", "*.jsonl")
    for fp in glob.glob(pattern):
        mtime = datetime.fromtimestamp(os.path.getmtime(fp), tz=timezone.utc)
        if mtime < cutoff:
            continue
        summary = parse_codex_session(fp)
        if summary and summary["turns"] > 0:
            sessions.append(summary)
    return sessions


def parse_codex_session(filepath):
    """Extract a lightweight summary from one Codex session JSONL."""
    session_id = ""
    model = ""
    version = ""
    cwd = ""
    git_branch = ""
    user_turns = 0
    assistant_turns = 0
    tool_counter = Counter()
    token_total_max = None
    last_token_total_max = None
    fallback_token_total = 0
    start_ts = None
    end_ts = None
    first_user_msg = ""

    codex_tool_map = {
        "exec_command": "Bash", "shell": "Bash",
        "read_file": "Read", "write_file": "Write", "edit_file": "Edit",
        "search": "Search", "grep": "Grep", "glob": "Glob", "list_directory": "Glob",
    }

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    e = json.loads(line.strip())
                except json.JSONDecodeError:
                    continue

                etype = e.get("type", "")
                payload = e.get("payload", {})
                ts = parse_ts(e.get("timestamp"))

                if ts:
                    if start_ts is None or ts < start_ts:
                        start_ts = ts
                    if end_ts is None or ts > end_ts:
                        end_ts = ts

                if etype == "session_meta":
                    session_id = payload.get("id", "")
                    version = payload.get("cli_version", "")
                    cwd = payload.get("cwd", "")
                    git_info = payload.get("git", {})
                    git_branch = git_info.get("branch", "")

                elif etype == "turn_context":
                    if not model:
                        model = payload.get("model", "")

                elif etype == "event_msg":
                    payload_type = payload.get("type")
                    if payload_type == "user_message":
                        user_turns += 1
                        if not first_user_msg:
                            first_user_msg = payload.get("message", "")[:200]
                    elif payload_type == "token_count":
                        info = payload.get("info") or payload.get("token_count_info") or {}
                        total_snapshot = extract_codex_token_total(
                            info.get("total_token_usage")
                        )
                        last_snapshot = extract_codex_token_total(
                            info.get("last_token_usage")
                        )
                        if total_snapshot is not None:
                            token_total_max = max(token_total_max or 0, total_snapshot)
                        if last_snapshot is not None:
                            last_token_total_max = max(
                                last_token_total_max or 0, last_snapshot
                            )

                elif etype == "response_item":
                    ptype = payload.get("type", "")
                    if ptype == "message":
                        assistant_turns += 1
                    elif ptype == "function_call":
                        name = payload.get("name", "")
                        tool_counter[codex_tool_map.get(name, name)] += 1

                elif etype == "token_usage":
                    snapshot_total = extract_codex_token_total(payload)
                    if snapshot_total is not None:
                        fallback_token_total += snapshot_total

    except (OSError, IOError):
        return None

    if user_turns == 0 and assistant_turns == 0:
        return None

    duration = 0
    date_str = ""
    if start_ts and end_ts:
        duration = int((end_ts - start_ts).total_seconds())
        date_str = start_ts.strftime("%Y-%m-%d")

    total_tokens = (
        token_total_max
        if token_total_max is not None
        else last_token_total_max
        if last_token_total_max is not None
        else fallback_token_total
    )

    return {
        "id": session_id or Path(filepath).stem,
        "agent": "codex",
        "model": model,
        "version": version,
        "date": date_str,
        "display": first_user_msg[:100],
        "first_msg": first_user_msg[:200],
        "turns": user_turns + assistant_turns,
        "user_turns": user_turns,
        "assistant_turns": assistant_turns,
        "tool_calls": sum(tool_counter.values()),
        "tools": dict(tool_counter),
        "tokens": total_tokens,
        "duration_seconds": duration,
        "cwd": cwd,
        "git_branch": git_branch,
        "_start_hour": start_ts.hour if start_ts else None,
    }


# ---------------------------------------------------------------------------
# Trae (ByteDance) parser
# ---------------------------------------------------------------------------

def parse_trae_sessions(trae_dir, trae_cn_dir, cutoff):
    """Parse Trae sessions from SQLite state.vscdb files.

    Scans both global and per-workspace state.vscdb files for the global
    Trae install and the China variant (Trae CN). Deduplicates by session ID.
    """
    sessions = []
    seen_ids = set()

    for base_dir in [trae_dir, trae_cn_dir]:
        if not os.path.isdir(base_dir):
            continue
        # Find all state.vscdb files under User/
        for root, _dirs, files in os.walk(os.path.join(base_dir, "User")):
            for fname in files:
                if fname == "state.vscdb":
                    db_path = os.path.join(root, fname)
                    found = _parse_trae_db(db_path, cutoff, seen_ids)
                    sessions.extend(found)

    return sessions


def _parse_trae_db(db_path, cutoff, seen_ids):
    """Extract sessions from a single Trae state.vscdb file."""
    results = []
    try:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute(
            """
            SELECT key, value
            FROM ItemTable
            WHERE key LIKE '%icube-ai-chat-storage%'
               OR key LIKE '%icube-ai-ng-chat-storage%'
               OR key LIKE '%icube-ai-agent-storage%'
               OR key LIKE '%icube-ai-ng-agent-storage%'
            """
        )
        for row in cur.fetchall():
            try:
                data = json.loads(row["value"])
            except (json.JSONDecodeError, TypeError):
                continue

            chat_list = data if isinstance(data, list) else data.get("list", [])
            if not isinstance(chat_list, list):
                continue

            for chat in chat_list:
                if not isinstance(chat, dict):
                    continue
                sid = chat.get("sessionId") or chat.get("id", "")
                if not sid or sid in seen_ids:
                    continue

                messages = chat.get("messages") or chat.get("messageList") or []
                if not isinstance(messages, list) or not messages:
                    continue

                # Determine timestamps
                created = chat.get("createdAt") or chat.get("createTime")
                start_ts = parse_ts(created)
                if start_ts and start_ts < cutoff:
                    continue

                user_turns = 0
                assistant_turns = 0
                first_user_msg = ""
                end_ts = start_ts

                for msg in messages:
                    if not isinstance(msg, dict):
                        continue
                    role = msg.get("role", "")
                    msg_ts = parse_ts(msg.get("createdAt") or msg.get("timestamp"))
                    if msg_ts:
                        if end_ts is None or msg_ts > end_ts:
                            end_ts = msg_ts
                        if start_ts is None or msg_ts < start_ts:
                            start_ts = msg_ts

                    if role == "user":
                        user_turns += 1
                        if not first_user_msg:
                            content = msg.get("content", "")
                            first_user_msg = extract_text_content(content)
                    elif role in ("assistant", "ai"):
                        assistant_turns += 1

                if user_turns == 0 and assistant_turns == 0:
                    continue

                seen_ids.add(sid)
                duration = 0
                date_str = ""
                if start_ts and end_ts:
                    duration = max(0, int((end_ts - start_ts).total_seconds()))
                    date_str = start_ts.strftime("%Y-%m-%d")

                results.append({
                    "id": sid,
                    "agent": "trae",
                    "model": chat.get("model", ""),
                    "version": "",
                    "date": date_str,
                    "display": first_user_msg[:100],
                    "first_msg": first_user_msg[:200],
                    "turns": user_turns + assistant_turns,
                    "user_turns": user_turns,
                    "assistant_turns": assistant_turns,
                    "tool_calls": 0,
                    "tools": {},
                    "tokens": 0,
                    "duration_seconds": duration,
                    "cwd": "",
                    "git_branch": "",
                    "_start_hour": start_ts.hour if start_ts else None,
                })

        conn.close()
    except (sqlite3.Error, OSError):
        pass
    return results


# ---------------------------------------------------------------------------
# Antigravity (Gemini CLI) parser
# ---------------------------------------------------------------------------

def parse_antigravity_sessions(antigravity_dir, cutoff):
    """Parse Antigravity sessions from proxy_logs.db.

    Groups API requests into sessions by 30-minute time gaps. Extracts tokens,
    model info, and tool calls from request/response bodies.
    """
    db_path = os.path.join(antigravity_dir, "proxy_logs.db")
    if not os.path.isfile(db_path):
        return []

    sessions = []
    try:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Discover available columns
        cur.execute("PRAGMA table_info(request_logs)")
        columns = {row["name"] for row in cur.fetchall()}

        # Build query based on available columns
        select_cols = ["rowid"]
        for col in ["timestamp", "created_at", "input_tokens", "output_tokens",
                     "mapped_model", "model", "request_body", "response_body"]:
            if col in columns:
                select_cols.append(col)

        cur.execute(f"SELECT {', '.join(select_cols)} FROM request_logs ORDER BY rowid")
        rows = cur.fetchall()
        conn.close()
    except (sqlite3.Error, OSError):
        return []

    if not rows:
        return []

    # Group rows into sessions by 30-min gaps
    session_groups = []
    current_group = []
    prev_ts = None
    gap_seconds = 30 * 60

    for row in rows:
        row_dict = dict(row)
        ts_val = row_dict.get("timestamp") or row_dict.get("created_at")
        ts = parse_ts(ts_val)
        if ts and ts < cutoff:
            continue

        if prev_ts and ts and (ts - prev_ts).total_seconds() > gap_seconds:
            if current_group:
                session_groups.append(current_group)
            current_group = []

        current_group.append((row_dict, ts))
        if ts:
            prev_ts = ts

    if current_group:
        session_groups.append(current_group)

    gemini_tool_map = {
        "read_file": "Read", "write_file": "Write", "edit_file": "Edit",
        "run_command": "Bash", "shell": "Bash", "execute_command": "Bash",
        "search_files": "Grep", "find_files": "Glob", "list_files": "Glob",
        "web_search": "WebSearch",
    }

    for group in session_groups:
        timestamps = [ts for _, ts in group if ts]
        if not timestamps:
            continue

        start_ts = min(timestamps)
        end_ts = max(timestamps)
        total_in = 0
        total_out = 0
        model = ""
        user_turns = 0
        assistant_turns = 0
        tool_counter = Counter()
        first_user_msg = ""
        request_count = len(group)

        for row_dict, _ in group:
            total_in += row_dict.get("input_tokens", 0) or 0
            total_out += row_dict.get("output_tokens", 0) or 0
            if not model:
                model = row_dict.get("mapped_model", "") or row_dict.get("model", "")

            # Parse request body for user turns and tool calls
            req_body = row_dict.get("request_body", "")
            if req_body:
                try:
                    req = json.loads(req_body) if isinstance(req_body, str) else req_body
                    contents = req.get("contents", [])
                    if isinstance(contents, list):
                        for c in contents:
                            if isinstance(c, dict):
                                role = c.get("role", "")
                                if role == "user":
                                    user_turns += 1
                                    if not first_user_msg:
                                        parts = c.get("parts", [])
                                        for p in parts:
                                            if isinstance(p, dict) and p.get("text"):
                                                first_user_msg = p["text"][:200]
                                                break
                                elif role == "model":
                                    assistant_turns += 1

                    # Extract tool calls from tools config
                    tools = req.get("tools", [])
                    if isinstance(tools, list):
                        for t in tools:
                            if isinstance(t, dict):
                                for fd in t.get("function_declarations", []):
                                    if isinstance(fd, dict):
                                        name = fd.get("name", "")
                                        tool_counter[gemini_tool_map.get(name, name)] += 1
                except (json.JSONDecodeError, TypeError, AttributeError):
                    pass

            # Parse response body for function calls
            resp_body = row_dict.get("response_body", "")
            if resp_body:
                try:
                    resp = json.loads(resp_body) if isinstance(resp_body, str) else resp_body
                    candidates = resp.get("candidates", [])
                    if isinstance(candidates, list):
                        for cand in candidates:
                            if isinstance(cand, dict):
                                content = cand.get("content", {})
                                if isinstance(content, dict):
                                    for part in content.get("parts", []):
                                        if isinstance(part, dict) and "functionCall" in part:
                                            fc = part["functionCall"]
                                            name = fc.get("name", "")
                                            tool_counter[gemini_tool_map.get(name, name)] += 1
                except (json.JSONDecodeError, TypeError, AttributeError):
                    pass

        # Guard against turn inflation: Gemini sends full history in each request
        if user_turns > 3 * request_count:
            user_turns = request_count
        if assistant_turns > 3 * request_count:
            assistant_turns = request_count

        if user_turns == 0 and assistant_turns == 0:
            continue

        sid = f"ag-{int(start_ts.timestamp())}-{uuid.uuid4().hex[:8]}"
        duration = max(0, int((end_ts - start_ts).total_seconds()))
        date_str = start_ts.strftime("%Y-%m-%d")

        sessions.append({
            "id": sid,
            "agent": "antigravity",
            "model": model,
            "version": "",
            "date": date_str,
            "display": first_user_msg[:100],
            "first_msg": first_user_msg[:200],
            "turns": user_turns + assistant_turns,
            "user_turns": user_turns,
            "assistant_turns": assistant_turns,
            "tool_calls": sum(tool_counter.values()),
            "tools": dict(tool_counter),
            "tokens": total_in + total_out,
            "duration_seconds": duration,
            "cwd": "",
            "git_branch": "",
            "_start_hour": start_ts.hour if start_ts else None,
        })

    return sessions


# ---------------------------------------------------------------------------
# Kiro (AWS) parser
# ---------------------------------------------------------------------------

def parse_kiro_sessions(kiro_dir, cutoff):
    """Parse Kiro sessions from SQLite databases and JSON exports.

    Uses schema discovery to find session data in any .db file under ~/.kiro/.
    Also parses JSON export files. Deduplicates by session ID.
    """
    sessions = []
    seen_ids = set()

    # Parse SQLite databases
    for db_path in glob.glob(os.path.join(kiro_dir, "*.db")):
        found = _parse_kiro_db(db_path, cutoff, seen_ids)
        sessions.extend(found)

    # Parse JSON exports
    json_paths = (
        glob.glob(os.path.join(kiro_dir, "exports", "*.json")) +
        glob.glob(os.path.join(kiro_dir, "*.json"))
    )
    for jp in json_paths:
        found = _parse_kiro_json(jp, cutoff, seen_ids)
        sessions.extend(found)

    return sessions


def _parse_kiro_db(db_path, cutoff, seen_ids):
    """Parse sessions from a Kiro SQLite database via schema discovery."""
    results = []
    try:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Enumerate tables
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row["name"] for row in cur.fetchall()]

        # Look for a sessions/conversations table
        session_table = None
        for candidate in ["sessions", "conversations", "chats", "chat_sessions"]:
            if candidate in tables:
                session_table = candidate
                break

        if not session_table:
            # Heuristic: find a table with id and messages-like columns
            for tbl in tables:
                cur.execute(f"PRAGMA table_info({tbl})")
                cols = {row["name"] for row in cur.fetchall()}
                if "id" in cols and ("messages" in cols or "content" in cols):
                    session_table = tbl
                    break

        if session_table:
            cur.execute(f"PRAGMA table_info({session_table})")
            cols = {row["name"] for row in cur.fetchall()}

            cur.execute(f"SELECT * FROM {session_table}")
            for row in cur.fetchall():
                row_dict = dict(row)
                sid = str(row_dict.get("id", ""))
                if not sid or sid in seen_ids:
                    continue

                # Determine timestamp
                ts_val = row_dict.get("created_at") or row_dict.get("timestamp") or row_dict.get("date")
                start_ts = parse_ts(ts_val)
                if start_ts and start_ts < cutoff:
                    continue

                # Parse messages
                messages_raw = row_dict.get("messages") or row_dict.get("content", "")
                messages = []
                if isinstance(messages_raw, str):
                    try:
                        messages = json.loads(messages_raw)
                    except (json.JSONDecodeError, TypeError):
                        pass
                elif isinstance(messages_raw, list):
                    messages = messages_raw

                if not isinstance(messages, list):
                    messages = []

                user_turns = 0
                assistant_turns = 0
                first_user_msg = ""
                tool_counter = Counter()

                for msg in messages:
                    if not isinstance(msg, dict):
                        continue
                    role = msg.get("role", "")
                    if role in ("user", "human"):
                        user_turns += 1
                        if not first_user_msg:
                            content = msg.get("content", "")
                            if isinstance(content, str):
                                first_user_msg = content[:200]
                            elif isinstance(content, list):
                                for b in content:
                                    if isinstance(b, dict) and b.get("type") == "text":
                                        first_user_msg = b.get("text", "")[:200]
                                        break
                    elif role in ("assistant", "ai", "model"):
                        assistant_turns += 1
                        # Check for tool use
                        content = msg.get("content", "")
                        if isinstance(content, list):
                            for b in content:
                                if isinstance(b, dict) and b.get("type") == "tool_use":
                                    tool_counter[b.get("name", "unknown")] += 1

                if user_turns == 0 and assistant_turns == 0:
                    continue

                seen_ids.add(sid)
                model = str(row_dict.get("model", ""))
                cwd = str(row_dict.get("cwd", ""))
                date_str = start_ts.strftime("%Y-%m-%d") if start_ts else ""

                results.append({
                    "id": sid,
                    "agent": "kiro",
                    "model": model,
                    "version": "",
                    "date": date_str,
                    "display": first_user_msg[:100],
                    "first_msg": first_user_msg[:200],
                    "turns": user_turns + assistant_turns,
                    "user_turns": user_turns,
                    "assistant_turns": assistant_turns,
                    "tool_calls": sum(tool_counter.values()),
                    "tools": dict(tool_counter),
                    "tokens": 0,
                    "duration_seconds": 0,
                    "cwd": cwd,
                    "git_branch": "",
                    "_start_hour": start_ts.hour if start_ts else None,
                })

        conn.close()
    except (sqlite3.Error, OSError):
        pass
    return results


def _parse_kiro_json(filepath, cutoff, seen_ids):
    """Parse sessions from a Kiro JSON export file."""
    results = []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError):
        return results

    # Handle both single session dict and list of sessions
    if isinstance(data, dict):
        data = [data]
    if not isinstance(data, list):
        return results

    for entry in data:
        if not isinstance(entry, dict):
            continue
        sid = str(entry.get("id") or entry.get("sessionId", ""))
        if not sid or sid in seen_ids:
            continue

        ts_val = entry.get("created_at") or entry.get("timestamp") or entry.get("date")
        start_ts = parse_ts(ts_val)
        if start_ts and start_ts < cutoff:
            continue

        messages = entry.get("messages", [])
        if not isinstance(messages, list):
            continue

        user_turns = 0
        assistant_turns = 0
        first_user_msg = ""
        tool_counter = Counter()

        for msg in messages:
            if not isinstance(msg, dict):
                continue
            role = msg.get("role", "")
            if role in ("user", "human"):
                user_turns += 1
                if not first_user_msg:
                    content = msg.get("content", "")
                    if isinstance(content, str):
                        first_user_msg = content[:200]
            elif role in ("assistant", "ai", "model"):
                assistant_turns += 1
                content = msg.get("content", "")
                if isinstance(content, list):
                    for b in content:
                        if isinstance(b, dict) and b.get("type") == "tool_use":
                            tool_counter[b.get("name", "unknown")] += 1

        if user_turns == 0 and assistant_turns == 0:
            continue

        seen_ids.add(sid)
        date_str = start_ts.strftime("%Y-%m-%d") if start_ts else ""

        results.append({
            "id": sid,
            "agent": "kiro",
            "model": entry.get("model", ""),
            "version": "",
            "date": date_str,
            "display": first_user_msg[:100],
            "first_msg": first_user_msg[:200],
            "turns": user_turns + assistant_turns,
            "user_turns": user_turns,
            "assistant_turns": assistant_turns,
            "tool_calls": sum(tool_counter.values()),
            "tools": dict(tool_counter),
            "tokens": 0,
            "duration_seconds": 0,
            "cwd": entry.get("cwd", ""),
            "git_branch": "",
            "_start_hour": start_ts.hour if start_ts else None,
        })

    return results


# ---------------------------------------------------------------------------
# Windsurf (Codeium) parser
# ---------------------------------------------------------------------------

def parse_windsurf_sessions(windsurf_dir, cutoff):
    """Parse Windsurf sessions from JSONL transcript files.

    Checks both ~/.windsurf/transcripts/ and ~/.codeium/windsurf/cascade/.
    Event types: user_input, planner_response, code_action, command_action,
    search_action.
    """
    sessions = []
    seen_ids = set()

    search_dirs = [
        os.path.join(windsurf_dir, "transcripts"),
        os.path.expanduser("~/.codeium/windsurf/cascade"),
    ]

    for sdir in search_dirs:
        if not os.path.isdir(sdir):
            continue
        for fp in glob.glob(os.path.join(sdir, "*.jsonl")):
            mtime = datetime.fromtimestamp(os.path.getmtime(fp), tz=timezone.utc)
            if mtime < cutoff:
                continue

            sid = Path(fp).stem
            if sid in seen_ids:
                continue

            summary = _parse_windsurf_file(fp, sid)
            if summary and summary["turns"] > 0:
                seen_ids.add(sid)
                sessions.append(summary)

    return sessions


def _parse_windsurf_file(filepath, session_id):
    """Parse a single Windsurf JSONL transcript file."""
    user_turns = 0
    assistant_turns = 0
    tool_counter = Counter()
    first_user_msg = ""
    start_ts = None
    end_ts = None
    model = ""

    windsurf_tool_map = {
        "code_action": "Edit",
        "command_action": "Bash",
        "search_action": "Grep",
        "file_action": "Read",
        "browse_action": "WebFetch",
    }

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    e = json.loads(line.strip())
                except json.JSONDecodeError:
                    continue

                ts = parse_ts(e.get("timestamp") or e.get("created_at"))
                if ts:
                    if start_ts is None or ts < start_ts:
                        start_ts = ts
                    if end_ts is None or ts > end_ts:
                        end_ts = ts

                etype = e.get("type", "") or e.get("event", "")

                if etype == "user_input":
                    user_turns += 1
                    if not first_user_msg:
                        content = e.get("content", "") or e.get("text", "") or e.get("message", "")
                        if isinstance(content, str):
                            first_user_msg = content[:200]
                elif etype == "planner_response":
                    assistant_turns += 1
                    if not model:
                        model = e.get("model", "")
                elif etype in windsurf_tool_map:
                    tool_counter[windsurf_tool_map[etype]] += 1

    except (OSError, IOError):
        return None

    if user_turns == 0 and assistant_turns == 0:
        return None

    duration = 0
    date_str = ""
    if start_ts and end_ts:
        duration = max(0, int((end_ts - start_ts).total_seconds()))
        date_str = start_ts.strftime("%Y-%m-%d")

    return {
        "id": session_id,
        "agent": "windsurf",
        "model": model,
        "version": "",
        "date": date_str,
        "display": first_user_msg[:100],
        "first_msg": first_user_msg[:200],
        "turns": user_turns + assistant_turns,
        "user_turns": user_turns,
        "assistant_turns": assistant_turns,
        "tool_calls": sum(tool_counter.values()),
        "tools": dict(tool_counter),
        "tokens": 0,
        "duration_seconds": duration,
        "cwd": "",
        "git_branch": "",
        "_start_hour": start_ts.hour if start_ts else None,
    }


# ---------------------------------------------------------------------------
# OpenClaw parser
# ---------------------------------------------------------------------------

def parse_openclaw_sessions(openclaw_dir, cutoff):
    """Parse OpenClaw sessions from JSONL files.

    Handles both Claude Code-like format (type: user/assistant) and simpler
    role-based JSONL.
    """
    sessions = []
    pattern = os.path.join(openclaw_dir, "agents", "*", "sessions", "*.jsonl")
    for fp in glob.glob(pattern):
        mtime = datetime.fromtimestamp(os.path.getmtime(fp), tz=timezone.utc)
        if mtime < cutoff:
            continue
        sid = Path(fp).stem
        summary = _parse_openclaw_file(fp, sid)
        if summary and summary["turns"] > 0:
            sessions.append(summary)
    return sessions


def _parse_openclaw_file(filepath, session_id):
    """Parse a single OpenClaw session JSONL file."""
    user_turns = 0
    assistant_turns = 0
    tool_counter = Counter()
    total_in = 0
    total_out = 0
    model = ""
    version = ""
    cwd = ""
    git_branch = ""
    start_ts = None
    end_ts = None
    first_user_msg = ""

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    e = json.loads(line.strip())
                except json.JSONDecodeError:
                    continue

                ts = parse_ts(e.get("timestamp"))
                if ts:
                    if start_ts is None or ts < start_ts:
                        start_ts = ts
                    if end_ts is None or ts > end_ts:
                        end_ts = ts

                etype = e.get("type", "")
                role = e.get("role", "")

                # Claude Code-like format
                if etype == "user" or role in ("user", "human"):
                    if etype == "user" and e.get("userType") == "internal":
                        continue
                    user_turns += 1
                    if not cwd:
                        cwd = e.get("cwd", "")
                    if not version:
                        version = e.get("version", "")
                    if not git_branch:
                        git_branch = e.get("gitBranch", "")
                    if not first_user_msg:
                        msg = e.get("message", {})
                        if isinstance(msg, dict):
                            content = msg.get("content", "")
                        else:
                            content = e.get("content", "")
                        if isinstance(content, list):
                            for b in content:
                                if isinstance(b, dict) and b.get("type") == "text":
                                    first_user_msg = b.get("text", "")[:200]
                                    break
                        elif isinstance(content, str):
                            first_user_msg = content[:200]

                elif etype == "assistant" or role in ("assistant", "ai", "model"):
                    assistant_turns += 1
                    m = e.get("message", {}) if isinstance(e.get("message"), dict) else {}
                    if not model:
                        model = m.get("model", "") or e.get("model", "")
                    usage = m.get("usage", {})
                    total_in += usage.get("input_tokens", 0)
                    total_out += usage.get("output_tokens", 0)
                    content_blocks = m.get("content") or e.get("content") or []
                    if isinstance(content_blocks, list):
                        for block in content_blocks:
                            if isinstance(block, dict) and block.get("type") == "tool_use":
                                tool_counter[block.get("name", "unknown")] += 1

    except (OSError, IOError):
        return None

    if user_turns == 0 and assistant_turns == 0:
        return None

    duration = 0
    date_str = ""
    if start_ts and end_ts:
        duration = max(0, int((end_ts - start_ts).total_seconds()))
        date_str = start_ts.strftime("%Y-%m-%d")

    return {
        "id": session_id,
        "agent": "openclaw",
        "model": model,
        "version": version,
        "date": date_str,
        "display": first_user_msg[:100],
        "first_msg": first_user_msg[:200],
        "turns": user_turns + assistant_turns,
        "user_turns": user_turns,
        "assistant_turns": assistant_turns,
        "tool_calls": sum(tool_counter.values()),
        "tools": dict(tool_counter),
        "tokens": total_in + total_out,
        "duration_seconds": duration,
        "cwd": cwd,
        "git_branch": git_branch,
        "_start_hour": start_ts.hour if start_ts else None,
    }


# ---------------------------------------------------------------------------
# Generic Import parser
# ---------------------------------------------------------------------------

def parse_import_sessions(import_dir, cutoff):
    """Parse generic import files (.json and .jsonl).

    .json files: Pre-formatted session dicts (must have id, agent, turns).
    .jsonl files: One message per line with role field, parsed from scratch.
    """
    sessions = []

    for fp in glob.glob(os.path.join(import_dir, "*.json")):
        if fp.endswith(".jsonl"):
            continue
        found = _parse_import_json(fp, cutoff)
        sessions.extend(found)

    for fp in glob.glob(os.path.join(import_dir, "*.jsonl")):
        summary = _parse_import_jsonl(fp, cutoff)
        if summary and summary["turns"] > 0:
            sessions.append(summary)

    return sessions


def _parse_import_json(filepath, cutoff):
    """Parse a pre-formatted JSON import file."""
    results = []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError):
        return results

    if isinstance(data, dict):
        data = [data]
    if not isinstance(data, list):
        return results

    required_keys = {"id", "agent", "turns"}
    for entry in data:
        if not isinstance(entry, dict):
            continue
        if not required_keys.issubset(entry.keys()):
            continue

        # Apply cutoff
        ts = parse_ts(entry.get("date") or entry.get("timestamp"))
        if ts and ts < cutoff:
            continue

        # Fill defaults
        session = {
            "id": str(entry["id"]),
            "agent": str(entry["agent"]),
            "model": str(entry.get("model", "")),
            "version": str(entry.get("version", "")),
            "date": str(entry.get("date", "")),
            "display": str(entry.get("display", entry.get("first_msg", "")))[:100],
            "first_msg": str(entry.get("first_msg", ""))[:200],
            "turns": int(entry.get("turns", 0)),
            "user_turns": int(entry.get("user_turns", 0)),
            "assistant_turns": int(entry.get("assistant_turns", 0)),
            "tool_calls": int(entry.get("tool_calls", 0)),
            "tools": entry.get("tools", {}),
            "tokens": int(entry.get("tokens", 0)),
            "duration_seconds": int(entry.get("duration_seconds", 0)),
            "cwd": str(entry.get("cwd", "")),
            "git_branch": str(entry.get("git_branch", "")),
            "_start_hour": entry.get("_start_hour"),
        }
        results.append(session)

    return results


def _parse_import_jsonl(filepath, cutoff):
    """Parse a generic JSONL import file (one message per line)."""
    user_turns = 0
    assistant_turns = 0
    first_user_msg = ""
    start_ts = None
    end_ts = None
    tool_counter = Counter()

    role_map_user = {"user", "human"}
    role_map_assistant = {"assistant", "ai", "model"}

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    e = json.loads(line.strip())
                except json.JSONDecodeError:
                    continue

                ts = parse_ts(e.get("timestamp") or e.get("created_at"))
                if ts:
                    if start_ts is None or ts < start_ts:
                        start_ts = ts
                    if end_ts is None or ts > end_ts:
                        end_ts = ts

                role = e.get("role", "").lower()
                if role in role_map_user:
                    user_turns += 1
                    if not first_user_msg:
                        content = e.get("content", "") or e.get("text", "") or e.get("message", "")
                        if isinstance(content, str):
                            first_user_msg = content[:200]
                elif role in role_map_assistant:
                    assistant_turns += 1
                    content = e.get("content", "")
                    if isinstance(content, list):
                        for b in content:
                            if isinstance(b, dict) and b.get("type") == "tool_use":
                                tool_counter[b.get("name", "unknown")] += 1
    except (OSError, IOError):
        return None

    if start_ts and start_ts < cutoff:
        return None
    if user_turns == 0 and assistant_turns == 0:
        return None

    duration = 0
    date_str = ""
    if start_ts and end_ts:
        duration = max(0, int((end_ts - start_ts).total_seconds()))
        date_str = start_ts.strftime("%Y-%m-%d")

    return {
        "id": Path(filepath).stem,
        "agent": "imported",
        "model": "",
        "version": "",
        "date": date_str,
        "display": first_user_msg[:100],
        "first_msg": first_user_msg[:200],
        "turns": user_turns + assistant_turns,
        "user_turns": user_turns,
        "assistant_turns": assistant_turns,
        "tool_calls": sum(tool_counter.values()),
        "tools": dict(tool_counter),
        "tokens": 0,
        "duration_seconds": duration,
        "cwd": "",
        "git_branch": "",
        "_start_hour": start_ts.hour if start_ts else None,
    }


# ---------------------------------------------------------------------------
# Shared utilities
# ---------------------------------------------------------------------------

def parse_ts(ts):
    """Parse timestamp to datetime."""
    if not ts:
        return None
    if isinstance(ts, (int, float)):
        return datetime.fromtimestamp(ts / 1000, tz=timezone.utc)
    if isinstance(ts, str):
        try:
            return datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None


def compute_profile(sessions, days):
    """Compute aggregate profile stats."""
    agents = defaultdict(lambda: {"sessions": 0, "turns": 0})
    active_dates = set()
    total_turns = 0
    total_tools = 0
    total_tokens = 0

    for s in sessions:
        agents[s["agent"]]["sessions"] += 1
        agents[s["agent"]]["turns"] += s["turns"]
        if s["date"]:
            active_dates.add(s["date"])
        total_turns += s["turns"]
        total_tools += s["tool_calls"]
        total_tokens += s.get("tokens", 0)

    dates = [s["date"] for s in sessions if s["date"]]
    return {
        "date_range": {
            "start": min(dates) if dates else "",
            "end": max(dates) if dates else "",
        },
        "active_days": len(active_dates),
        "total_sessions": len(sessions),
        "total_turns": total_turns,
        "total_tool_calls": total_tools,
        "total_tokens": total_tokens,
        "agents_used": dict(agents),
    }


def compute_heatmap(sessions, days):
    """Compute daily activity counts for heatmap."""
    daily = defaultdict(int)
    for s in sessions:
        if s["date"]:
            daily[s["date"]] += s["turns"]

    end = datetime.now(timezone.utc).date()
    if days <= 0 and daily:
        start = min(datetime.strptime(ds, "%Y-%m-%d").date() for ds in daily)
    else:
        start = end - timedelta(days=max(days, 0))

    heatmap = {}
    current = start
    while current <= end:
        ds = current.isoformat()
        heatmap[ds] = daily.get(ds, 0)
        current += timedelta(days=1)

    return heatmap


def compute_style(sessions):
    """Compute working style traits."""
    if not sessions:
        return {}

    # Session lengths
    turn_counts = [s["turns"] for s in sessions]
    short = sum(1 for t in turn_counts if t < 20)
    medium = sum(1 for t in turn_counts if 20 <= t < 100)
    long = sum(1 for t in turn_counts if t >= 100)

    # Tool aggregates
    all_tools = Counter()
    for s in sessions:
        for tool, count in s.get("tools", {}).items():
            all_tools[tool] += count

    total_tc = sum(all_tools.values()) or 1
    explore_tools = sum(all_tools.get(t, 0) for t in ["Read", "Glob", "Grep", "Search", "WebSearch"])
    build_tools = sum(all_tools.get(t, 0) for t in ["Write", "Edit"])
    command_tools = all_tools.get("Bash", 0)

    explore_ratio = explore_tools / total_tc
    build_ratio = build_tools / total_tc
    command_ratio = command_tools / total_tc

    # Average first message length (proxy for prompt style)
    first_msg_lengths = [len(s.get("first_msg", "")) for s in sessions if s.get("first_msg")]
    avg_first_msg_len = sum(first_msg_lengths) / len(first_msg_lengths) if first_msg_lengths else 0

    # Corrections proxy: user_turns / turns ratio
    correction_ratios = []
    for s in sessions:
        if s["turns"] > 5:
            correction_ratios.append(s["user_turns"] / max(s["turns"], 1))

    avg_user_ratio = sum(correction_ratios) / len(correction_ratios) if correction_ratios else 0

    return {
        "avg_session_turns": round(sum(turn_counts) / len(turn_counts)) if turn_counts else 0,
        "session_length_distribution": {"short": short, "medium": medium, "long": long},
        "exploration_ratio": round(explore_ratio, 2),
        "build_ratio": round(build_ratio, 2),
        "command_ratio": round(command_ratio, 2),
        "avg_first_msg_length": round(avg_first_msg_len),
        "avg_user_ratio": round(avg_user_ratio, 2),
        "tool_totals": dict(all_tools.most_common(10)),
    }


def compute_highlights(sessions):
    """Extract superlative moments."""
    if not sessions:
        return {}

    # Biggest session
    biggest = max(sessions, key=lambda s: s["turns"])

    # Busiest day
    daily_activity = defaultdict(lambda: {"sessions": 0, "turns": 0})
    for s in sessions:
        if s["date"]:
            daily_activity[s["date"]]["sessions"] += 1
            daily_activity[s["date"]]["turns"] += s["turns"]

    busiest_day = max(daily_activity.items(), key=lambda x: x[1]["turns"]) if daily_activity else ("", {"sessions": 0, "turns": 0})

    # Longest streak
    dates_active = sorted(set(s["date"] for s in sessions if s["date"]))
    longest_streak = 0
    current_streak = 0
    prev = None
    for d in dates_active:
        dt = datetime.strptime(d, "%Y-%m-%d").date()
        if prev and (dt - prev).days == 1:
            current_streak += 1
        else:
            current_streak = 1
        longest_streak = max(longest_streak, current_streak)
        prev = dt

    # Current streak (from today backwards)
    today = datetime.now(timezone.utc).date()
    cur_streak = 0
    check = today
    dates_set = set(dates_active)
    while check.isoformat() in dates_set:
        cur_streak += 1
        check -= timedelta(days=1)

    # Marathon session (longest duration)
    marathon = max(sessions, key=lambda s: s.get("duration_seconds", 0))

    # Most interesting first prompt (longest non-trivial one)
    interesting_prompts = [
        s for s in sessions
        if s.get("first_msg", "")
        and not s["first_msg"].startswith("[")
        and not s["first_msg"].startswith("<")
        and not s["first_msg"].startswith("This session")
        and len(s["first_msg"]) > 30
    ]
    favorite = max(interesting_prompts, key=lambda s: len(s["first_msg"])) if interesting_prompts else None

    return {
        "biggest_session": {
            "id": biggest["id"],
            "turns": biggest["turns"],
            "tool_calls": biggest["tool_calls"],
            "display": biggest["display"],
        },
        "busiest_day": {
            "date": busiest_day[0],
            "sessions": busiest_day[1]["sessions"],
            "turns": busiest_day[1]["turns"],
        },
        "longest_streak": longest_streak,
        "current_streak": cur_streak,
        "marathon_session": {
            "id": marathon["id"],
            "duration_seconds": marathon.get("duration_seconds", 0),
            "display": marathon["display"],
        },
        "favorite_prompt": favorite["first_msg"] if favorite else "",
    }


def compute_time_distribution(sessions, agent_dirs):
    """Extract hour-of-day distribution from session data.

    New agents embed _start_hour in session dict during parsing.
    Legacy agents (Claude Code, Codex) fall back to file-based hour extraction.
    """
    hour_counts = defaultdict(int)
    hour_turns = defaultdict(int)

    claude_dir = agent_dirs.get("claude-code", "")
    codex_dir = agent_dirs.get("codex", "")

    for s in sessions:
        hour = s.get("_start_hour")

        # Legacy file-based extraction for Claude Code and Codex
        if hour is None:
            sid = s["id"]
            agent = s["agent"]

            if agent == "claude-code" and claude_dir:
                pattern = os.path.join(claude_dir, "projects", "*", f"{sid}.jsonl")
                files = glob.glob(pattern)
                if files:
                    try:
                        with open(files[0], "r", encoding="utf-8") as f:
                            first_line = f.readline().strip()
                            if first_line:
                                entry = json.loads(first_line)
                                ts = entry.get("timestamp")
                                dt = parse_ts(ts)
                                if dt:
                                    hour = dt.hour
                    except (OSError, json.JSONDecodeError):
                        pass
                    if hour is None and files:
                        try:
                            hour = datetime.fromtimestamp(os.path.getmtime(files[0])).hour
                        except OSError:
                            pass

            elif agent == "codex" and codex_dir:
                date_str = s.get("date", "")
                parts = date_str.split("-")
                if len(parts) == 3:
                    pattern = os.path.join(codex_dir, "sessions", parts[0], parts[1], parts[2], "*.jsonl")
                    files = glob.glob(pattern)
                    for fp in files:
                        try:
                            with open(fp, "r", encoding="utf-8") as f:
                                first_line = f.readline().strip()
                                if first_line:
                                    entry = json.loads(first_line)
                                    ts = entry.get("timestamp") or entry.get("created_at")
                                    dt = parse_ts(ts)
                                    if dt:
                                        hour = dt.hour
                                        break
                        except (OSError, json.JSONDecodeError):
                            continue
                    if hour is None and files:
                        try:
                            hour = datetime.fromtimestamp(os.path.getmtime(files[0])).hour
                        except OSError:
                            pass

        if hour is not None:
            hour_counts[hour] += 1
            hour_turns[hour] += s["turns"]

    # Period aggregation
    periods = {
        "deep_night": (0, 6),
        "morning": (6, 12),
        "afternoon": (12, 18),
        "evening": (18, 24),
    }
    period_data = {}
    for name, (start, end) in periods.items():
        period_data[name] = {
            "sessions": sum(hour_counts[h] for h in range(start, end)),
            "turns": sum(hour_turns[h] for h in range(start, end)),
        }

    peak_hour = max(hour_counts.items(), key=lambda x: x[1])[0] if hour_counts else 0
    max_period = max(period_data.items(), key=lambda x: x[1]["sessions"])
    type_labels = {
        "deep_night": "\u6df1\u591c\u578b Builder",
        "morning": "\u4e0a\u5348\u578b Builder",
        "afternoon": "\u4e0b\u5348\u578b Builder",
        "evening": "\u591c\u732b\u5b50\u578b Builder",
    }

    return {
        "hour_distribution": {str(h): hour_counts[h] for h in range(24)},
        "period_data": period_data,
        "builder_type": type_labels.get(max_period[0], "\u5168\u5929\u578b Builder"),
        "peak_hour": peak_hour,
    }


def compute_tech_stack(sessions):
    """Infer technology stack from tool calls and prompt keywords."""
    tech_scores = Counter()

    for s in sessions:
        display = (s.get("display", "") or "").lower()
        tools = s.get("tools", {})

        if tools.get("Write", 0) + tools.get("Edit", 0) > 0:
            tech_scores["Code Generation"] += tools.get("Write", 0) + tools.get("Edit", 0)
        if tools.get("Bash", 0) + tools.get("shell_command", 0) > 0:
            tech_scores["Shell / CLI"] += tools.get("Bash", 0) + tools.get("shell_command", 0)
        if tools.get("Read", 0) + tools.get("Grep", 0) + tools.get("Glob", 0) > 0:
            tech_scores["Code Reading"] += tools.get("Read", 0) + tools.get("Grep", 0) + tools.get("Glob", 0)
        if tools.get("WebFetch", 0) + tools.get("WebSearch", 0) > 0:
            tech_scores["Web Research"] += tools.get("WebFetch", 0) + tools.get("WebSearch", 0)

        kw_map = {
            "HTML / CSS": ["html", "\u7f51\u9875", "css", "web", "landing"],
            "Python": ["python", ".py", "pip"],
            "Claude Code Skills": ["skill", "claude code", "anthropic"],
            "MCP Integrations": ["mcp", "supabase"],
            "Content Processing": ["pdf", "\u6587\u7ae0", "article", "\u7ffb\u8bd1", "translate"],
            "Product Strategy": ["product", "\u4ea7\u54c1", "\u6218\u7565", "strategy"],
            "AI Agent Ecosystem": ["agent", "manus", "openclaw", "codex"],
            "Media Automation": ["\u56fe\u7247", "image", "\u4e0b\u8f7d", "download", "\u89c6\u9891", "video"],
        }
        for tech, keywords in kw_map.items():
            if any(k in display for k in keywords):
                tech_scores[tech] += s["turns"]

    max_score = max(tech_scores.values()) if tech_scores else 1
    return {k: round(v / max_score * 100) for k, v in tech_scores.most_common(10)}


def compute_keywords(sessions):
    """Extract high-frequency keywords from session display text."""
    import re

    stop_words = {
        "\u7684", "\u4e86", "\u5417", "\u6211", "\u4f60", "\u662f", "\u8fd9", "\u4e2a", "\u5728", "\u6709", "\u548c", "\u4e5f",
        "\u90fd", "\u5c31", "\u4e0d", "\u8981", "\u4f1a", "\u80fd", "\u53ef\u4ee5", "\u4ec0\u4e48", "\u600e\u4e48", "\u4e00\u4e2a",
        "\u8fd9\u4e2a", "\u90a3\u4e2a", "\u770b", "\u5e2e", "\u505a", "\u7528", "\u7ed9", "\u5230", "\u8bf4", "\u8fd8", "\u91cc",
        "\u4e0b", "\u4e0a", "\u4e2d", "\u540e", "\u524d", "\u6765", "\u53bb", "\u628a", "\u88ab", "\u8ba9", "\u5c06",
        "\u5982\u4f55", "\u4e3a\u4ec0\u4e48", "\u4ee5\u53ca", "\u4f46\u662f", "\u7136\u540e", "\u6240\u4ee5", "\u56e0\u4e3a", "\u5982\u679c",
        "\u77e5\u9053", "\u73b0\u5728", "\u9700\u8981", "\u5e94\u8be5", "\u5df2\u7ecf", "\u53ef\u80fd", "\u5176\u4e2d", "\u5173\u4e8e",
        "\u770b\u5230", "\u770b\u5f97\u5230", "\u5148", "\u518d", "\u5427", "\u5462", "\u554a", "\u54e6", "\u561b",
        "\u5e2e\u6211", "\u770b\u4e0b", "\u6ca1\u6709", "\u4e00\u4e0b", "\u4e0d\u662f", "\u516c\u53f8", "\u4e4b\u540e", "\u95ee\u9898",
        "\u8fd9\u4e9b", "\u6211\u4eec", "\u7684\u8bdd", "\u770b\u770b", "\u65f6\u5019", "\u6bd4\u8f83", "\u8bb0\u5f97", "\u8fd8\u662f",
        "\u6709\u4e2a", "\u540c\u65f6", "\u4e0d\u8981", "\u6700\u8fd1", "\u4e4b\u524d", "\u5f53\u524d", "\u63a5\u4e0b\u6765", "\u8fdb\u6765",
        "\u4e0d\u89c1", "\u4e0d\u80fd", "\u8fdb\u884c", "\u751f\u6210", "\u603b\u7ed3", "\u6253\u5f00", "\u6574\u7406", "\u4e86\u89e3",
        "\u5904\u7406", "\u5206\u4eab", "\u4f7f\u7528",
        "the", "a", "an", "is", "are", "to", "of", "in", "for", "it", "my",
        "this", "that", "with", "on", "at", "by", "from", "or", "as", "be",
        "desktop", "https", "http", "www", "com", "\u6587\u4ef6", "\u5185\u5bb9", "pdf", "html",
    }

    all_words = []
    for s in sessions:
        display = (s.get("display", "") or "").strip()
        if not display or len(display) < 5:
            continue
        for phrase in re.findall(r"[\u4e00-\u9fff]{2,6}", display):
            if phrase not in stop_words:
                all_words.append(phrase)
        for word in re.findall(r"[a-zA-Z]{3,}", display):
            if word.lower() not in stop_words:
                all_words.append(word)

    counts = Counter(all_words)
    return [[w, c] for w, c in counts.most_common(30) if c >= 3]


def compute_evolution(sessions):
    """Compute weekly evolution of building activity."""
    weekly = defaultdict(lambda: {"sessions": 0, "turns": 0, "tool_calls": 0})

    for s in sessions:
        if not s["date"]:
            continue
        dt = datetime.strptime(s["date"], "%Y-%m-%d")
        week_start = dt - timedelta(days=dt.weekday())
        week_key = week_start.strftime("%Y-%m-%d")
        weekly[week_key]["sessions"] += 1
        weekly[week_key]["turns"] += s["turns"]
        weekly[week_key]["tool_calls"] += s["tool_calls"]

    result = []
    for week, data in sorted(weekly.items()):
        avg = round(data["turns"] / data["sessions"]) if data["sessions"] > 0 else 0
        result.append({
            "week": week,
            "sessions": data["sessions"],
            "turns": data["turns"],
            "tool_calls": data["tool_calls"],
            "avg_turns": avg,
        })
    return result


def compute_agent_comparison(sessions):
    """Compute per-agent stats for comparison."""
    agent_stats = defaultdict(lambda: {
        "sessions": 0, "turns": 0, "tool_calls": 0,
        "tools": Counter(), "turn_list": [],
    })

    for s in sessions:
        agent = s["agent"]
        agent_stats[agent]["sessions"] += 1
        agent_stats[agent]["turns"] += s["turns"]
        agent_stats[agent]["tool_calls"] += s["tool_calls"]
        agent_stats[agent]["turn_list"].append(s["turns"])
        for t, c in s.get("tools", {}).items():
            agent_stats[agent]["tools"][t] += c

    result = {}
    for agent, stats in agent_stats.items():
        avg = round(stats["turns"] / stats["sessions"]) if stats["sessions"] > 0 else 0
        top_tools = stats["tools"].most_common(5)
        short = sum(1 for t in stats["turn_list"] if t < 20)
        medium = sum(1 for t in stats["turn_list"] if 20 <= t < 100)
        long = sum(1 for t in stats["turn_list"] if t >= 100)
        result[agent] = {
            "sessions": stats["sessions"],
            "total_turns": stats["turns"],
            "total_tool_calls": stats["tool_calls"],
            "avg_turns": avg,
            "top_tools": [[t, c] for t, c in top_tools],
            "distribution": {"short": short, "medium": medium, "long": long},
        }
    return result


def parse_args():
    result = {}
    argv = sys.argv[1:]
    i = 0
    while i < len(argv):
        if argv[i] == "--claude-dir" and i + 1 < len(argv):
            result["claude_dir"] = argv[i + 1]; i += 2
        elif argv[i] == "--codex-dir" and i + 1 < len(argv):
            result["codex_dir"] = argv[i + 1]; i += 2
        elif argv[i] == "--trae-dir" and i + 1 < len(argv):
            result["trae_dir"] = argv[i + 1]; i += 2
        elif argv[i] == "--antigravity-dir" and i + 1 < len(argv):
            result["antigravity_dir"] = argv[i + 1]; i += 2
        elif argv[i] == "--kiro-dir" and i + 1 < len(argv):
            result["kiro_dir"] = argv[i + 1]; i += 2
        elif argv[i] == "--windsurf-dir" and i + 1 < len(argv):
            result["windsurf_dir"] = argv[i + 1]; i += 2
        elif argv[i] == "--openclaw-dir" and i + 1 < len(argv):
            result["openclaw_dir"] = argv[i + 1]; i += 2
        elif argv[i] == "--import-dir" and i + 1 < len(argv):
            result["import_dir"] = argv[i + 1]; i += 2
        elif argv[i] == "--days" and i + 1 < len(argv):
            result["days"] = argv[i + 1]; i += 2
        elif argv[i] == "--output" and i + 1 < len(argv):
            result["output"] = argv[i + 1]; i += 2
        else:
            i += 1
    return result


if __name__ == "__main__":
    main()
