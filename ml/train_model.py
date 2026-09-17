import pandas as pd
import joblib
import csv

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report


# ==========================================
# 1. LOAD DATASET
# ==========================================

print("Loading dataset...")

rows = []

with open("dataset.csv", "r", encoding="utf-8") as file:

    reader = csv.reader(file)

    # Skip header
    next(reader)

    for row in reader:

        if len(row) >= 2:

            # Last column is always the intent
            intent = row[-1].strip()

            # Everything before the last column is email text
            text = ",".join(row[:-1]).strip()

            rows.append({
                "text": text,
                "intent": intent
            })


data = pd.DataFrame(rows)

print(f"Total emails: {len(data)}")


# ==========================================
# 2. CHECK DATASET
# ==========================================

print("\nIntent distribution:")
print(data["intent"].value_counts())


# ==========================================
# 3. INPUT AND TARGET
# ==========================================

X = data["text"]
y = data["intent"]


# ==========================================
# 4. TRAIN / TEST SPLIT
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


print(f"\nTraining samples: {len(X_train)}")
print(f"Testing samples: {len(X_test)}")


# ==========================================
# 5. CREATE ML PIPELINE
# ==========================================

model = Pipeline([
    (
        "tfidf",
        TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 2)
        )
    ),

    (
        "classifier",
        LogisticRegression(
            max_iter=1000
        )
    )
])


# ==========================================
# 6. TRAIN MODEL
# ==========================================

print("\nTraining model...")

model.fit(X_train, y_train)

print("Training completed!")


# ==========================================
# 7. TEST MODEL
# ==========================================

predictions = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    predictions
)


print("\n================================")
print("MODEL PERFORMANCE")
print("================================")

print(f"Accuracy: {accuracy * 100:.2f}%")


print("\nClassification Report:")

print(
    classification_report(
        y_test,
        predictions,
        zero_division=0
    )
)


# ==========================================
# 8. SAVE MODEL
# ==========================================

joblib.dump(
    model,
    "model.pkl"
)


print("\nModel saved successfully!")
print("File created: model.pkl")