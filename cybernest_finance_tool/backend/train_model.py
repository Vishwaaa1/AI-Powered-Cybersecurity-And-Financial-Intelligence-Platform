import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
import joblib
import os
import string

def clean_text(text):
    return text.strip().lower().translate(str.maketrans('', '', string.punctuation))

# Load the training data
df = pd.read_csv("training_data.csv")

# Clean the descriptions
df["Description"] = df["Description"].apply(clean_text)

# Prepare data
X = df["Description"]
y = df["Category"]

# Create vectorizer and model
vectorizer = TfidfVectorizer()
X_vec = vectorizer.fit_transform(X)

model = MultinomialNB()
model.fit(X_vec, y)

# Create models directory if not exists
os.makedirs("models", exist_ok=True)

# Save model and vectorizer
joblib.dump(model, "models/classifier.pkl")
joblib.dump(vectorizer, "models/vectorizer.pkl")

print("✅ Model and vectorizer saved.")
