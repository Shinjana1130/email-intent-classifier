import sys
import json
import joblib


# Load trained model
model = joblib.load("model.pkl")


# Get email from Node.js
if len(sys.argv) < 2:

    print(json.dumps({
        "success": False,
        "message": "Email text is required."
    }))

    sys.exit(1)


email = sys.argv[1]


# Make prediction
prediction = model.predict([email])[0]


# Get probabilities
probabilities = model.predict_proba([email])[0]

classes = model.classes_


# Calculate confidence
confidence = max(probabilities) * 100


# Store probabilities
probability_data = {}

for class_name, probability in zip(classes, probabilities):

    probability_data[class_name] = round(
        float(probability) * 100,
        2
    )


# Create response
result = {
    "intent": prediction,
    "confidence": round(float(confidence), 2),
    "probabilities": probability_data
}


# Send JSON to Node.js
print(json.dumps(result))