from dotenv import load_dotenv
load_dotenv()

from flask import Flask, render_template, request, jsonify, send_from_directory
from backend.statement_parser import parse_statement
# Ensure all necessary functions are imported
from backend.categorizer import update_vendor_memory, load_vendor_memory, clear_vendor_memory
from backend.advisor_logic import generate_advice
import joblib
import numpy as np
import os
import pandas as pd
import sqlite3

def initialize_database():
    """
    Checks and updates the database schema to support vendor aliases.
    This is a simple migration that runs on startup.
    """
    conn = sqlite3.connect("vendor_memory.db")
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(vendor_memory)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'friendly_name' not in columns:
        print("🚀 Upgrading database schema for vendor aliases...")
        try:
            # Check if the old table exists before trying to rename
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='vendor_memory_old'")
            if cursor.fetchone():
                 cursor.execute("DROP TABLE vendor_memory_old") # Drop if it exists from a previous failed run

            cursor.execute("ALTER TABLE vendor_memory RENAME TO vendor_memory_old")
            cursor.execute("""
                CREATE TABLE vendor_memory (
                    original_vendor TEXT PRIMARY KEY,
                    friendly_name TEXT NOT NULL,
                    category TEXT NOT NULL
                )
            """)
            # ** CORRECTED LINE: Use LOWER() to ensure primary key is lowercase **
            cursor.execute("""
                INSERT INTO vendor_memory (original_vendor, friendly_name, category)
                SELECT LOWER(vendor), vendor, category FROM vendor_memory_old
            """)
            cursor.execute("DROP TABLE vendor_memory_old")
            print("✅ Database upgrade complete.")
            conn.commit() # Commit changes after successful migration
        except sqlite3.Error as e:
            print(f"❌ Database migration error: {e}")
            conn.rollback() # Rollback changes if migration fails
    else:
        print("✅ Database schema is up to date.")

    conn.close()


app = Flask(__name__, template_folder='frontend')
DEBUG = True

try:
    url_model = joblib.load("models/url_rf_model.pkl")
    # ** RENAME this if the vectorizers are different **
    url_vectorizer = joblib.load("models/url_vectorizer.pkl") # Assuming renamed
    print("✅ URL Detector models loaded successfully.")
except FileNotFoundError:
    print("❌ ERROR: URL Detector model/vectorizer file not found. Please check paths in models/ folder.")
    url_model = None
    url_vectorizer = None
except Exception as e:
    print(f"❌ ERROR loading URL Detector models: {e}")
    url_model = None
    url_vectorizer = None

# === FRONTEND ROUTES ===
@app.route('/')
def navigator_home():
    return send_from_directory('frontend', 'navigator.html')

@app.route('/tool-unavailable')
def tool_unavailable_page():
    return send_from_directory('frontend', 'tool_unavailable.html')

@app.route('/dashboard')
def dashboard_home():
    return send_from_directory('frontend', 'dashboard.html')

@app.route('/file-detector')
def file_detector_page():
    return send_from_directory('frontend', 'file_detector.html')

# ** ADD Route for Tool 1 Page **
@app.route('/url-detector')
def url_detector_page():
    # Render the template directly, don't just send the file
    # This allows passing data back if needed (though not used here yet)
    return render_template('tool1.html')

@app.route('/analyze-url', methods=['POST'])
def analyze_url():
    # Ensure models loaded correctly
    if not url_model or not url_vectorizer:
         return jsonify({'error': 'URL analysis models not loaded properly.'}), 500

    data = request.get_json()
    url = data.get('url', '')

    if not url:
        return jsonify({'error': 'URL is required'}), 400

    try:
        # Vectorize and predict using the loaded URL models
        features = url_vectorizer.transform([url])
        pred = url_model.predict(features)[0]
        confidence = float(np.max(url_model.predict_proba(features))) * 100

        label_map = {
            0: "Benign ✅",
            1: "Defacement ⚠️",
            2: "Phishing 🚨",
            3: "Malware ☠️"
        }
        prediction = label_map.get(pred, "Unknown")

        return jsonify({'prediction': prediction, 'confidence': round(confidence, 2)})
    except Exception as e:
        print(f"❌ Error during URL analysis: {e}")
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

@app.route('/assistant')
def assistant_page():
    return send_from_directory('frontend', 'assistant.html')

@app.route('/bill-splitter')
def bill_splitter_page():
    return send_from_directory('frontend', 'bill_splitter.html') # Ensure this file exists

@app.route('/memory')
def memory_page():
    return send_from_directory('frontend', 'memory.html')

@app.route('/settings')
def settings_page():
    return send_from_directory('frontend', 'settings.html')

# Assuming 'learn' is just an API endpoint, not a page. If it's a page, add its route.
# Assuming 'budgets' is just an API endpoint or future page. If it's a page, add its route.

@app.route('/scripts/<path:filename>') # Serves JS from frontend/scripts/
def serve_scripts(filename):
    return send_from_directory(os.path.join('frontend', 'scripts'), filename)

@app.route('/static/<path:filename>') # Serves general static files (like memory.css if used)
def serve_general_static(filename):
     # ** Corrected: Serve directly from 'static' **
    return send_from_directory('static', filename)

# ** NEW: Route for Navigator's specific assets **
@app.route('/static/navigator_assets/<path:filename>')
def serve_navigator_assets(filename):
    return send_from_directory(os.path.join('static', 'navigator_assets'), filename)


# === MEMORY MANAGEMENT ===
@app.route('/memory-data')
def memory_data():
    try:
        conn = sqlite3.connect("vendor_memory.db")
        cursor = conn.cursor()
        cursor.execute("SELECT original_vendor, friendly_name, category FROM vendor_memory")
        data = [{"original": row[0], "friendly": row[1], "category": row[2]} for row in cursor.fetchall()]
        conn.close()
        return jsonify(data)
    except Exception as e:
        print(f"❌ Error fetching memory data: {e}")
        return jsonify({"error": "Failed to load memory data"}), 500

@app.route('/update-memory', methods=['POST'])
def update_memory():
    data = request.get_json()
    original_vendor = data.get("original_vendor")
    friendly_name = data.get("friendly_name")
    category = data.get("category")

    if not all([original_vendor, friendly_name, category]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = sqlite3.connect("vendor_memory.db")
        cursor = conn.cursor()
        # Use REPLACE to handle potential primary key conflicts gracefully
        cursor.execute("""
            REPLACE INTO vendor_memory (original_vendor, friendly_name, category)
            VALUES (?, ?, ?)
        """, (original_vendor.strip().lower(), friendly_name.strip(), category))
        conn.commit()
        conn.close()
        # Clear categorizer cache after update
        load_vendor_memory.cache_clear()
        return jsonify({"status": "updated"})
    except Exception as e:
        print(f"❌ Error updating memory: {e}")
        return jsonify({"error": "Failed to update memory"}), 500

@app.route('/delete-memory', methods=['POST'])
def delete_memory():
    data = request.get_json()
    original_vendor = data.get("original_vendor")
    if not original_vendor:
        return jsonify({"error": "Missing vendor"}), 400

    try:
        conn = sqlite3.connect("vendor_memory.db")
        cursor = conn.cursor()
        cursor.execute("DELETE FROM vendor_memory WHERE original_vendor = ?", (original_vendor.strip().lower(),))
        conn.commit()
        conn.close()
        # Clear categorizer cache after delete
        load_vendor_memory.cache_clear()
        return jsonify({"status": "deleted"})
    except Exception as e:
        print(f"❌ Error deleting memory: {e}")
        return jsonify({"error": "Failed to delete memory"}), 500


@app.route('/clear-memory', methods=['POST'])
def clear_memory_route():
    try:
        clear_vendor_memory() # This calls the function from categorizer.py
        # Clear categorizer cache after clearing memory
        load_vendor_memory.cache_clear()
        return jsonify({"status": "cleared"}), 200
    except Exception as e:
        print(f"❌ Error clearing memory: {e}")
        return jsonify({"error": str(e)}), 500

# === STATEMENT ANALYSIS ===
@app.route('/analyze', methods=['POST'])
def analyze():
    file = request.files.get('statement')
    if not file:
        return jsonify({"error": "No file uploaded."}), 400

    filename = os.path.basename(file.filename).lower()
    if not filename.endswith(('.csv', '.pdf')):
        return jsonify({"error": "Only CSV and PDF files are supported."}), 400

    try:
        if DEBUG:
            print(f"📤 Received file: {filename}")
        result = parse_statement(file)
        # Ensure result is serializable
        if isinstance(result.get('raw'), pd.DataFrame):
             result['raw'] = result['raw'].to_dict(orient='records')
        return jsonify(result)
    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        # Consider logging the full traceback here for better debugging
        # import traceback
        # print(traceback.format_exc())
        return jsonify({"error": f"File parsing failed: {str(e)}"}), 500

# === LEARNING ROUTE ===
# This route receives data when user categorizes an item on the dashboard
@app.route('/learn', methods=['POST'])
def learn():
    data = request.json
    vendor = data.get("vendor") # This is the 'original' vendor name from the statement
    category = data.get("category")
    friendly_name = data.get("friendly_name") # The (optional) user-provided name

    if not vendor or not category:
        return jsonify({"error": "Missing vendor or category"}), 400

    try:
        # Pass all three arguments to the updated function in categorizer.py
        update_vendor_memory(vendor, category, friendly_name)
        return jsonify({"status": "learned", "vendor": vendor, "category": category})
    except Exception as e:
        print(f"❌ Error learning vendor category: {e}")
        return jsonify({"error": "Failed to save category"}), 500


# === AI FINANCIAL ADVISOR ===
@app.route('/chat-advisor', methods=['POST'])
def chat_advisor():
    data = request.get_json()
    question = data.get("question", "").strip()
    transactions = data.get("transactions", [])
    balance = data.get("balance", 0.0)

    if not question:
        return jsonify({"error": "No question provided."}), 400
    if not transactions:
         return jsonify({"answer": "I need transaction data to answer questions. Please upload a statement first."}), 200

    try:
        # Convert list of dicts to DataFrame for advisor logic
        df = pd.DataFrame(transactions)
        response = generate_advice(df, question, balance)
        return jsonify(response) # generate_advice should return a dict like {"answer": ...} or {"error": ...}
    except Exception as e:
        print(f"❌ Error in AI chat: {e}")
        return jsonify({"error": "Something went wrong while getting advice."}), 500

# === SECURITY HEADERS ===
# === SECURITY HEADERS ===
@app.after_request
def set_secure_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"

    # --- UPDATED Content Security Policy ---
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; " # Default to only allow content from your own domain

        # Allow scripts from self, trusted CDNs, AND 'unsafe-inline' (Needed for tsParticles inline script)
        "script-src 'self' https://cdn.tailwindcss.com https://cdn.jsdelivr.net 'unsafe-inline'; "

        # Allow styles from self, trusted CDNs, Google Fonts, AND 'unsafe-inline'
        "style-src 'self' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://fonts.googleapis.com 'unsafe-inline'; "

        # Allow fonts from self and Google Fonts' hosting domain
        "font-src 'self' https://fonts.gstatic.com; "

        # Allow connections (like API calls) only to self
        "connect-src 'self'; "

        # Allow images from self and data URIs
        "img-src 'self' data:; "

        "object-src 'none'; " # Disallow plugins (like Flash)
        "frame-ancestors 'none'; " # Prevent clickjacking
        "form-action 'self';" # Restrict where forms can submit data
    )
    return response

# ... (rest of your app.py, including the if __name__ == '__main__': block) ...

if __name__ == '__main__':
    initialize_database() # Ensure DB is checked/migrated on startup
    app.run(debug=True, host='0.0.0.0', port=5000) # Use 0.0.0.0 to make accessible on local network if needed


