import csv

categories = {
    "Complaint": [
        "I am unhappy with the service.",
        "I want to complain about my order.",
        "The product I received is damaged.",
        "My order arrived late.",
        "The item I purchased is defective.",
        "I received the wrong product.",
        "The customer service was very poor.",
        "I am not satisfied with the product.",
        "I want a refund for the damaged item.",
        "My payment was charged twice.",
    ],

    "Enquiry": [
        "Could you provide information about your pricing?",
        "What are your available plans?",
        "Can you tell me more about your services?",
        "I would like more information about your product.",
        "What are your business hours?",
        "How does this service work?",
        "Do you provide international delivery?",
        "What payment methods do you accept?",
        "When does the course start?",
        "Can you tell me about the job position?",
    ],

    "Request": [
        "Please send me a copy of my invoice.",
        "I would like to change my email address.",
        "Please cancel my subscription.",
        "Please update my account details.",
        "Please provide my transaction history.",
        "I would like to reset my password.",
        "Please schedule an appointment.",
        "Please send the required documents.",
        "I would like to change my delivery address.",
        "Please activate my account.",
    ],

    "Feedback": [
        "I really enjoyed using your service.",
        "Your support team was very helpful.",
        "I am happy with the quality of your product.",
        "Thank you for the excellent service.",
        "The application is easy to use.",
        "I suggest improving the user interface.",
        "Overall, I am satisfied with my experience.",
        "The new features are very useful.",
        "I appreciate the quick response.",
        "This has been a great experience.",
    ],

    "Application": [
        "I am applying for the software developer position.",
        "Please consider my application for the marketing role.",
        "I would like to apply for the internship.",
        "I am submitting my resume for the data analyst position.",
        "I am interested in the available job.",
        "Please find my CV attached for the developer position.",
        "I would like to submit my application for this role.",
        "I am applying for the customer support position.",
        "I would like to be considered for the internship.",
        "Please review my resume for the available position.",
    ],

    "Other": [
        "The meeting has been moved to Monday afternoon.",
        "I went to the store yesterday.",
        "Here is the information you requested.",
        "I will be unavailable tomorrow.",
        "I wanted to share this information with your team.",
        "The meeting has been rescheduled for next week.",
        "I have attached the document for your reference.",
        "This message is regarding our previous conversation.",
        "I will contact you again next week.",
        "Thank you for your time and consideration.",
    ]
}


# Generate 50 examples per category
rows = []

for intent, examples in categories.items():

    for i in range(50):

        original = examples[i % len(examples)]

        # Add small variations
        variations = [
            original,
            "Hello, " + original,
            "Dear Team, " + original,
            original + " Please help me.",
            original + " Thank you.",
        ]

        text = variations[i % len(variations)]

        rows.append([text, intent])


# Write clean CSV
with open(
    "dataset.csv",
    "w",
    newline="",
    encoding="utf-8"
) as file:

    writer = csv.writer(file)

    writer.writerow(["text", "intent"])

    writer.writerows(rows)


print("Dataset created successfully!")
print("Total emails:", len(rows))
print("Categories:")

for intent in categories:
    print(intent, "-> 50")