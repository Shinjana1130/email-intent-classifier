# Email Intent Classification System

An AI-powered web application that automatically analyzes email content and classifies it into different intent categories. The system helps organizations understand incoming emails and route them to the appropriate department.

## Features

- Email intent classification using Machine Learning
- Six intent categories:
  - Complaint
  - Enquiry
  - Request
  - Feedback
  - Application
  - Other
- Confidence score for predictions
- Priority detection
- Department assignment
- User registration and login
- JWT-based authentication
- Prediction history
- MongoDB database storage
- Interactive React frontend
- REST API integration

## Project Structure

```text
email-intent-classifier/
│
├── backend/
│   ├── models/
│   ├── middleware/
│   ├── routes/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── ml/
│   ├── dataset.csv
│   ├── train_model.py
│   ├── predict_api.py
│   ├── model.pkl
│   └── requirements.txt
│
├── .gitignore
└── README.md
