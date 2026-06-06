# backend/advisor_logic.py
import pandas as pd
from backend.openrouter_client import ask_openrouter

def generate_advice(df, user_question, current_balance):
    """
    This function is the core of the "Fact Sheet" model.
    1. It calculates ALL financial metrics from the ANONYMOUS transaction list.
    2. It builds a "Fact Sheet" prompt with these metrics.
    3. It sends this Fact Sheet and the user's question to the AI.
    
    The AI never sees raw, private data, only these calculated, anonymous totals.
    """
    try:
        # --- 1. Data Preparation ---
        df['Amount'] = pd.to_numeric(df['Amount'], errors='coerce')
        df = df.dropna(subset=['Amount'])

        expenses_df = df[df['Amount'] < 0].copy()
        income_df = df[df['Amount'] > 0].copy()

        # --- 2. Calculate All Metrics (The "Fact Sheet") ---
        
        # Key Totals
        total_expense = expenses_df['Amount'].sum()
        total_income = income_df['Amount'].sum()
        net_period_savings = total_income + total_expense # (expense is already negative)

        # Expense Metrics
        total_expense_count = len(expenses_df)
        avg_expense = total_expense / total_expense_count if total_expense_count > 0 else 0
        expense_summary = expenses_df.groupby("Category")["Amount"].sum().abs().to_dict()
        
        biggest_expense_category = ""
        if expense_summary:
            biggest_expense_category = max(expense_summary, key=expense_summary.get)

        # Income Metrics
        total_income_count = len(income_df)
        avg_income = total_income / total_income_count if total_income_count > 0 else 0
        income_summary = income_df.groupby("Category")["Amount"].sum().to_dict()
        
        biggest_income_source = ""
        if income_summary:
            biggest_income_source = max(income_summary, key=income_summary.get)

        # --- 3. Build the Final Prompt ---
        # This is the "Fact Sheet" that we send to the AI.
        # It contains NO PII. It is 100% anonymous.
        
        prompt = f"""
Here is the user's financial Fact Sheet for this period:

**[Account Summary]**
Current Account Balance: ₹{current_balance:,.2f}

**[Period Summary]**
Total Expenses: ₹{abs(total_expense):,.2f}
Total Income: ₹{total_income:,.2f}
Net Savings (Income vs. Expense): ₹{net_period_savings:,.2f}

**[Expense Details]**
Total Number of Expenses: {total_expense_count}
Average Expense Amount: ₹{abs(avg_expense):,.2f}
Biggest Spending Category: {biggest_expense_category or 'N/A'}
Spending by Category: {expense_summary or 'N/A'}

**[Income Details]**
Total Number of Income Transactions: {total_income_count}
Average Income Amount: ₹{avg_income:,.2f}
Biggest Income Source: {biggest_income_source or 'N/A'}
Income by Source: {income_summary or 'N/A'}

---
**User's Question:** "{user_question}"
---

Please answer the user's question using ONLY the facts from the Fact Sheet above.
"""

        # --- 4. Get Answer from AI ---
        ai_response = ask_openrouter(prompt)
        return {"answer": ai_response}

    except Exception as e:
        print(f"❌ Error in generate_advice: {e}")
        return {"error": f"Advisor logic failed: {str(e)}"}