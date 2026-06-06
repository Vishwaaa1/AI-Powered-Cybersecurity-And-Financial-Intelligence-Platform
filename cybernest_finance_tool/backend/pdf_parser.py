import fitz
import pandas as pd
import re
from backend.sbi_parser import parse_sbi

def extract_from_pdf(file):
    file.stream.seek(0)
    text = ""
    pdf = fitz.open(stream=file.read(), filetype="pdf")
    for page in pdf:
        text += page.get_text()
    pdf.close()

    # Detect SBI and parse accordingly
    if "state bank of india" in text.lower():
        print("📄 Detected SBI PDF → Using custom parser")
        file.stream.seek(0)
        df, balance = parse_sbi(file)
        return df, balance

    # Fallback for unsupported banks — attempt to extract balance using regex
    lines = text.splitlines()
    balance = 0.0
    for line in lines:
        match = re.search(r"Balance\s+as\s+on\s+.*?INR\s+([\d,]+\.\d{2})", line, re.IGNORECASE)
        if match:
            balance = float(match.group(1).replace(",", ""))
            print(f"💰 Extracted fallback balance from line: {line}")
            break

    # Return empty transaction data but correct balance
    df = pd.DataFrame(columns=["Description", "Amount"])
    return df, balance
