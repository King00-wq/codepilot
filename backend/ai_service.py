import os
import re
from datetime import datetime, timezone
from typing import Optional

from openai import OpenAI

from database import get_db

from dotenv import load_dotenv

load_dotenv()

print("OPENROUTER_API_KEY =", bool(os.getenv("OPENROUTER_API_KEY")))
print("MODEL_NAME =", os.getenv("MODEL_NAME"))

client = OpenAI(
    api_key=os.environ.get("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

SENSITIVE_PATTERNS = [
    # OpenAI/OpenRouter style keys
    r"sk-[A-Za-z0-9\-_]{20,}",

    # AWS Access Keys
    r"AKIA[0-9A-Z]{16}",

    # GitHub tokens
    r"ghp_[A-Za-z0-9]{36,}",
    r"github_pat_[A-Za-z0-9_]{20,}",

    # JWTs
    r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+",

    # Private Keys
    r"-----BEGIN\s+(RSA |EC |OPENSSH )?PRIVATE KEY-----",
]


def detect_sensitive(text: str) -> bool:
    for pattern in SENSITIVE_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False


SYSTEM_PROMPTS = {
    "explain": """You are an expert AI coding assistant. Explain the given code clearly.

Structure your response EXACTLY as:
## Overview
What the code does in one paragraph.

## How It Works
Step-by-step breakdown of the logic.

## Key Concepts
Important patterns or concepts used.

## Summary
One-line takeaway.

Use fenced code blocks for any code. Be concise and beginner-friendly.""",

    "debug": """You are an expert debugger. Identify and fix issues in the given code.

Structure your response EXACTLY as:
## Problem Identified
Clear description of the bug or issue.

## Root Cause
Why this error occurs.

## Fix
The corrected code in a fenced code block.

## Explanation
Why this fix works and how to prevent it in future.

If uncertain, say so clearly — never fabricate solutions.""",

    "optimize": """You are a code optimization expert. Improve the given code.

Structure your response EXACTLY as:
## Current Issues
What makes the current code suboptimal.

## Optimized Code
The improved version in a fenced code block.

## Changes Made
Bullet list of what changed and why.

## Performance Impact
Expected improvement from these changes.""",

    "generate_docs": """You are a technical documentation expert.

Structure your response EXACTLY as:
## Module Overview
High-level description.

## Functions / Classes
For each: name, purpose, parameters, return value.

## Documented Code
Original code with inline comments added, in a fenced code block.

## Usage Example
A practical usage example.""",

    "convert": """You are a polyglot programming expert. Convert code between languages accurately.

Structure your response EXACTLY as:
## Conversion Notes
Important differences between the source and target languages.

## Converted Code
Full converted code in a fenced code block with correct language tag.

## Key Differences
Notable syntax or behaviour differences to be aware of.

## Testing Suggestions
How to verify the converted code works correctly.""",

    "general": """You are an expert AI coding assistant. Answer the user's coding question clearly and accurately.
Use fenced code blocks for code examples. If uncertain, say so explicitly.""",
}


def _build_messages(history: list, prompt: str, code: str, action: str) -> list:
    messages = [{"role": "system", "content": SYSTEM_PROMPTS.get(action, SYSTEM_PROMPTS["general"])}]

    for msg in history[-6:]:
        if msg.get("prompt"):
            content = msg["prompt"]
            if msg.get("submitted_code"):
                content += f"\n\n```\n{msg['submitted_code']}\n```"
            messages.append({"role": "user", "content": content})
        if msg.get("response"):
            messages.append({"role": "assistant", "content": msg["response"]})

    user_content = prompt or f"Please {action.replace('_', ' ')} the following code:"
    if code:
        user_content += f"\n\n```\n{code}\n```"
    messages.append({"role": "user", "content": user_content})
    return messages


def _auto_title(prompt: str, code: str, action: str) -> str:
    try:
        preview = (prompt or code or "")[:300]
        resp = client.chat.completions.create(
    model=os.environ.get(
        "MODEL_NAME",
        "google/gemma-3-27b-it:free"
    ),
    messages=[
        {
            "role": "user",
            "content": (
                f"Generate a short, specific 3-6 word title for a coding session "
                f"where the user is {action.replace('_', ' ')}ing code. "
                f"Content preview: {preview}\n\n"
                "Respond with ONLY the title, no quotes, no trailing punctuation."
            )
        }
    ],
    max_tokens=20,
    temperature=0.7,
)
        title = resp.choices[0].message.content.strip()
        return title if title else f"{action.replace('_', ' ').title()} Session"
    except Exception:
        return f"{action.replace('_', ' ').title()} Session"


def process_ai_request(
    session_id: int,
    user_id: int,
    prompt: str,
    code: str,
    action_type: str,
    target_language: Optional[str] = None,
) -> dict:
    if detect_sensitive(code or ""):
        raise ValueError(
            "Sensitive information detected — your code may contain API keys, "
            "passwords, or tokens. Please remove them before submitting."
        )

    db = get_db()
    try:
        history = [
            dict(row)
            for row in db.execute(
                "SELECT prompt, submitted_code, response, action_type "
                "FROM messages WHERE session_id = ? ORDER BY timestamp ASC",
                (session_id,),
            ).fetchall()
        ]

        final_prompt = prompt or f"Please {action_type.replace('_', ' ')} this code"
        if target_language and action_type == "convert":
            final_prompt = f"Convert this code to {target_language}. {prompt or ''}".strip()

        messages = _build_messages(history, final_prompt, code, action_type)

        response = client.chat.completions.create(
        model=os.environ.get(
            "MODEL_NAME",
            "google/gemma-3-27b-it:free"
        ),
        messages=messages,
        max_tokens=2000,
        temperature=0.3,
        )
        ai_response = response.choices[0].message.content

        db.execute(
            "INSERT INTO messages (session_id, prompt, submitted_code, response, action_type) "
            "VALUES (?, ?, ?, ?, ?)",
            (session_id, final_prompt, code, ai_response, action_type),
        )
        db.execute(
            "UPDATE sessions SET updated_at = ? WHERE id = ?",
            (datetime.now(timezone.utc), session_id),
        )

        # Auto-title on first message
        msg_count = db.execute(
            "SELECT COUNT(*) as cnt FROM messages WHERE session_id = ?", (session_id,)
        ).fetchone()["cnt"]
        if msg_count == 1:
            title = _auto_title(prompt, code, action_type)
            db.execute("UPDATE sessions SET title = ? WHERE id = ?", (title, session_id))

        db.execute(
            "INSERT INTO analytics (user_id, event_type, metadata) VALUES (?, ?, ?)",
            (user_id, f"ai_{action_type}", f'{{"session_id":{session_id}}}'),
        )
        db.commit()
        return {"response": ai_response, "action_type": action_type}

    # except ValueError:
    #     raise
    # # except Exception as e:
    # #     msg = str(e).lower()
    # #     if "openai" in msg or "api" in msg or "rate" in msg:
    # #         raise RuntimeError("AI service is temporarily unavailable. Please try again.")
    # #     raise RuntimeError("An unexpected error occurred. Please try again.")
    # except Exception as e:
    #     print("\n=== ACTUAL ERROR ===")
    #     print(type(e))
    #     print(repr(e))
    #     print("====================\n")
    #     raise

    # finally:
    #     db.close()

    except ValueError:
        raise

    except Exception as e:
        print("\n=== ACTUAL ERROR ===")
        print(type(e))
        print(repr(e))
        print("====================\n")
        raise

    finally:
        db.close()