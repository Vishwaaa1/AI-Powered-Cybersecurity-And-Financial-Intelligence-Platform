# backend/sbi_parser.py

import fitz
import re
import pandas as pd

def parse_sbi(file):
    file.stream.seek(0)
    pdf = fitz.open(stream=file.read(), filetype="pdf")
    
    lines = []
    full_text_for_balance = ""
    for page in pdf:
        page_text = page.get_text("text")
        full_text_for_balance += page_text
        lines.extend(page_text.strip().split('\n'))
    pdf.close()
    
    lines = [line.strip() for line in lines if line.strip()]

    transactions = []
    date_pattern = re.compile(r"^\d{2} \w{3} \d{4}$")
    amount_pattern = re.compile(r"^[\d,]+\.\d{2}$")

    i = 2
    while i < len(lines):
        if date_pattern.match(lines[i]):
            try:
                line_before_date = lines[i - 1]
                line_two_before_date = lines[i - 2]
                
                amount = 0.0
                
                if amount_pattern.match(line_two_before_date) and line_before_date == "-":
                    amount = -float(line_two_before_date.replace(",", ""))
                
                elif amount_pattern.match(line_before_date) and line_two_before_date == "-":
                    amount = float(line_before_date.replace(",", ""))

                if amount == 0.0:
                    i += 1
                    continue

                description_parts = []
                j = i + 1
                while j < len(lines) and not amount_pattern.match(lines[j]):
                    description_parts.append(lines[j])
                    j += 1
                
                full_description = " ".join(description_parts)

                vendor = "Unknown"
                if "UPI/" in full_description:
                    segments = re.findall(r"/([^/]+)", full_description)
                    common_noise = {"UPI", "DR", "CR", "YESB", "UTIB", "ICIC", "HDFC", "SBIN", "PAYME", "PAYTMQR", "PET"}
                    potential_vendors = [s.title() for s in segments if s.upper() not in common_noise and not s.isdigit() and len(s) > 1]
                    vendor = potential_vendors[0] if potential_vendors else "Upi Transaction"
                else:
                    vendor = full_description.split(' ')[0]

                transactions.append({
                    "Date": lines[i],
                    "Description": vendor,
                    "Amount": amount
                })

                i = j
                continue

            except IndexError:
                break
        i += 1

    final_balance = 0.0
    balance_match = re.search(r"Balance as on.*?INR\s+([\d,]+\.\d{2})", full_text_for_balance)
    if not balance_match: # Fallback for slightly different header format
        balance_match = re.search(r"\d{2} \w{3} \d{4}\s+INR\s+([\d,]+\.\d{2})", full_text_for_balance)

    if balance_match:
        final_balance = float(balance_match.group(1).replace(",", ""))

    df = pd.DataFrame(transactions) # No need to specify columns, they are inferred
    print(f"🧾 Extracted {len(df)} SBI transactions. 💰 Final balance: ₹{final_balance}")
    return df, final_balance