#!/usr/bin/env python3
"""
Local statistics computation for coding-dna.
Analyzes session files to generate activity heatmap, token estimates,
and behavioral fingerprint — all locally, no data leaves your machine.
"""

import json
import sys
import os
from datetime import datetime, timedelta
from collections import defaultdict
from pathlib import Path

def estimate_tokens(text: str) -> int:
    """Rough token estimation: ~4 chars per token"""
    return len(text) // 4

def parse_jsonl(filepath: str) -> list:
    """Parse a JSONL file into list of message objects"""
    messages = []
    try:
        with open(filepath, 'r') as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        messages.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
    except Exception:
        pass
    return messages

def parse_json(filepath: str) -> list:
    """Parse a JSON file (Cursor format)"""
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            if isinstance(data, dict) and 'messages' in data:
                return data['messages']
    except Exception:
        pass
    return []

def compute_activity_map(messages: list) -> dict:
    """Generate activity heatmap data (day -> hour -> count)"""
    heatmap = defaultdict(lambda: defaultdict(int))

    for msg in messages:
        ts = msg.get('timestamp') or msg.get('created_at') or msg.get('ts')
        if not ts:
            continue

        try:
            if isinstance(ts, (int, float)):
                dt = datetime.fromtimestamp(ts / 1000 if ts > 1e12 else ts)
            else:
                dt = datetime.fromisoformat(str(ts).replace('Z', '+00:00'))

            date_key = dt.strftime('%Y-%m-%d')
            hour = dt.hour
            heatmap[date_key][hour] += 1
        except (ValueError, TypeError):
            continue

    # Convert defaultdicts to regular dicts
    return {date: dict(hours) for date, hours in heatmap.items()}

def compute_behavioral_fingerprint(messages: list) -> dict:
    """Compute behavioral patterns from message content"""
    user_messages = [m for m in messages if m.get('role') == 'user' or m.get('type') == 'human']
    assistant_messages = [m for m in messages if m.get('role') == 'assistant' or m.get('type') == 'assistant']

    # Average message length
    user_lengths = [len(str(m.get('content', ''))) for m in user_messages]
    avg_user_len = sum(user_lengths) / max(len(user_lengths), 1)

    # Question ratio
    questions = sum(1 for m in user_messages if '?' in str(m.get('content', '')))
    question_ratio = questions / max(len(user_messages), 1)

    # Code block ratio in user messages
    code_blocks = sum(1 for m in user_messages if '```' in str(m.get('content', '')))
    code_ratio = code_blocks / max(len(user_messages), 1)

    # Conversation depth (turns per session)
    total_turns = len(user_messages) + len(assistant_messages)

    # Iteration pattern: how often user follows up vs starts new
    short_messages = sum(1 for l in user_lengths if l < 50)
    iteration_ratio = short_messages / max(len(user_lengths), 1)

    return {
        'avg_prompt_length': round(avg_user_len),
        'question_ratio': round(question_ratio, 3),
        'code_sharing_ratio': round(code_ratio, 3),
        'total_turns': total_turns,
        'iteration_ratio': round(iteration_ratio, 3),
        'total_user_messages': len(user_messages),
        'total_assistant_messages': len(assistant_messages),
    }

def main():
    sessions_file = sys.argv[1] if len(sys.argv) > 1 else '/tmp/coding-dna-sessions.json'
    output_file = sys.argv[2] if len(sys.argv) > 2 else '/tmp/coding-dna-stats.json'

    # Load session list
    with open(sessions_file, 'r') as f:
        sessions = json.load(f)

    all_messages = []
    total_tokens = 0
    sessions_analyzed = 0

    for session in sessions:
        filepath = session['path']
        filetype = session.get('type', 'jsonl')

        if not os.path.exists(filepath):
            continue

        if filetype == 'jsonl':
            messages = parse_jsonl(filepath)
        else:
            messages = parse_json(filepath)

        if messages:
            sessions_analyzed += 1
            all_messages.extend(messages)

            for msg in messages:
                content = str(msg.get('content', ''))
                total_tokens += estimate_tokens(content)

    # Compute stats
    activity_map = compute_activity_map(all_messages)
    fingerprint = compute_behavioral_fingerprint(all_messages)

    stats = {
        'sessions_analyzed': sessions_analyzed,
        'total_tokens': total_tokens,
        'total_messages': len(all_messages),
        'activity_map': activity_map,
        'behavioral_fingerprint': fingerprint,
        'computed_at': datetime.now().isoformat(),
    }

    with open(output_file, 'w') as f:
        json.dump(stats, f, indent=2)

    print(f'→ Stats computed: {sessions_analyzed} sessions, ~{total_tokens:,} tokens')

if __name__ == '__main__':
    main()
