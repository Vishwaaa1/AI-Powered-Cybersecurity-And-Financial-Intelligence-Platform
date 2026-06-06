# backend/openrouter_client.py
import requests
import os

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")

# This is the AI's core "personality" and set of rules.
# It explicitly forbids it from accessing PII.
SYSTEM_PROMPT = """
You are a helpful financial assistant named 'CyberNest'.
Your sole purpose is to answer questions based *only* on the 'Fact Sheet' of financial data provided to you.
You work with Indian Rupees (₹).

**YOUR RULES:**
1.  **NEVER** ask for, store, or reference any Personally Identifiable Information (PII) such as names, account numbers, or addresses.
2.  **NEVER** perform calculations. All calculations are in the Fact Sheet. If the user asks "what is 500+200", you must decline.
3.  **ONLY** use the data from the 'Fact Sheet' in your answer. Do not make up numbers or information.
4.  If the answer is not in the Fact Sheet, simply say: "I do not have that information in the provided financial summary."
5.  Be concise, helpful, and friendly.
"""

def ask_openrouter(fact_sheet_prompt):
    """
    Sends the system prompt and the user's fact-based prompt to the AI.
    """
    if not OPENROUTER_API_KEY:
        raise ValueError("Missing OpenRouter API key in environment variable.")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "openai/gpt-3.5-turbo",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": fact_sheet_prompt}
        ]
    }

    response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)

    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"].strip()
    else:
        return f"API Error: {response.status_code} - {response.text}"