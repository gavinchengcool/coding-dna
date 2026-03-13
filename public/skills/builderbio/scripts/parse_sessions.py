#!/usr/bin/env python3
"""Batch-parse all local Coding Agent sessions into a Builder Profile data model.

Scans Claude Code, Codex, Trae, Antigravity, Kiro, Windsurf, OpenClaw, and
generic import sessions. Includes source discovery, schema probing, generic
fallback parsing, and an audit report so missing coverage is visible instead of
being silently dropped.

Usage:
    python parse_sessions.py \
        --claude-dir ~/.claude \
        --codex-dir ~/.codex \
        --trae-dir "~/Library/Application Support/Trae" \
        --cursor-dir "~/Library/Application Support/Cursor" \
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


SCANNER_VERSION = "0.7.3"
MAX_AUDIT_ITEMS = 25
WEAK_SCAN_LIMIT = 400
COMMON_DISCOVERY_ROOTS = [
    "~/.config",
    "~/Library/Application Support",
    "~/.cursor",
    "~/.vscode",
    "~/.codeium",
]
DISCOVERY_DIR_HINTS = {
    "claude",
    "codex",
    "cursor",
    "cline",
    "roo",
    "trae",
    "windsurf",
    "codeium",
    "kiro",
    "openclaw",
    "antigravity",
    "gemini",
    "goose",
    "augment",
    "continue",
    "agent",
    "chat",
    "session",
    "rollout",
    "workspace",
}
SKIP_DIR_NAMES = {
    ".git",
    "node_modules",
    "__pycache__",
    ".next",
    ".venv",
    "venv",
    "dist",
    "build",
    "Caches",
    "cache",
}
GENERIC_FILE_HINTS = (
    ".jsonl",
    ".json",
    ".db",
    ".sqlite",
    ".vscdb",
)
PATH_AGENT_HINTS = [
    ("claude", "claude-code"),
    ("codex", "codex"),
    ("trae", "trae"),
    ("antigravity", "antigravity"),
    ("gemini", "antigravity"),
    ("kiro", "kiro"),
    ("windsurf", "windsurf"),
    ("codeium", "windsurf"),
    ("openclaw", "openclaw"),
    ("cursor", "cursor"),
    ("cline", "cline"),
    ("roo", "roo-code"),
    ("augment", "augment"),
    ("goose", "goose"),
    ("continue", "continue"),
]


def main():
    args = parse_args()
    days = int(args.get("days", 30))
    if days <= 0:
        cutoff = datetime.fromtimestamp(0, tz=timezone.utc)
    else:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    claude_dir = os.path.expanduser(args.get("claude_dir", "~/.claude"))
    codex_dir = os.path.expanduser(args.get("codex_dir", "~/.codex"))
    trae_dir = os.path.expanduser(args.get("trae_dir", "~/Library/Application Support/Trae"))
    trae_cn_dir = os.path.expanduser("~/Library/Application Support/Trae CN")
    antigravity_dir = os.path.expanduser(args.get("antigravity_dir", "~/.antigravity_tools"))
    gemini_antigravity_dir = os.path.expanduser("~/.gemini/antigravity")
    cursor_dir = os.path.expanduser(
        args.get("cursor_dir", "~/Library/Application Support/Cursor")
    )
    kiro_dir = os.path.expanduser(args.get("kiro_dir", "~/.kiro"))
    windsurf_dir = os.path.expanduser(args.get("windsurf_dir", "~/.windsurf"))
    openclaw_dir = os.path.expanduser(args.get("openclaw_dir", "~/.openclaw"))
    import_dir = args.get("import_dir", "")
    if import_dir:
        import_dir = os.path.expanduser(import_dir)

    history = load_claude_history(claude_dir) if os.path.isdir(claude_dir) else {}
    audit = init_scan_audit(args, days, cutoff)
    discovery = discover_sources(
        args,
        claude_dir,
        codex_dir,
        trae_dir,
        trae_cn_dir,
        antigravity_dir,
        gemini_antigravity_dir,
        cursor_dir,
        kiro_dir,
        windsurf_dir,
        openclaw_dir,
        import_dir,
        history,
        audit,
    )
    sessions = parse_discovered_sources(discovery, cutoff, history, audit)

    # Sort by date descending
    sessions.sort(key=lambda s: s.get("date", ""), reverse=True)
    summarize_scan_audit(audit, sessions, discovery)

    # Compute aggregates
    profile = compute_profile(sessions, days)
    profile["scanner_version"] = SCANNER_VERSION
    profile["scan_status"] = audit["summary"]["status"]
    profile["scan_confidence"] = audit["summary"]["confidence"]
    profile["scan_recommendation"] = audit["summary"]["recommended_action"]
    profile["agent_sources_found"] = audit["agent_sources_found"]
    profile["scan_warnings"] = audit["warnings"][:5]
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
        "scanner_version": SCANNER_VERSION,
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
        "scan_audit": audit,
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
    print(
        "Audit: "
        f"{audit['summary']['status']} · "
        f"{audit['summary']['sources_parsed']}/{audit['summary']['sources_discovered']} sources parsed · "
        f"{audit['summary']['unknown_sources']} unknown sources · "
        f"{audit['summary']['partial_sessions']} partial sessions"
    )
    for warning in audit["warnings"][:5]:
        print(f"  ! {warning}")


def init_scan_audit(args, days, cutoff):
    return {
        "scanner_version": SCANNER_VERSION,
        "days": days,
        "cutoff": cutoff.isoformat(),
        "started_at": datetime.now(timezone.utc).isoformat(),
        "requested_roots": {
            "claude": args.get("claude_dir", "~/.claude"),
            "codex": args.get("codex_dir", "~/.codex"),
            "trae": args.get("trae_dir", "~/Library/Application Support/Trae"),
            "cursor": args.get("cursor_dir", "~/Library/Application Support/Cursor"),
            "antigravity": args.get("antigravity_dir", "~/.antigravity_tools"),
            "gemini_antigravity": "~/.gemini/antigravity",
            "kiro": args.get("kiro_dir", "~/.kiro"),
            "windsurf": args.get("windsurf_dir", "~/.windsurf"),
            "openclaw": args.get("openclaw_dir", "~/.openclaw"),
            "import": args.get("import_dir", ""),
        },
        "agent_sources_found": {},
        "agents": {},
        "warnings": [],
        "unknown_sources": [],
        "skipped_sources": [],
        "summary": {},
    }


def shorten_path(path):
    if not path:
        return ""
    home = str(Path.home())
    return path.replace(home, "~")


def init_agent_audit(audit, agent):
    agent_key = agent or "unknown"
    if agent_key not in audit["agents"]:
        audit["agents"][agent_key] = {
            "sources_discovered": 0,
            "sources_parsed": 0,
            "sessions_parsed": 0,
            "partial_sessions": 0,
            "strong_sources": 0,
            "weak_sources": 0,
            "source_samples": [],
            "warnings": [],
        }
    return audit["agents"][agent_key]


def add_limited_item(items, item):
    if len(items) < MAX_AUDIT_ITEMS:
        items.append(item)


def record_source_discovery(audit, source):
    agent_meta = init_agent_audit(audit, source["agent"])
    agent_meta["sources_discovered"] += 1
    if source["strength"] == "strong":
        agent_meta["strong_sources"] += 1
    else:
        agent_meta["weak_sources"] += 1
    if len(agent_meta["source_samples"]) < 5:
        agent_meta["source_samples"].append(shorten_path(source["path"]))
    audit["agent_sources_found"][source["agent"]] = (
        audit["agent_sources_found"].get(source["agent"], 0) + 1
    )


def record_unknown_source(audit, path, reason, probe_hint="", agent_hint=""):
    add_limited_item(
        audit["unknown_sources"],
        {
            "path": shorten_path(path),
            "reason": reason,
            "probe_hint": probe_hint,
            "agent_hint": agent_hint,
        },
    )
    if reason:
        add_warning(
            audit,
            f"Unparsed candidate source: {shorten_path(path)} ({reason})",
            agent_hint or "unknown",
        )


def add_warning(audit, message, agent=None):
    if message not in audit["warnings"]:
        add_limited_item(audit["warnings"], message)
    if agent:
        agent_meta = init_agent_audit(audit, agent)
        if message not in agent_meta["warnings"] and len(agent_meta["warnings"]) < 5:
            agent_meta["warnings"].append(message)


def infer_agent_from_path(path):
    lower = path.lower()
    for hint, agent in PATH_AGENT_HINTS:
        if hint in lower:
            return agent
    return "imported"


def make_source(agent, parser, path, strength, probe_hint="", root_key=""):
    return {
        "agent": agent,
        "parser": parser,
        "path": path,
        "strength": strength,
        "probe_hint": probe_hint or parser,
        "root_key": root_key,
    }


def add_source(discovery, audit, seen_paths, source, bucket):
    path = os.path.realpath(source["path"])
    if path in seen_paths:
        return
    source["path"] = path
    seen_paths.add(path)
    discovery[bucket].append(source)
    record_source_discovery(audit, source)


def discover_sources(
    _args,
    claude_dir,
    codex_dir,
    trae_dir,
    trae_cn_dir,
    antigravity_dir,
    gemini_antigravity_dir,
    cursor_dir,
    kiro_dir,
    windsurf_dir,
    openclaw_dir,
    import_dir,
    history,
    audit,
):
    discovery = {
        "strong_sources": [],
        "weak_sources": [],
        "roots": {
            "claude_dir": claude_dir,
            "codex_dir": codex_dir,
            "trae_dir": trae_dir,
            "trae_cn_dir": trae_cn_dir,
            "antigravity_dir": antigravity_dir,
            "gemini_antigravity_dir": gemini_antigravity_dir,
            "cursor_dir": cursor_dir,
            "kiro_dir": kiro_dir,
            "windsurf_dir": windsurf_dir,
            "openclaw_dir": openclaw_dir,
            "import_dir": import_dir,
            "history_entries": len(history),
        },
    }
    seen_paths = set()

    if os.path.isdir(claude_dir):
        for fp in glob.glob(os.path.join(claude_dir, "projects", "**", "*.jsonl"), recursive=True):
            add_source(
                discovery,
                audit,
                seen_paths,
                make_source("claude-code", "claude-file", fp, "strong", "claude-jsonl", "claude_dir"),
                "strong_sources",
            )

    if os.path.isdir(codex_dir):
        for fp in glob.glob(os.path.join(codex_dir, "sessions", "*", "*", "*", "*.jsonl")):
            add_source(
                discovery,
                audit,
                seen_paths,
                make_source("codex", "codex-file", fp, "strong", "codex-jsonl", "codex_dir"),
                "strong_sources",
            )

    for base_dir, root_key in [(trae_dir, "trae_dir"), (trae_cn_dir, "trae_cn_dir")]:
        if not os.path.isdir(base_dir):
            continue
        for root, _dirs, files in os.walk(os.path.join(base_dir, "User")):
            for fname in files:
                if fname == "state.vscdb":
                    add_source(
                        discovery,
                        audit,
                        seen_paths,
                        make_source("trae", "trae-db", os.path.join(root, fname), "strong", "trae-state-vscdb", root_key),
                        "strong_sources",
                    )

    antigravity_db = os.path.join(antigravity_dir, "proxy_logs.db")
    if os.path.isfile(antigravity_db):
        add_source(
            discovery,
            audit,
            seen_paths,
            make_source("antigravity", "antigravity-db", antigravity_db, "strong", "proxy-logs-db", "antigravity_dir"),
            "strong_sources",
        )

    gemini_conv_dir = os.path.join(gemini_antigravity_dir, "conversations")
    if os.path.isdir(gemini_conv_dir) and glob.glob(os.path.join(gemini_conv_dir, "*.pb")):
        add_source(
            discovery,
            audit,
            seen_paths,
            make_source(
                "antigravity",
                "antigravity-gemini",
                gemini_conv_dir,
                "strong",
                "gemini-conversations",
                "gemini_antigravity_dir",
            ),
            "strong_sources",
        )

    cursor_ws = os.path.join(cursor_dir, "User", "workspaceStorage")
    if os.path.isdir(cursor_ws):
        for root, _dirs, files in os.walk(cursor_ws):
            for fname in files:
                if fname == "state.vscdb":
                    add_source(
                        discovery,
                        audit,
                        seen_paths,
                        make_source(
                            "cursor",
                            "cursor-db",
                            os.path.join(root, fname),
                            "strong",
                            "cursor-state-vscdb",
                            "cursor_dir",
                        ),
                        "strong_sources",
                    )

    if os.path.isdir(kiro_dir):
        for fp in glob.glob(os.path.join(kiro_dir, "*.db")):
            add_source(
                discovery,
                audit,
                seen_paths,
                make_source("kiro", "kiro-db", fp, "strong", "kiro-db", "kiro_dir"),
                "strong_sources",
            )
        for fp in glob.glob(os.path.join(kiro_dir, "exports", "*.json")) + glob.glob(
            os.path.join(kiro_dir, "*.json")
        ):
            add_source(
                discovery,
                audit,
                seen_paths,
                make_source("kiro", "kiro-json", fp, "strong", "kiro-json", "kiro_dir"),
                "strong_sources",
            )

    for sdir in [
        os.path.join(windsurf_dir, "transcripts"),
        os.path.expanduser("~/.codeium/windsurf/cascade"),
    ]:
        if not os.path.isdir(sdir):
            continue
        for fp in glob.glob(os.path.join(sdir, "*.jsonl")):
            add_source(
                discovery,
                audit,
                seen_paths,
                make_source("windsurf", "windsurf-file", fp, "strong", "windsurf-jsonl", "windsurf_dir"),
                "strong_sources",
            )

    if os.path.isdir(openclaw_dir):
        for fp in glob.glob(os.path.join(openclaw_dir, "agents", "*", "sessions", "*.jsonl")):
            add_source(
                discovery,
                audit,
                seen_paths,
                make_source("openclaw", "openclaw-file", fp, "strong", "openclaw-jsonl", "openclaw_dir"),
                "strong_sources",
            )

    if import_dir and os.path.isdir(import_dir):
        for fp in glob.glob(os.path.join(import_dir, "*.json")) + glob.glob(
            os.path.join(import_dir, "*.jsonl")
        ):
            parser = "import-jsonl" if fp.endswith(".jsonl") else "import-json"
            add_source(
                discovery,
                audit,
                seen_paths,
                make_source("imported", parser, fp, "strong", "generic-import", "import_dir"),
                "strong_sources",
            )

    for fp in discover_weak_candidates():
        real_path = os.path.realpath(fp)
        if real_path in seen_paths:
            continue
        probe = probe_source(real_path)
        if not probe["recognized"]:
            if probe["chat_like"] or probe["reason"]:
                record_unknown_source(
                    audit,
                    real_path,
                    probe["reason"],
                    probe.get("probe_hint", ""),
                    probe.get("agent", ""),
                )
            continue
        add_source(
            discovery,
            audit,
            seen_paths,
            make_source(
                probe["agent"],
                probe["parser"],
                real_path,
                "weak",
                probe.get("probe_hint", probe["parser"]),
                "",
            ),
            "weak_sources",
        )

    return discovery


def discover_weak_candidates():
    discovered = []
    seen = set()
    for root in COMMON_DISCOVERY_ROOTS:
        expanded = os.path.expanduser(root)
        if not os.path.exists(expanded):
            continue
        for path in walk_candidate_files(expanded):
            real_path = os.path.realpath(path)
            if real_path in seen:
                continue
            seen.add(real_path)
            discovered.append(real_path)
            if len(discovered) >= WEAK_SCAN_LIMIT:
                return discovered
    return discovered


def walk_candidate_files(root):
    stack = [(root, 0)]
    yielded = 0
    while stack and yielded < WEAK_SCAN_LIMIT:
        current, depth = stack.pop()
        try:
            with os.scandir(current) as entries:
                for entry in entries:
                    name_lower = entry.name.lower()
                    if entry.is_dir(follow_symlinks=False):
                        if name_lower in SKIP_DIR_NAMES:
                            continue
                        should_descend = (
                            depth < 2
                            or any(hint in name_lower for hint in DISCOVERY_DIR_HINTS)
                            or name_lower in {"user", "workspacestorage", "globalstorage", "sessions", "transcripts", "projects", "logs"}
                        )
                        if should_descend and depth < 6:
                            stack.append((entry.path, depth + 1))
                        continue

                    if not entry.is_file(follow_symlinks=False):
                        continue
                    if not entry.name.endswith(GENERIC_FILE_HINTS):
                        continue
                    path_lower = entry.path.lower()
                    if not any(hint in path_lower for hint in DISCOVERY_DIR_HINTS):
                        continue
                    yielded += 1
                    yield entry.path
        except OSError:
            continue


def probe_source(path):
    lower = path.lower()
    suffix = Path(path).suffix.lower()
    agent_hint = infer_agent_from_path(path)

    if os.path.basename(lower) == "proxy_logs.db":
        return {
            "recognized": True,
            "agent": "antigravity",
            "parser": "antigravity-db",
            "probe_hint": "proxy-logs-db",
            "chat_like": True,
            "reason": "",
        }
    if suffix == ".jsonl":
        return probe_jsonl_source(path, agent_hint)
    if suffix == ".json":
        return probe_json_source(path, agent_hint)
    if suffix in {".db", ".sqlite", ".vscdb"}:
        return probe_sqlite_source(path, agent_hint)
    return {
        "recognized": False,
        "agent": agent_hint,
        "parser": "",
        "probe_hint": "unknown-file",
        "chat_like": False,
        "reason": "unsupported file type",
    }


def probe_jsonl_source(path, agent_hint):
    event_types = set()
    roles = set()
    chat_like = False
    parsed_lines = 0
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue
                parsed_lines += 1
                if isinstance(entry, dict):
                    if entry.get("type"):
                        event_types.add(str(entry.get("type")))
                    if entry.get("role"):
                        roles.add(str(entry.get("role")).lower())
                    if entry.get("sessionId") or entry.get("messages") or entry.get("message"):
                        chat_like = True
                if parsed_lines >= 20:
                    break
    except OSError:
        return {
            "recognized": False,
            "agent": agent_hint,
            "parser": "",
            "probe_hint": "jsonl-open-failed",
            "chat_like": False,
            "reason": "could not read file",
        }

    if {"session_meta", "event_msg"} & event_types or "response_item" in event_types:
        return {
            "recognized": True,
            "agent": "codex",
            "parser": "codex-file",
            "probe_hint": "codex-jsonl",
            "chat_like": True,
            "reason": "",
        }

    if {"user_input", "planner_response", "code_action", "command_action", "search_action"} & event_types:
        return {
            "recognized": True,
            "agent": "windsurf",
            "parser": "windsurf-file",
            "probe_hint": "windsurf-jsonl",
            "chat_like": True,
            "reason": "",
        }

    if {"user", "assistant"} & event_types:
        parser = "openclaw-file" if "openclaw" in path.lower() else "claude-like-jsonl"
        agent = (
            "openclaw"
            if parser == "openclaw-file"
            else agent_hint
            if agent_hint != "imported"
            else "claude-code"
        )
        return {
            "recognized": True,
            "agent": agent,
            "parser": parser,
            "probe_hint": "assistant-jsonl",
            "chat_like": True,
            "reason": "",
        }

    if roles & {"user", "human", "assistant", "ai", "model"}:
        return {
            "recognized": True,
            "agent": agent_hint,
            "parser": "generic-jsonl",
            "probe_hint": "role-jsonl",
            "chat_like": True,
            "reason": "",
        }

    return {
        "recognized": False,
        "agent": agent_hint,
        "parser": "",
        "probe_hint": "jsonl-unrecognized",
        "chat_like": chat_like,
        "reason": "unrecognized JSONL schema",
    }


def probe_json_source(path, agent_hint):
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError):
        return {
            "recognized": False,
            "agent": agent_hint,
            "parser": "",
            "probe_hint": "json-open-failed",
            "chat_like": False,
            "reason": "could not parse JSON",
        }

    entries = data if isinstance(data, list) else [data]
    for entry in entries[:5]:
        if not isinstance(entry, dict):
            continue
        if {"id", "agent", "turns"}.issubset(entry.keys()):
            return {
                "recognized": True,
                "agent": str(entry.get("agent") or agent_hint),
                "parser": "import-json",
                "probe_hint": "preformatted-json",
                "chat_like": True,
                "reason": "",
            }
        messages = entry.get("messages")
        if isinstance(messages, list):
            return {
                "recognized": True,
                "agent": agent_hint,
                "parser": "generic-json",
                "probe_hint": "messages-json",
                "chat_like": True,
                "reason": "",
            }
    return {
        "recognized": False,
        "agent": agent_hint,
        "parser": "",
        "probe_hint": "json-unrecognized",
        "chat_like": False,
        "reason": "unrecognized JSON schema",
    }


def probe_sqlite_source(path, agent_hint):
    try:
        conn = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = {row["name"] for row in cur.fetchall()}

        if "request_logs" in tables:
            conn.close()
            return {
                "recognized": True,
                "agent": "antigravity",
                "parser": "antigravity-db",
                "probe_hint": "request-logs-table",
                "chat_like": True,
                "reason": "",
            }

        if "ai_code_hashes" in tables:
            conn.close()
            return {
                "recognized": False,
                "agent": "cursor",
                "parser": "",
                "probe_hint": "cursor-tracking-db",
                "chat_like": False,
                "reason": "",
            }

        if "ItemTable" in tables:
            cur.execute("SELECT key FROM ItemTable LIMIT 50")
            keys = [row["key"] for row in cur.fetchall() if row["key"]]
            conn.close()
            keys_text = " ".join(keys).lower()
            if "composer.composerdata" in keys_text or "aiservice.generations" in keys_text:
                return {
                    "recognized": True,
                    "agent": "cursor",
                    "parser": "cursor-db",
                    "probe_hint": "cursor-itemtable",
                    "chat_like": True,
                    "reason": "",
                }
            if "icube-ai" in keys_text or "chathistoryneedtobemigrated" in keys_text:
                return {
                    "recognized": True,
                    "agent": "trae",
                    "parser": "trae-db",
                    "probe_hint": "icube-itemtable",
                    "chat_like": True,
                    "reason": "",
                }
            return {
                "recognized": False,
                "agent": agent_hint,
                "parser": "",
                "probe_hint": "itemtable-unrecognized",
                "chat_like": "chat" in keys_text or "session" in keys_text,
                "reason": "ItemTable exists but no supported key family matched",
            }

        if {"sessions", "conversations", "chats", "chat_sessions"} & tables:
            conn.close()
            return {
                "recognized": True,
                "agent": "kiro" if agent_hint == "kiro" else agent_hint,
                "parser": "kiro-db",
                "probe_hint": "session-table",
                "chat_like": True,
                "reason": "",
            }

        conn.close()
    except (sqlite3.Error, OSError):
        return {
            "recognized": False,
            "agent": agent_hint,
            "parser": "",
            "probe_hint": "sqlite-open-failed",
            "chat_like": False,
            "reason": "could not inspect SQLite DB",
        }

    return {
        "recognized": False,
        "agent": agent_hint,
        "parser": "",
        "probe_hint": "sqlite-unrecognized",
        "chat_like": False,
        "reason": "unrecognized SQLite schema",
    }


def annotate_session(
    session,
    source_path="",
    parse_mode="complete",
    partial_reasons=None,
    parser="",
    discovery_strength="strong",
    probe_hint="",
    agent_override=None,
):
    if not session:
        return None
    if agent_override:
        session["agent"] = agent_override
    session.setdefault("source_refs", [])
    if source_path:
        short_path = shorten_path(source_path)
        if short_path not in session["source_refs"]:
            session["source_refs"].append(short_path)
    session["parse_mode"] = parse_mode
    session["partial_reasons"] = partial_reasons or []
    session["parser"] = parser or session.get("parser") or ""
    session["discovery_strength"] = discovery_strength
    session["probe_hint"] = probe_hint or session.get("probe_hint") or ""
    return session


def parse_discovered_sources(discovery, cutoff, history, audit):
    sessions = []
    seen_session_keys = set()

    if os.path.isdir(discovery["roots"]["claude_dir"]):
        claude_sessions = parse_claude_code_sessions(
            discovery["roots"]["claude_dir"], cutoff, history
        )
        register_sessions(sessions, claude_sessions, seen_session_keys, audit)
        mark_sources_parsed(audit, "claude-code", discovery["strong_sources"], "claude-file")

    if os.path.isdir(discovery["roots"]["codex_dir"]):
        codex_sessions = parse_codex_sessions(discovery["roots"]["codex_dir"], cutoff)
        register_sessions(sessions, codex_sessions, seen_session_keys, audit)
        mark_sources_parsed(audit, "codex", discovery["strong_sources"], "codex-file")

    if os.path.isdir(discovery["roots"]["trae_dir"]) or os.path.isdir(discovery["roots"]["trae_cn_dir"]):
        trae_sessions = parse_trae_sessions(
            discovery["roots"]["trae_dir"], discovery["roots"]["trae_cn_dir"], cutoff
        )
        register_sessions(sessions, trae_sessions, seen_session_keys, audit)
        mark_sources_parsed(audit, "trae", discovery["strong_sources"], "trae-db")

    if os.path.isdir(discovery["roots"]["antigravity_dir"]):
        antigravity_sessions = parse_antigravity_sessions(
            discovery["roots"]["antigravity_dir"], cutoff
        )
        register_sessions(sessions, antigravity_sessions, seen_session_keys, audit)
        mark_sources_parsed(audit, "antigravity", discovery["strong_sources"], "antigravity-db")

    gemini_ag_dir = discovery["roots"].get("gemini_antigravity_dir", "")
    if gemini_ag_dir and os.path.isdir(gemini_ag_dir):
        gemini_ag_sessions = parse_antigravity_gemini_sessions(gemini_ag_dir, cutoff)
        register_sessions(sessions, gemini_ag_sessions, seen_session_keys, audit)
        mark_sources_parsed(audit, "antigravity", discovery["strong_sources"], "antigravity-gemini")

    if os.path.isdir(discovery["roots"].get("cursor_dir", "")):
        cursor_sessions = parse_cursor_sessions(discovery["roots"]["cursor_dir"], cutoff)
        register_sessions(sessions, cursor_sessions, seen_session_keys, audit)
        mark_sources_parsed(audit, "cursor", discovery["strong_sources"], "cursor-db")

    if os.path.isdir(discovery["roots"]["kiro_dir"]):
        kiro_sessions = parse_kiro_sessions(discovery["roots"]["kiro_dir"], cutoff)
        register_sessions(sessions, kiro_sessions, seen_session_keys, audit)
        mark_sources_parsed(audit, "kiro", discovery["strong_sources"], "kiro-db")
        mark_sources_parsed(audit, "kiro", discovery["strong_sources"], "kiro-json")

    if os.path.isdir(discovery["roots"]["windsurf_dir"]) or os.path.isdir(
        os.path.expanduser("~/.codeium/windsurf/cascade")
    ):
        windsurf_sessions = parse_windsurf_sessions(
            discovery["roots"]["windsurf_dir"], cutoff
        )
        register_sessions(sessions, windsurf_sessions, seen_session_keys, audit)
        mark_sources_parsed(audit, "windsurf", discovery["strong_sources"], "windsurf-file")

    if os.path.isdir(discovery["roots"]["openclaw_dir"]):
        openclaw_sessions = parse_openclaw_sessions(
            discovery["roots"]["openclaw_dir"], cutoff
        )
        register_sessions(sessions, openclaw_sessions, seen_session_keys, audit)
        mark_sources_parsed(audit, "openclaw", discovery["strong_sources"], "openclaw-file")

    if discovery["roots"]["import_dir"] and os.path.isdir(discovery["roots"]["import_dir"]):
        import_sessions = parse_import_sessions(discovery["roots"]["import_dir"], cutoff)
        register_sessions(sessions, import_sessions, seen_session_keys, audit)
        mark_sources_parsed(audit, "imported", discovery["strong_sources"], "import-json")
        mark_sources_parsed(audit, "imported", discovery["strong_sources"], "import-jsonl")

    for source in discovery["weak_sources"]:
        parsed = parse_source_with_fallback(source, cutoff, history, audit)
        if parsed:
            init_agent_audit(audit, source["agent"])["sources_parsed"] += 1
        register_sessions(sessions, parsed, seen_session_keys, audit)

    return sessions


def mark_sources_parsed(audit, agent, sources, parser_name):
    count = sum(1 for source in sources if source["agent"] == agent and source["parser"] == parser_name)
    if count:
        init_agent_audit(audit, agent)["sources_parsed"] += count


def register_sessions(target, new_sessions, seen_session_keys, audit):
    for session in new_sessions or []:
        if not session:
            continue
        key = (session.get("agent", ""), session.get("id", ""))
        if key in seen_session_keys:
            continue
        seen_session_keys.add(key)
        target.append(session)
        agent_meta = init_agent_audit(audit, session.get("agent", "unknown"))
        agent_meta["sessions_parsed"] += 1
        if session.get("parse_mode") != "complete":
            agent_meta["partial_sessions"] += 1


def parse_source_with_fallback(source, cutoff, history, audit):
    path = source["path"]
    parser = source["parser"]
    agent = source["agent"]
    parse_mode = "partial"
    reasons = ["generic_fallback"]
    sessions = []

    if parser == "codex-file":
        summary = parse_codex_session(path)
        if summary and summary.get("date"):
            ts = parse_ts(summary.get("date"))
            if not ts or ts >= cutoff:
                sessions = [
                    annotate_session(
                        summary,
                        source_path=path,
                        parse_mode="complete",
                        partial_reasons=[],
                        parser=parser,
                        discovery_strength=source["strength"],
                        probe_hint=source["probe_hint"],
                    )
                ]
                reasons = []
                parse_mode = "complete"
    elif parser == "windsurf-file":
        summary = _parse_windsurf_file(path, Path(path).stem)
        if summary:
            sessions = [
                annotate_session(
                    summary,
                    source_path=path,
                    parse_mode="partial",
                    partial_reasons=["tokens_unavailable"],
                    parser=parser,
                    discovery_strength=source["strength"],
                    probe_hint=source["probe_hint"],
                )
            ]
            reasons = ["tokens_unavailable"]
    elif parser == "openclaw-file":
        summary = _parse_openclaw_file(path, Path(path).stem)
        if summary:
            sessions = [
                annotate_session(
                    summary,
                    source_path=path,
                    parse_mode="complete",
                    partial_reasons=[],
                    parser=parser,
                    discovery_strength=source["strength"],
                    probe_hint=source["probe_hint"],
                    agent_override=agent,
                )
            ]
            reasons = []
            parse_mode = "complete"
    elif parser == "claude-like-jsonl":
        summary = parse_claude_code_session(path, infer_claude_session_id(path), history)
        if summary:
            sessions = [
                annotate_session(
                    summary,
                    source_path=path,
                    parse_mode="partial" if agent != "claude-code" else "complete",
                    partial_reasons=[] if agent == "claude-code" else ["generic_agent_mapping"],
                    parser=parser,
                    discovery_strength=source["strength"],
                    probe_hint=source["probe_hint"],
                    agent_override=agent,
                )
            ]
            reasons = [] if agent == "claude-code" else ["generic_agent_mapping"]
            parse_mode = "complete" if agent == "claude-code" else "partial"
    elif parser == "generic-jsonl":
        summary = _parse_import_jsonl(path, cutoff, agent_override=agent)
        if summary:
            sessions = [
                annotate_session(
                    summary,
                    source_path=path,
                    parse_mode=parse_mode,
                    partial_reasons=reasons,
                    parser=parser,
                    discovery_strength=source["strength"],
                    probe_hint=source["probe_hint"],
                )
            ]
    elif parser == "generic-json":
        sessions = [
            annotate_session(
                session,
                source_path=path,
                parse_mode=parse_mode,
                partial_reasons=reasons,
                parser=parser,
                discovery_strength=source["strength"],
                probe_hint=source["probe_hint"],
                agent_override=agent,
            )
            for session in _parse_import_json(path, cutoff)
        ]
    elif parser == "import-json":
        sessions = [
            annotate_session(
                session,
                source_path=path,
                parse_mode="partial",
                partial_reasons=["imported_session"],
                parser=parser,
                discovery_strength=source["strength"],
                probe_hint=source["probe_hint"],
            )
            for session in _parse_import_json(path, cutoff)
        ]
    elif parser == "import-jsonl":
        summary = _parse_import_jsonl(path, cutoff, agent_override=agent)
        if summary:
            sessions = [
                annotate_session(
                    summary,
                    source_path=path,
                    parse_mode="partial",
                    partial_reasons=["imported_session"],
                    parser=parser,
                    discovery_strength=source["strength"],
                    probe_hint=source["probe_hint"],
                )
            ]
    elif parser == "kiro-db":
        seen_ids = set()
        sessions = [
            annotate_session(
                session,
                source_path=path,
                parse_mode="partial",
                partial_reasons=["schema_discovery"],
                parser=parser,
                discovery_strength=source["strength"],
                probe_hint=source["probe_hint"],
                agent_override=agent,
            )
            for session in _parse_kiro_db(path, cutoff, seen_ids)
        ]
    elif parser == "kiro-json":
        seen_ids = set()
        sessions = [
            annotate_session(
                session,
                source_path=path,
                parse_mode="partial",
                partial_reasons=["schema_discovery"],
                parser=parser,
                discovery_strength=source["strength"],
                probe_hint=source["probe_hint"],
                agent_override=agent,
            )
            for session in _parse_kiro_json(path, cutoff, seen_ids)
        ]
    elif parser == "trae-db":
        sessions = [
            annotate_session(
                session,
                source_path=path,
                parse_mode="partial",
                partial_reasons=["tokens_unavailable"],
                parser=parser,
                discovery_strength=source["strength"],
                probe_hint=source["probe_hint"],
            )
            for session in _parse_trae_db(path, cutoff, set())
        ]
    elif parser == "cursor-db":
        sessions = [
            annotate_session(
                session,
                source_path=path,
                parse_mode="partial",
                partial_reasons=session.get("partial_reasons") or ["tokens_unavailable"],
                parser=parser,
                discovery_strength=source["strength"],
                probe_hint=source["probe_hint"],
                agent_override=agent,
            )
            for session in _parse_cursor_db(
                path,
                cutoff,
                set(),
                _load_cursor_tracking(),
                _read_cursor_workspace_folder(os.path.dirname(path)),
            )
        ]

    if not sessions:
        add_limited_item(
            audit["skipped_sources"],
            {
                "path": shorten_path(path),
                "agent": agent,
                "parser": parser,
                "reason": "probe matched but parser produced no sessions",
            },
        )
    return sessions


def summarize_scan_audit(audit, sessions, discovery):
    partial_sessions = sum(1 for session in sessions if session.get("parse_mode") != "complete")
    sources_discovered = len(discovery["strong_sources"]) + len(discovery["weak_sources"])
    sources_parsed = sum(meta["sources_parsed"] for meta in audit["agents"].values())
    unknown_sources = len(audit["unknown_sources"])
    skipped_sources = len(audit["skipped_sources"])
    status = "complete"
    if not sessions:
        status = "empty"
    elif partial_sessions > 0 or unknown_sources > 0 or skipped_sources > 0:
        status = "partial"
    confidence = 1.0
    if sources_discovered > 0:
        confidence = round(max(0.35, min(1.0, sources_parsed / sources_discovered)), 2)
    recommended_action = ""
    if status == "partial":
        recommended_action = (
            "Re-run BuilderBio with the latest skill if you used agents that are missing "
            "from the badges or if the audit lists unknown sources."
        )
    elif status == "empty":
        recommended_action = "No supported session logs were parsed. Check the audit and add imports if needed."

    audit["summary"] = {
        "status": status,
        "confidence": confidence,
        "sessions_parsed": len(sessions),
        "sources_discovered": sources_discovered,
        "sources_parsed": sources_parsed,
        "partial_sessions": partial_sessions,
        "unknown_sources": unknown_sources,
        "skipped_sources": skipped_sources,
        "agents_found": sorted(audit["agent_sources_found"].keys()),
        "recommended_action": recommended_action,
    }


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
        "source_refs": [],
    }


def update_claude_session_accumulator(acc, entry, source_path=""):
    """Merge one Claude JSONL entry into a logical session summary."""
    if source_path:
        short_path = shorten_path(source_path)
        if short_path not in acc["source_refs"]:
            acc["source_refs"].append(short_path)
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
        "source_refs": acc["source_refs"],
        "parser": "claude-file",
        "parse_mode": "complete",
        "partial_reasons": [],
        "discovery_strength": "strong",
        "probe_hint": "claude-jsonl",
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
                    update_claude_session_accumulator(acc, entry, fp)
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
        "source_refs": [shorten_path(filepath)],
        "parser": "claude-file",
        "parse_mode": "complete",
        "partial_reasons": [],
        "discovery_strength": "strong",
        "probe_hint": "claude-jsonl",
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
        "source_refs": [shorten_path(filepath)],
        "parser": "codex-file",
        "parse_mode": "complete",
        "partial_reasons": [],
        "discovery_strength": "strong",
        "probe_hint": "codex-jsonl",
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
               OR key LIKE 'chatHistoryNeedToBeMigrated-%'
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
                    "source_refs": [shorten_path(db_path)],
                    "parser": "trae-db",
                    "parse_mode": "partial",
                    "partial_reasons": ["tokens_unavailable"],
                    "discovery_strength": "strong",
                    "probe_hint": "trae-state-vscdb",
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
            "source_refs": [shorten_path(db_path)],
            "parser": "antigravity-db",
            "parse_mode": "complete",
            "partial_reasons": [],
            "discovery_strength": "strong",
            "probe_hint": "proxy-logs-db",
        })

    return sessions


# ---------------------------------------------------------------------------
# Antigravity (Gemini App) metadata fallback parser
# ---------------------------------------------------------------------------

GEMINI_BYTES_PER_TURN = 15000


def parse_antigravity_gemini_sessions(gemini_dir, cutoff):
    """Recover Antigravity sessions from Gemini app metadata.

    The Gemini-hosted Antigravity client stores encrypted conversation blobs in
    conversations/*.pb. We cannot decode the payload without runtime keys, but
    we can still recover useful session metadata from file timestamps, file
    size, and brain-side markdown/metadata artifacts.
    """
    conv_dir = os.path.join(gemini_dir, "conversations")
    brain_dir = os.path.join(gemini_dir, "brain")

    if not os.path.isdir(conv_dir):
        return []

    pb_files = glob.glob(os.path.join(conv_dir, "*.pb"))
    if not pb_files:
        return []

    sessions = []

    for pb_path in sorted(pb_files):
        cid = Path(pb_path).stem

        try:
            stat = os.stat(pb_path)
            created_at = datetime.fromtimestamp(
                getattr(stat, "st_birthtime", stat.st_ctime),
                tz=timezone.utc,
            )
            updated_at = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc)
            pb_size = stat.st_size
        except OSError:
            continue

        if created_at < cutoff:
            continue

        est_turns = max(2, pb_size // GEMINI_BYTES_PER_TURN)
        duration = max(0, int((updated_at - created_at).total_seconds()))
        display = ""
        summary = ""
        brain_path = os.path.join(brain_dir, cid)

        if os.path.isdir(brain_path):
            meta_files = glob.glob(os.path.join(brain_path, "*.metadata.json"))
            for meta_path in meta_files:
                try:
                    with open(meta_path, "r", encoding="utf-8") as f:
                        meta = json.load(f)
                    candidate = meta.get("summary", "")
                    if candidate and len(candidate) > len(summary):
                        summary = candidate
                except (OSError, json.JSONDecodeError, TypeError):
                    continue

            for md_path in glob.glob(os.path.join(brain_path, "*.md")):
                try:
                    with open(md_path, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line.startswith("# "):
                                display = line[2:].strip()[:100]
                                break
                except OSError:
                    continue
                if display:
                    break

        if not display and summary:
            display = summary[:100]
        if not display:
            display = f"Antigravity session {cid[:8]}"

        sessions.append(
            {
                "id": f"ag-gemini-{cid[:12]}",
                "agent": "antigravity",
                "model": "gemini",
                "version": "",
                "date": created_at.strftime("%Y-%m-%d"),
                "display": display,
                "first_msg": display,
                "turns": est_turns,
                "user_turns": est_turns // 2,
                "assistant_turns": est_turns - est_turns // 2,
                "tool_calls": 0,
                "tools": {},
                "tokens": 0,
                "duration_seconds": duration,
                "cwd": "",
                "git_branch": "",
                "_start_hour": created_at.hour,
                "start_time": created_at.isoformat(),
                "end_time": updated_at.isoformat(),
                "source_refs": [shorten_path(pb_path)],
                "parser": "antigravity-gemini",
                "parse_mode": "partial",
                "partial_reasons": ["encrypted-pb-metadata-only"],
                "discovery_strength": "strong",
                "probe_hint": "gemini-conversations",
            }
        )

    return sessions


# ---------------------------------------------------------------------------
# Cursor parser
# ---------------------------------------------------------------------------

def parse_cursor_sessions(cursor_dir, cutoff):
    """Parse Cursor sessions from workspace state.vscdb files."""
    sessions = []
    seen_ids = set()
    tracking = _load_cursor_tracking()
    ws_root = os.path.join(cursor_dir, "User", "workspaceStorage")

    if not os.path.isdir(ws_root):
        return sessions

    for ws_name in os.listdir(ws_root):
        ws_dir = os.path.join(ws_root, ws_name)
        db_path = os.path.join(ws_dir, "state.vscdb")
        if not os.path.isfile(db_path):
            continue
        cwd = _read_cursor_workspace_folder(ws_dir)
        sessions.extend(_parse_cursor_db(db_path, cutoff, seen_ids, tracking, cwd))

    return sessions


def _load_cursor_tracking():
    """Load Cursor ai-code-tracking.db conversation stats."""
    tracking = {}
    db_path = os.path.expanduser("~/.cursor/ai-tracking/ai-code-tracking.db")
    if not os.path.isfile(db_path):
        return tracking

    try:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        cur = conn.cursor()
        cur.execute(
            "SELECT conversationId, COUNT(*) as hashes, "
            "GROUP_CONCAT(DISTINCT model) as models, "
            "GROUP_CONCAT(DISTINCT fileExtension) as exts, "
            "MIN(timestamp) as start_ts, MAX(timestamp) as end_ts "
            "FROM ai_code_hashes "
            "WHERE conversationId IS NOT NULL "
            "GROUP BY conversationId"
        )
        for row in cur.fetchall():
            conversation_id = row[0]
            tracking[conversation_id] = {
                "hashes": row[1],
                "models": set(item for item in (row[2] or "").split(",") if item),
                "file_extensions": set(item for item in (row[3] or "").split(",") if item),
                "start_ts": row[4],
                "end_ts": row[5],
            }
        conn.close()
    except (sqlite3.Error, OSError):
        return {}

    return tracking


def _read_cursor_workspace_folder(ws_dir):
    """Read a Cursor workspace folder hint from workspace.json."""
    ws_json = os.path.join(ws_dir, "workspace.json")
    if not os.path.isfile(ws_json):
        return ""
    try:
        with open(ws_json, "r", encoding="utf-8") as f:
            data = json.load(f)
        folder = data.get("folder", "")
        if folder.startswith("file://"):
            from urllib.parse import unquote, urlparse

            parsed = urlparse(folder)
            return unquote(parsed.path)
        if folder.startswith("vscode-remote://"):
            parts = folder.split("/", 3)
            if len(parts) >= 4:
                return "/" + parts[3]
        return folder
    except (OSError, json.JSONDecodeError, TypeError):
        return ""


def _parse_cursor_db(db_path, cutoff, seen_ids, tracking, cwd):
    """Extract Cursor composer sessions from a single state.vscdb."""
    results = []
    try:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        gen_count = 0
        cur.execute("SELECT value FROM ItemTable WHERE key = 'aiService.generations'")
        gen_row = cur.fetchone()
        if gen_row:
            payload = gen_row[0]
            if isinstance(payload, (bytes, bytearray)):
                payload = payload.decode("utf-8", errors="replace")
            try:
                generations = json.loads(payload)
                if isinstance(generations, list):
                    gen_count = len(generations)
            except (json.JSONDecodeError, TypeError):
                pass

        cur.execute("SELECT value FROM ItemTable WHERE key = 'composer.composerData'")
        row = cur.fetchone()
        if row:
            payload = row[0]
            if isinstance(payload, (bytes, bytearray)):
                payload = payload.decode("utf-8", errors="replace")
            try:
                data = json.loads(payload)
            except (json.JSONDecodeError, TypeError):
                data = {}

            composers = data.get("allComposers", [])
            if isinstance(composers, list):
                for composer in composers:
                    if not isinstance(composer, dict):
                        continue
                    cid = composer.get("composerId", "")
                    if not cid or cid in seen_ids:
                        continue

                    name = composer.get("name", "")
                    if not name or name == "?":
                        continue

                    start_ts = parse_ts(composer.get("createdAt"))
                    end_ts = parse_ts(composer.get("lastUpdatedAt"))
                    if start_ts and start_ts < cutoff:
                        continue

                    lines_added = composer.get("totalLinesAdded", 0) or 0
                    lines_removed = composer.get("totalLinesRemoved", 0) or 0
                    files_changed = composer.get("filesChangedCount", 0) or 0
                    tracking_meta = tracking.get(cid, {})
                    code_hashes = tracking_meta.get("hashes", 0)
                    model_names = tracking_meta.get("models", set())
                    model_str = ", ".join(sorted(model_names)) if model_names else ""

                    if code_hashes > 0:
                        est_turns = max(2, code_hashes // 10)
                        tool_calls = max(1, code_hashes // 5)
                    else:
                        total_lines = lines_added + lines_removed
                        est_turns = max(2, total_lines // 50) if total_lines else 2
                        tool_calls = files_changed

                    duration = 0
                    date_str = ""
                    if start_ts:
                        date_str = start_ts.strftime("%Y-%m-%d")
                    if start_ts and end_ts:
                        duration = max(0, int((end_ts - start_ts).total_seconds()))

                    partial_reasons = ["tokens_unavailable"]
                    if not code_hashes:
                        partial_reasons.append("no_tracking_data")
                    if not model_str:
                        partial_reasons.append("model_unavailable")

                    seen_ids.add(cid)
                    subtitle = composer.get("subtitle", "")
                    results.append(
                        {
                            "id": f"cursor-{cid[:16]}",
                            "agent": "cursor",
                            "model": model_str,
                            "version": "",
                            "date": date_str,
                            "display": name[:100],
                            "first_msg": (subtitle[:200] if subtitle else name[:200]),
                            "turns": est_turns,
                            "user_turns": est_turns // 2,
                            "assistant_turns": est_turns - est_turns // 2,
                            "tool_calls": tool_calls,
                            "tools": {},
                            "tokens": 0,
                            "duration_seconds": duration,
                            "cwd": cwd,
                            "git_branch": "",
                            "_start_hour": start_ts.hour if start_ts else None,
                            "source_refs": [shorten_path(db_path)],
                            "parser": "cursor-db",
                            "parse_mode": "partial",
                            "partial_reasons": partial_reasons,
                            "discovery_strength": "strong",
                            "probe_hint": "cursor-state-vscdb",
                        }
                    )

        if not results and gen_count > 0:
            session_id = f"cursor-gen-{uuid.uuid4().hex[:8]}"
            if session_id not in seen_ids:
                seen_ids.add(session_id)
                results.append(
                    {
                        "id": session_id,
                        "agent": "cursor",
                        "model": "",
                        "version": "",
                        "date": "",
                        "display": f"{gen_count} AI generations",
                        "first_msg": "",
                        "turns": gen_count,
                        "user_turns": gen_count,
                        "assistant_turns": gen_count,
                        "tool_calls": 0,
                        "tools": {},
                        "tokens": 0,
                        "duration_seconds": 0,
                        "cwd": cwd,
                        "git_branch": "",
                        "_start_hour": None,
                        "source_refs": [shorten_path(db_path)],
                        "parser": "cursor-db",
                        "parse_mode": "partial",
                        "partial_reasons": ["generations_only"],
                        "discovery_strength": "strong",
                        "probe_hint": "cursor-state-vscdb",
                    }
                )

        conn.close()
    except (sqlite3.Error, OSError):
        return results

    return results


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
                    "source_refs": [shorten_path(db_path)],
                    "parser": "kiro-db",
                    "parse_mode": "partial",
                    "partial_reasons": ["schema_discovery"],
                    "discovery_strength": "strong",
                    "probe_hint": "kiro-db",
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
            "source_refs": [shorten_path(filepath)],
            "parser": "kiro-json",
            "parse_mode": "partial",
            "partial_reasons": ["schema_discovery"],
            "discovery_strength": "strong",
            "probe_hint": "kiro-json",
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
        "source_refs": [shorten_path(filepath)],
        "parser": "windsurf-file",
        "parse_mode": "partial",
        "partial_reasons": ["tokens_unavailable"],
        "discovery_strength": "strong",
        "probe_hint": "windsurf-jsonl",
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
        "source_refs": [shorten_path(filepath)],
        "parser": "openclaw-file",
        "parse_mode": "complete",
        "partial_reasons": [],
        "discovery_strength": "strong",
        "probe_hint": "openclaw-jsonl",
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
            "source_refs": [shorten_path(filepath)],
            "parser": "import-json",
            "parse_mode": "partial",
            "partial_reasons": ["imported_session"],
            "discovery_strength": "strong",
            "probe_hint": "preformatted-json",
        }
        results.append(session)

    return results


def _parse_import_jsonl(filepath, cutoff, agent_override="imported"):
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
        "agent": agent_override or "imported",
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
        "source_refs": [shorten_path(filepath)],
        "parser": "import-jsonl",
        "parse_mode": "partial",
        "partial_reasons": ["imported_session"],
        "discovery_strength": "strong",
        "probe_hint": "role-jsonl",
    }


# ---------------------------------------------------------------------------
# Shared utilities
# ---------------------------------------------------------------------------

def parse_ts(ts):
    """Parse timestamp to datetime."""
    if not ts:
        return None
    if isinstance(ts, (int, float)):
        value = float(ts)
        if value > 1e12:
            value = value / 1000
        return datetime.fromtimestamp(value, tz=timezone.utc)
    if isinstance(ts, str):
        try:
            parsed = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed
        except ValueError:
            return None
    return None


def compute_profile(sessions, days):
    """Compute aggregate profile stats."""
    agents = defaultdict(lambda: {"sessions": 0, "turns": 0, "first_session": ""})
    active_dates = set()
    total_turns = 0
    total_tools = 0
    total_tokens = 0

    for s in sessions:
        agents[s["agent"]]["sessions"] += 1
        agents[s["agent"]]["turns"] += s["turns"]
        if s["date"]:
            current_first = agents[s["agent"]]["first_session"]
            if not current_first or s["date"] < current_first:
                agents[s["agent"]]["first_session"] = s["date"]
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
        elif argv[i] == "--cursor-dir" and i + 1 < len(argv):
            result["cursor_dir"] = argv[i + 1]; i += 2
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
