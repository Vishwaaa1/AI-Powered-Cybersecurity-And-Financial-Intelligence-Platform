import os
import pandas as pd
import io
from backend.categorizer import categorize, load_vendor_memory
from backend.pdf_parser import extract_from_pdf

def parse_statement(file):
    if isinstance(file, str):
        df = pd.read_csv(file)
        balance = 0.0
    else:
        filename = file.filename.lower()
        if filename.endswith(".csv"):
            df = pd.read_csv(io.StringIO(file.read().decode()))
            balance = 0.0
        elif filename.endswith(".pdf"):
            df, balance = extract_from_pdf(file)
        else:
            return {"error": "Unsupported file format"}

    df.columns = pd.Index([str(col).strip().title() for col in df.columns])

    if 'Description' not in df.columns or 'Amount' not in df.columns:
        print("⚠️ Invalid format — got columns:", df.columns.tolist())
        return {'error': 'Invalid statement format'}

    # --- NEW LOGIC ---
    
    # 1. Get all vendors already saved in memory
    memory = load_vendor_memory() # This gets {original_vendor: category}
    saved_vendors = memory.keys()  # This is a list of known vendor keys

    categories = []
    items_to_categorize = [] # This will replace the 'uncategorized' list
    vendors_added_to_list = set()

    for index, row in df.iterrows():
        desc = row['Description']
        
        # 2. Categorize the item (from memory or ML)
        category = categorize(desc) 
        categories.append(category)
        
        original_vendor_key = desc.strip().lower()

        # 3. If this vendor is NOT in memory and we haven't already added it...
        if original_vendor_key not in saved_vendors and original_vendor_key not in vendors_added_to_list:
            # ...add it to the list for the user to confirm.
            items_to_categorize.append({
                "vendor": desc,          # The original, clean name
                "suggestion": category  # The ML's guess (e.g., "Others")
            })
            vendors_added_to_list.add(original_vendor_key)

    df['Category'] = categories
    summary = df.groupby('Category')['Amount'].sum().to_dict()

    # (Your existing bill_keywords logic can stay here)
    bill_keywords = ['electricity', 'subscription', 'wifi', 'broadband', 'bill', 'card', 'netflix', 'amazon']
    bills = sum(
        1 for desc in df['Description'].astype(str)
        if any(word.lower() in desc.lower() for word in bill_keywords)
    )

    return {
        'summary': summary,
        'raw': df.to_dict(orient='records'),
        'items_to_categorize': items_to_categorize, # Use the new, smarter list
        'balance': balance,
        'bills': bills
    }