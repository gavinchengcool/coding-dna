# Codex (OpenAI) Conversation Format

## Storage Location

Sessions stored at: `~/.codex/sessions/YYYY/MM/DD/rollout-<timestamp>-<session-id>.jsonl`

Each session is a single JSONL file with event-streaming architecture.

## Entry Types

Every line has this envelope:

```json
{
  "timestamp": "ISO-8601",
  "type": "<entry_type>",
  "payload": { ... }
}
```

### session_meta

First entry in every session. Contains initialization context.

```json
{
  "type": "session_meta",
  "payload": {
    "id": "session-uuid",
    "timestamp": "ISO-8601",
    "cwd": "/working/directory",
    "originator": "codex_cli_rs",
    "cli_version": "0.111.0",
    "source": "cli",
    "model_provider": "openai",
    "git": {
      "commit_hash": "abc123...",
      "branch": "main"
    }
  }
}
```

### turn_context

Precedes each conversation turn. Contains model config and policy.

```json
{
  "type": "turn_context",
  "payload": {
    "turn_id": "turn-uuid",
    "cwd": "/working/directory",
    "current_date": "2026-03-10",
    "timezone": "Asia/Shanghai",
    "approval_policy": "on-request",
    "model": "gpt-5.4",
    "personality": "pragmatic",
    "collaboration_mode": {
      "mode": "default",
      "settings": {
        "model": "gpt-5.4",
        "reasoning_effort": "xhigh"
      }
    },
    "summary": "none",
    "truncation_policy": {
      "mode": "tokens",
      "limit": 10000
    }
  }
}
```

### event_msg

User messages and system events.

```json
{
  "type": "event_msg",
  "payload": {
    "type": "user_message",
    "message": "user prompt text",
    "images": [],
    "local_images": [],
    "text_elements": []
  }
}
```

Other event_msg subtypes: `exec_command_result`, `status`, `error`.

### response_item

Agent responses including text and function calls.

**Text response:**
```json
{
  "type": "response_item",
  "payload": {
    "type": "message",
    "role": "assistant",
    "content": [
      { "type": "output_text", "text": "response text" }
    ]
  }
}
```

**Function call:**
```json
{
  "type": "response_item",
  "payload": {
    "type": "function_call",
    "name": "exec_command",
    "arguments": "{\"cmd\":\"ls -la\",\"workdir\":\"/path\"}",
    "call_id": "call_id_string"
  }
}
```

**Function output:**
```json
{
  "type": "response_item",
  "payload": {
    "type": "function_call_output",
    "call_id": "call_id_string",
    "output": "command output text"
  }
}
```

### token_usage

Legacy token consumption per turn.

```json
{
  "type": "token_usage",
  "payload": {
    "input_tokens": 5000,
    "output_tokens": 1200,
    "cached_tokens": 3000,
    "reasoning_tokens": 800
  }
}
```

### token_count snapshot

Newer Codex logs also emit cumulative snapshots via `event_msg`:

```json
{
  "type": "event_msg",
  "payload": {
    "type": "token_count",
    "info": {
      "total_token_usage": {
        "input_tokens": 11015,
        "cached_input_tokens": 5120,
        "output_tokens": 1746,
        "reasoning_output_tokens": 1088,
        "total_tokens": 12761
      },
      "last_token_usage": {
        "input_tokens": 5756,
        "cached_input_tokens": 5120,
        "output_tokens": 209,
        "reasoning_output_tokens": 0,
        "total_tokens": 5965
      }
    }
  }
}
```

When summarizing a session, prefer the max `total_token_usage` snapshot within the file. If it is absent, fall back to `last_token_usage`, then to legacy `token_usage` events.

## Key Fields for Analysis

| Field | Location | Use |
|-------|----------|-----|
| User intent | First `event_msg` with `payload.type: "user_message"` | Task Outcome |
| Function calls | `response_item` with `payload.type: "function_call"` | Tool distribution |
| Model | `turn_context.payload.model` | Meta info |
| Token usage | `event_msg.payload.info.total_token_usage`, fallback `last_token_usage`, then `token_usage.payload` | Efficiency metrics |
| Reasoning effort | `turn_context.payload.collaboration_mode.settings.reasoning_effort` | Capability |
| Git info | `session_meta.payload.git` | Context |
| Timestamps | Envelope `timestamp` on every entry | Duration, timeline |
| Approval policy | `turn_context.payload.approval_policy` | Autonomy assessment |
