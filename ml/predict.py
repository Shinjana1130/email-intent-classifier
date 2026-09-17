import joblib


# Load trained model
model = joblib.load("model.pkl")


print("=" * 50)
print("AI EMAIL INTENT CLASSIFIER")
print("=" * 50)

print("\nEnter your email below.")
print("Type 'exit' to stop.\n")


while True:

    email = input("Email: ")

    if email.lower() == "exit":
        print("\nExiting...")
        break

    if not email.strip():
        print("Please enter an email.\n")
        continue

    # Prediction
    prediction = model.predict([email])[0]

    # Prediction probabilities
    probabilities = model.predict_proba([email])[0]

    classes = model.classes_

    # Highest probability
    confidence = max(probabilities) * 100

    print("\n-----------------------------")
    print("Prediction:", prediction)
    print(f"Confidence: {confidence:.2f}%")
    print("-----------------------------\n")