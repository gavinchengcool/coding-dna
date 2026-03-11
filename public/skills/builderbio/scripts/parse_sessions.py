#!/usr/bin/env python3
"""Batch-parse all local Coding Agent sessions into a Builder Profile data model.

Scans Claude Code and Codex session logs, extracts lightweight summaries,
computes aggregate stats, and outputs a single JSON ready for profile generation.

Usage:
    python parse_sessions.py \
        --claude-dir ~/.claude \
        --codex-dir ~/.codex \
        --days 30 \
        --output /tmp/builder_profile_data.json
"""

import json
import sys
import os
import glob
from datetime import datetime, timedelta, timezone
from collections import Counter, defaultdict
from pathlib import Path


def main():
    args = parse_args()
    days = int(args.get("days", 0))
    if days > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    else:
        cutoff = datetime.min.replace(tzinfo=timezone.utc)  # no cutoff — include all

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

    # Sort by date descending
    sessions.sort(key=lambda s: s.get("date", ""), reverse=True)

    # Compute aggregates
    profile = compute_profile(sessions, days)
    heatmap = compute_heatmap(sessions, days)
    style = compute_style(sessions)
    highlights = compute_highlights(sessions)
    time_dist = compute_time_distribution(sessions, claude_dir, codex_dir)
    tech_stack = compute_tech_stack(sessions)
    keywords = compute_keywords(sessions)
    evolution = compute_evolution(sessions)
    comparison = compute_agent_comparison(sessions)

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

    print(f"Parsed {len(sessions)} sessions → {output}")
    print(f"  Claude Code: {sum(1 for s in sessions if s['agent']=='claude-code')}")
    print(f"  Codex: {sum(1 for s in sessions if s['agent']=='codex')}")


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


def load_stats_cache(claude_dir):
    """Load token stats from stats-cache.json if available."""
    stats_path = os.path.join(claude_dir, "statsCache.json")
    if not os.path.exists(stats_path):
        # Also check alternate location
        stats_path = os.path.join(claude_dir, "stats-cache.json")
    if not os.path.exists(stats_path):
        return None
    try:
        with open(stats_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return None


def parse_claude_code_sessions(claude_dir, cutoff, history):
    """Parse all Claude Code project session files."""
    sessions = []
    stats_cache = load_stats_cache(claude_dir)
    project_dirs = glob.glob(os.path.join(claude_dir, "projects", "*"))

    for pdir in project_dirs:
        jsonl_files = glob.glob(os.path.join(pdir, "*.jsonl"))
        for fp in jsonl_files:
            mtime = datetime.fromtimestamp(os.path.getmtime(fp), tz=timezone.utc)
            if mtime < cutoff:
                continue

            sid = Path(fp).stem
            summary = parse_claude_code_session(fp, sid, history)
            if summary and summary["turns"] > 0:
                sessions.append(summary)

    # If stats-cache has higher token counts, use those instead
    if stats_cache and sessions:
        model_usage = stats_cache.get("modelUsage", {})
        cache_total = 0
        for model_stats in model_usage.values():
            cache_total += model_stats.get("inputTokens", 0)
            cache_total += model_stats.get("outputTokens", 0)
            cache_total += model_stats.get("cacheReadInputTokens", 0)
            cache_total += model_stats.get("cacheCreationInputTokens", 0)

        parsed_total = sum(s.get("tokens", 0) for s in sessions)
        if cache_total > parsed_total * 1.5:
            # Stats cache has significantly more tokens — distribute proportionally
            ratio = cache_total / max(parsed_total, 1)
            for s in sessions:
                if s["agent"] == "claude-code":
                    s["tokens"] = int(s["tokens"] * ratio)

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
                    total_in += usage.get("cache_read_input_tokens", 0)
                    total_in += usage.get("cache_creation_input_tokens", 0)
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
    }


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
    total_in = 0
    total_out = 0
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
                    ptype = payload.get("type", "")
                    if ptype == "user_message":
                        user_turns += 1
                        if not first_user_msg:
                            first_user_msg = payload.get("message", "")[:200]
                    elif ptype == "token_count":
                        info = payload.get("info", {})
                        tu = info.get("total_token_usage", {})
                        total_in += tu.get("input_tokens", 0)
                        total_out += tu.get("output_tokens", 0)
                        total_out += tu.get("reasoning_output_tokens", 0)

                elif etype == "response_item":
                    ptype = payload.get("type", "")
                    if ptype == "message":
                        assistant_turns += 1
                    elif ptype == "function_call":
                        name = payload.get("name", "")
                        tool_counter[codex_tool_map.get(name, name)] += 1

                elif etype == "token_usage":
                    total_in += payload.get("input_tokens", 0)
                    total_out += payload.get("output_tokens", 0)

    except (OSError, IOError):
        return None

    if user_turns == 0 and assistant_turns == 0:
        return None

    duration = 0
    date_str = ""
    if start_ts and end_ts:
        duration = int((end_ts - start_ts).total_seconds())
        date_str = start_ts.strftime("%Y-%m-%d")

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
        "tokens": total_in + total_out,
        "duration_seconds": duration,
        "cwd": cwd,
        "git_branch": git_branch,
    }


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

    # Fill in zeros for all days in range
    end = datetime.now(timezone.utc).date()
    if days > 0:
        start = end - timedelta(days=days)
    elif daily:
        start = min(datetime.strptime(d, "%Y-%m-%d").date() for d in daily)
        # Extend to start of that week (Monday-aligned for heatmap)
        start = start - timedelta(days=start.weekday())
    else:
        start = end - timedelta(days=30)
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


def compute_time_distribution(sessions, claude_dir, codex_dir):
    """Extract hour-of-day distribution from session file timestamps."""
    hour_counts = defaultdict(int)
    hour_turns = defaultdict(int)

    for s in sessions:
        hour = None
        sid = s["id"]
        agent = s["agent"]

        if agent == "claude-code":
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

        elif agent == "codex":
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
        "deep_night": "深夜型 Builder",
        "morning": "上午型 Builder",
        "afternoon": "下午型 Builder",
        "evening": "夜猫子型 Builder",
    }

    return {
        "hour_distribution": {str(h): hour_counts[h] for h in range(24)},
        "period_data": period_data,
        "builder_type": type_labels.get(max_period[0], "全天型 Builder"),
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
            "HTML / CSS": ["html", "网页", "css", "web", "landing"],
            "Python": ["python", ".py", "pip"],
            "Claude Code Skills": ["skill", "claude code", "anthropic"],
            "MCP Integrations": ["mcp", "supabase"],
            "Content Processing": ["pdf", "文章", "article", "翻译", "translate"],
            "Product Strategy": ["product", "产品", "战略", "strategy"],
            "AI Agent Ecosystem": ["agent", "manus", "openclaw", "codex"],
            "Media Automation": ["图片", "image", "下载", "download", "视频", "video"],
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
        "的", "了", "吗", "我", "你", "是", "这", "个", "在", "有", "和", "也",
        "都", "就", "不", "要", "会", "能", "可以", "什么", "怎么", "一个",
        "这个", "那个", "看", "帮", "做", "用", "给", "到", "说", "还", "里",
        "下", "上", "中", "后", "前", "来", "去", "把", "被", "让", "将",
        "如何", "为什么", "以及", "但是", "然后", "所以", "因为", "如果",
        "知道", "现在", "需要", "应该", "已经", "可能", "其中", "关于",
        "看到", "看得到", "先", "再", "吧", "呢", "啊", "哦", "嘛",
        "帮我", "看下", "没有", "一下", "不是", "公司", "之后", "问题",
        "这些", "我们", "的话", "看看", "时候", "比较", "记得", "还是",
        "有个", "同时", "不要", "最近", "之前", "当前", "接下来", "进来",
        "不见", "不能", "进行", "生成", "总结", "打开", "整理", "了解",
        "处理", "分享", "使用",
        "the", "a", "an", "is", "are", "to", "of", "in", "for", "it", "my",
        "this", "that", "with", "on", "at", "by", "from", "or", "as", "be",
        "desktop", "https", "http", "www", "com", "文件", "内容", "pdf", "html",
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
        elif argv[i] == "--days" and i + 1 < len(argv):
            result["days"] = argv[i + 1]; i += 2
        elif argv[i] == "--output" and i + 1 < len(argv):
            result["output"] = argv[i + 1]; i += 2
        else:
            i += 1
    return result


if __name__ == "__main__":
    main()
