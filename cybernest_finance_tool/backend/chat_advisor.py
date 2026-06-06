# backend/chat_advisor.py

import pandas as pd
from backend.advisor_logic import generate_advice

def answer_question(question, transactions):
    try:
        # Convert to DataFrame
        df = pd.DataFrame(transactions or [])

        if df.empty:
            return "No transactions available. Please upload a statement first."

        # Clean data
        df['Amount'] = pd.to_numeric(df.get('Amount', pd.Series()), errors='coerce')
        df['Date'] = pd.to_datetime(df.get('Date', pd.Series()), errors='coerce')
        df['Category'] = df.get('Category', pd.Series()).fillna("Uncategorized")

        # Filter out invalid rows
        df = df.dropna(subset=["Amount", "Date"])

        # Generate response
        result = generate_advice(df, question)

        # Ensure AI response is always a string
        return result.get("answer") or result.get("error") or "No response generated."

    except Exception as e:
        print(f"❌ Error in answer_question: {e}")
        return "Something went wrong while processing your question."
