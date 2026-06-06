# backend/categorizer.py
import sqlite3
import os
import string
import joblib
from functools import lru_cache

# Load classifier and vectorizer
model = joblib.load("models/classifier.pkl")
vectorizer = joblib.load("models/vectorizer.pkl")

# SQLite DB path
DB_PATH = "vendor_memory.db"

# NOTE: The init_db() function is removed.
# The database is now initialized and migrated by app.py.

# Cache memory reads per run for performance
@lru_cache(maxsize=1)
def load_vendor_memory():
    """
    Loads the vendor memory from the new database structure.
    Returns a dict of {original_vendor: category}
    """
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        # Select the new columns
        c.execute("SELECT original_vendor, category FROM vendor_memory")
        return dict(c.fetchall())

# Update vendor memory in DB
def update_vendor_memory(vendor, category, friendly_name=None):
    """
    Updates memory. Accepts an optional friendly_name.
    If friendly_name is not provided, it creates a default one.
    """
    original_vendor = vendor.strip().lower()

    # If no friendly name is given, create a default one.
    if not friendly_name or not friendly_name.strip():
        friendly_name = vendor.strip().title()
    else:
        friendly_name = friendly_name.strip()

    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("""
            REPLACE INTO vendor_memory (original_vendor, friendly_name, category) 
            VALUES (?, ?, ?)
        """, (original_vendor, friendly_name, category))
        conn.commit()

    load_vendor_memory.cache_clear()

# Clear all vendor memory entries
def clear_vendor_memory():
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("DELETE FROM vendor_memory")
        conn.commit()
    load_vendor_memory.cache_clear()

# Main categorization logic
def categorize(description, debug=True):
    # Clean the transaction description from the bank
    desc_clean = description.strip().lower().translate(str.maketrans('', '', string.punctuation))
    
    # Load the memory, which is now {original_vendor: category}
    memory = load_vendor_memory()

    # 1. Match from memory
    # 'vendor' here is the original_vendor key (e.g., "swiggy l")
    for vendor, category in memory.items():
        if vendor in desc_clean:
            return category

    # 2. ML prediction (if no memory match)
    X = vectorizer.transform([description])
    prediction = model.predict(X)[0]
    probas = model.predict_proba(X)[0]
    max_prob = max(probas)

    if debug:
        print(f"🔍 {description} → {prediction} (Confidence: {max_prob:.2f})")

    # 3. Confidence threshold
    if max_prob >= 0.3:
        return prediction
    else:
        return "Uncategorized"