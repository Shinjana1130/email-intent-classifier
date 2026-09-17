import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./App.css";
import Login from "./Login";
import Register from "./Register";

function DashboardPage() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD HISTORY FROM MONGODB
  // ==========================================

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setHistory([]);
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/predictions",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load prediction history."
        );
      }

      const formattedHistory = (data.predictions || []).map(
        (item) => {
          const confidence = Number(item.confidence || 0);
          const keywords = extractKeywords(item.email || "");

          return {
            id: item._id,
            email: item.email,
            intent: item.intent,
            confidence: `${confidence.toFixed(2)}%`,
            confidenceNumber: confidence,
            priority: item.priority || getPriority(item.intent, confidence),
            department: item.department || getDepartment(item.intent),
            keywords:
              keywords.length > 0
                ? keywords
                : ["email", "message"],
            probabilities: item.probabilities || {},
            date: item.createdAt
              ? new Date(item.createdAt).toLocaleString()
              : "N/A",
          };
        }
      );

      setHistory(formattedHistory);
    } catch (error) {
      console.error("Error loading history:", error);
      setError(error.message || "Unable to load prediction history.");
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // ==========================================
  // INTENT ICON
  // ==========================================

  const getIntentIcon = (intent) => {
    switch (intent) {
      case "Complaint":
        return "😠";
      case "Enquiry":
        return "❓";
      case "Request":
        return "📩";
      case "Feedback":
        return "💬";
      case "Application":
        return "📄";
      case "Other":
        return "📌";
      default:
        return "📧";
    }
  };

  // ==========================================
  // PRIORITY
  // ==========================================

  const getPriority = (intent, confidence) => {
    if (intent === "Complaint") return "High";
    if (confidence >= 70) return "High";
    if (confidence >= 40) return "Medium";
    return "Low";
  };

  // ==========================================
  // DEPARTMENT
  // ==========================================

  const getDepartment = (intent) => {
    switch (intent) {
      case "Complaint":
        return "Customer Support";
      case "Enquiry":
        return "Information Desk";
      case "Request":
        return "Service Department";
      case "Feedback":
        return "Customer Experience";
      case "Application":
        return "HR / Recruitment";
      case "Other":
        return "General Support";
      default:
        return "General Support";
    }
  };

  // ==========================================
  // KEYWORDS
  // ==========================================

  const extractKeywords = (text) => {
    const stopWords = [
      "the",
      "is",
      "am",
      "are",
      "was",
      "were",
      "a",
      "an",
      "and",
      "or",
      "to",
      "of",
      "in",
      "on",
      "for",
      "with",
      "my",
      "me",
      "i",
      "you",
      "your",
      "this",
      "that",
      "it",
      "have",
      "has",
      "had",
      "be",
      "been",
      "please",
      "would",
      "could",
      "can",
      "will",
      "from"
    ];

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 3 &&
          !stopWords.includes(word)
      );

    return [...new Set(words)].slice(0, 5);
  };

  // ==========================================
  // ANALYZE EMAIL
  // ==========================================

  const analyzeEmail = async () => {
    if (!email.trim()) {
      setError("Please enter an email before analyzing.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setError("Please login first.");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/classify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ email })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Prediction failed."
        );
      }

      const confidence = Number(data.confidence);

      const keywords = extractKeywords(email);

      const newResult = {
        id: Date.now(),
        email: email,
        intent: data.intent,
        confidence: `${confidence.toFixed(2)}%`,
        confidenceNumber: confidence,
        priority: getPriority(
          data.intent,
          confidence
        ),
        department: getDepartment(data.intent),
        keywords:
          keywords.length > 0
            ? keywords
            : ["email", "message"],
        probabilities: data.probabilities || {},
        date: new Date().toLocaleString()
      };

      setResult(newResult);

      // Reload from MongoDB so the history always matches the database.
      await loadHistory();
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Unable to connect to backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CLEAR EMAIL
  // ==========================================

  const clearEmail = () => {
    setEmail("");
    setResult(null);
    setError("");
  };

  // ==========================================
  // CLEAR HISTORY
  // ==========================================

  const clearHistory = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setError("Please login first.");
        return;
      }

      const confirmed = window.confirm(
        "Are you sure you want to clear all your prediction history?"
      );

      if (!confirmed) return;

      const response = await fetch(
        "http://localhost:5000/api/predictions",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to clear prediction history."
        );
      }

      setHistory([]);
      setResult(null);
    } catch (error) {
      console.error("Clear history error:", error);
      setError(error.message || "Unable to clear prediction history.");
    }
  };

  // ==========================================
  // SAMPLE EMAILS
  // ==========================================

  const sampleEmails = [
    {
      title: "Complaint",
      text:
        "I am unhappy with my damaged product and I want a refund."
    },
    {
      title: "Enquiry",
      text:
        "Could you please provide information about your services?"
    },
    {
      title: "Request",
      text:
        "I would like to request a change in my account details."
    },
    {
      title: "Feedback",
      text:
        "I really liked your service and wanted to share my feedback."
    },
    {
      title: "Application",
      text:
        "I would like to submit my application for the available position."
    }
  ];

  // ==========================================
  // ANALYTICS
  // ==========================================

  const intentNames = [
    "Complaint",
    "Enquiry",
    "Request",
    "Feedback",
    "Application",
    "Other"
  ];

  const getIntentCount = (intent) => {
    return history.filter(
      (item) => item.intent === intent
    ).length;
  };

  const totalEmails = history.length;

  const averageConfidence =
    totalEmails > 0
      ? history.reduce(
          (sum, item) =>
            sum + Number(item.confidenceNumber || 0),
          0
        ) / totalEmails
      : 0;

  const highPriority = history.filter(
    (item) => item.priority === "High"
  ).length;

  const mediumPriority = history.filter(
    (item) => item.priority === "Medium"
  ).length;

  const lowPriority = history.filter(
    (item) => item.priority === "Low"
  ).length;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="logo">
          <div className="logo-icon">✉️</div>

          <div>
            <h2>EmailAI</h2>
            <span>Intent Classifier</span>
          </div>
        </div>

        <nav className="sidebar-nav">

          <a href="#home" className="active">
            🏠 Dashboard
          </a>

          <a href="#predict">
            🤖 Prediction
          </a>

          <a href="#analytics">
            📊 Analytics
          </a>

          <a href="#history">
            🕘 History
          </a>

          <a href="#intents">
            📋 Supported Intents
          </a>

        </nav>

        <div className="sidebar-bottom">

          <div className="ai-status">
            <span className="status-dot"></span>

            <div>
              <strong>AI Model</strong>
              <small>Online & Ready</small>
            </div>
          </div>

        </div>

      </aside>

      {/* MAIN CONTENT */}

      <main className="main-content">

        {/* HEADER */}

        <header className="header" id="home">

          <div>
            <h1>Email Intent Classification</h1>

            <p>
              Analyze emails using AI and automatically
              identify their intent.
            </p>
          </div>

          <div className="header-badge">
            🤖 AI Powered
          </div>

        </header>

        {/* ========================================
            ANALYTICS DASHBOARD
        ======================================== */}

        <section
          className="analytics-section"
          id="analytics"
        >

          <div className="section-title">

            <div>
              <h2>📊 Analytics Dashboard</h2>

              <p>
                Overview of your email classification
                activity.
              </p>
            </div>

          </div>

          <div className="stats-grid">

            {/* TOTAL */}

            <div className="stat-card">
              <div className="stat-icon">📧</div>

              <div>
                <span>Total Emails</span>
                <strong>{totalEmails}</strong>
              </div>
            </div>

            {/* COMPLAINT */}

            <div className="stat-card">
              <div className="stat-icon">😠</div>

              <div>
                <span>Complaints</span>
                <strong>
                  {getIntentCount("Complaint")}
                </strong>
              </div>
            </div>

            {/* ENQUIRY */}

            <div className="stat-card">
              <div className="stat-icon">❓</div>

              <div>
                <span>Enquiries</span>
                <strong>
                  {getIntentCount("Enquiry")}
                </strong>
              </div>
            </div>

            {/* REQUEST */}

            <div className="stat-card">
              <div className="stat-icon">📩</div>

              <div>
                <span>Requests</span>
                <strong>
                  {getIntentCount("Request")}
                </strong>
              </div>
            </div>

            {/* FEEDBACK */}

            <div className="stat-card">
              <div className="stat-icon">💬</div>

              <div>
                <span>Feedback</span>
                <strong>
                  {getIntentCount("Feedback")}
                </strong>
              </div>
            </div>

            {/* APPLICATION */}

            <div className="stat-card">
              <div className="stat-icon">📄</div>

              <div>
                <span>Applications</span>
                <strong>
                  {getIntentCount("Application")}
                </strong>
              </div>
            </div>

            {/* OTHER */}

            <div className="stat-card">
              <div className="stat-icon">📌</div>

              <div>
                <span>Other</span>
                <strong>
                  {getIntentCount("Other")}
                </strong>
              </div>
            </div>

            {/* CONFIDENCE */}

            <div className="stat-card">
              <div className="stat-icon">🎯</div>

              <div>
                <span>Avg. Confidence</span>

                <strong>
                  {averageConfidence.toFixed(1)}%
                </strong>
              </div>
            </div>

          </div>

          {/* ANALYTICS LOWER SECTION */}

          <div className="analytics-grid">

            {/* INTENT DISTRIBUTION */}

            <div className="card chart-card">

              <h2>📈 Intent Distribution</h2>

              <p>
                Number of emails classified by intent.
              </p>

              <div className="bar-chart">

                {intentNames.map((intent) => {

                  const count =
                    getIntentCount(intent);

                  const maxCount =
                    Math.max(
                      ...intentNames.map(
                        (name) =>
                          getIntentCount(name)
                      ),
                      1
                    );

                  const percentage =
                    (count / maxCount) * 100;

                  return (
                    <div
                      className="chart-row"
                      key={intent}
                    >

                      <div className="chart-label">
                        <span>
                          {getIntentIcon(intent)}
                        </span>

                        <strong>
                          {intent}
                        </strong>
                      </div>

                      <div className="chart-bar-container">

                        <div
                          className="chart-bar"
                          style={{
                            width: `${percentage}%`
                          }}
                        ></div>

                      </div>

                      <span className="chart-count">
                        {count}
                      </span>

                    </div>
                  );

                })}

              </div>

            </div>

            {/* PRIORITY */}

            <div className="card priority-card">

              <h2>🚨 Priority Overview</h2>

              <p>
                Classification based on detected
                email priority.
              </p>

              <div className="priority-stat high">
                <span>🔴 High Priority</span>
                <strong>{highPriority}</strong>
              </div>

              <div className="priority-stat medium">
                <span>🟠 Medium Priority</span>
                <strong>{mediumPriority}</strong>
              </div>

              <div className="priority-stat low">
                <span>🟢 Low Priority</span>
                <strong>{lowPriority}</strong>
              </div>

            </div>

          </div>

        </section>

        {/* ========================================
            EMAIL INPUT
        ======================================== */}

        <section
          className="card input-card"
          id="predict"
        >

          <div className="card-header">

            <div>
              <h2>📧 Analyze Email</h2>

              <p>
                Enter an email message to classify
                its intent.
              </p>
            </div>

          </div>

          <textarea
            className="email-input"
            placeholder="Example: I am unhappy with my recent order and would like a refund..."
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <div className="input-actions">

            <div className="character-count">
              {email.length} characters
            </div>

            <div className="button-group">

              <button
                className="clear-button"
                onClick={clearEmail}
                disabled={loading}
              >
                Clear
              </button>

              <button
                className="analyze-button"
                onClick={analyzeEmail}
                disabled={loading}
              >
                {loading
                  ? "⏳ Analyzing..."
                  : "🔍 Analyze Email"}
              </button>

            </div>

          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

        </section>

        {/* SAMPLE EMAILS */}

        <section className="card samples-card">

          <div className="card-header">

            <div>
              <h2>⚡ Try Sample Emails</h2>

              <p>
                Quickly test the AI model.
              </p>
            </div>

          </div>

          <div className="sample-grid">

            {sampleEmails.map(
              (sample, index) => (

                <button
                  key={index}
                  className="sample-button"
                  onClick={() =>
                    setEmail(sample.text)
                  }
                >
                  <span>
                    {getIntentIcon(
                      sample.title
                    )}
                  </span>

                  <strong>
                    {sample.title}
                  </strong>
                </button>

              )
            )}

          </div>

        </section>

        {/* ========================================
            PREDICTION RESULT
        ======================================== */}

        {result && (

          <section className="card prediction-card">

            <div className="card-header">

              <div>
                <h2>🎯 Prediction Result</h2>

                <p>
                  AI analysis of the submitted email.
                </p>
              </div>

            </div>

            <div className="prediction-main">

              <div className="intent-display">

                <div className="intent-icon">
                  {getIntentIcon(result.intent)}
                </div>

                <div>
                  <span className="result-label">
                    Detected Intent
                  </span>

                  <h1>{result.intent}</h1>
                </div>

              </div>

              <div className="confidence-box">

                <span>Confidence</span>

                <strong>
                  {result.confidence}
                </strong>

              </div>

            </div>

            {/* CONFIDENCE BAR */}

            <div className="confidence-section">

              <div className="confidence-header">

                <span>Model Confidence</span>

                <span>
                  {result.confidence}
                </span>

              </div>

              <div className="progress-bar">

                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(
                      result.confidenceNumber,
                      100
                    )}%`
                  }}
                ></div>

              </div>

            </div>

            {/* DETAILS */}

            <div className="details-grid">

              <div className="detail-box">

                <span className="detail-icon">
                  🚨
                </span>

                <div>
                  <small>Priority</small>

                  <strong>
                    {result.priority}
                  </strong>
                </div>

              </div>

              <div className="detail-box">

                <span className="detail-icon">
                  🏢
                </span>

                <div>
                  <small>Department</small>

                  <strong>
                    {result.department}
                  </strong>
                </div>

              </div>

              <div className="detail-box">

                <span className="detail-icon">
                  🔑
                </span>

                <div>
                  <small>Keywords</small>

                  <div className="keyword-list">

                    {result.keywords.map(
                      (keyword, index) => (

                        <span
                          key={index}
                          className="keyword"
                        >
                          {keyword}
                        </span>

                      )
                    )}

                  </div>

                </div>

              </div>

            </div>

            {/* PROBABILITIES */}

            {Object.keys(
              result.probabilities || {}
            ).length > 0 && (

              <div className="probabilities">

                <h3>
                  📊 Intent Probabilities
                </h3>

                {Object.entries(
                  result.probabilities
                ).map(
                  ([intent, probability]) => {

                    const value =
                      Number(probability);

                    return (
                      <div
                        className="probability-row"
                        key={intent}
                      >

                        <div className="probability-info">

                          <span>
                            {getIntentIcon(intent)}{" "}
                            {intent}
                          </span>

                          <strong>
                            {value.toFixed(2)}%
                          </strong>

                        </div>

                        <div className="probability-bar">

                          <div
                            className="probability-fill"
                            style={{
                              width: `${Math.min(
                                value,
                                100
                              )}%`
                            }}
                          ></div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            )}

          </section>

        )}

        {/* ========================================
            HISTORY
        ======================================== */}

        <section
          className="card history-card"
          id="history"
        >

          <div className="history-header">

            <div>

              <h2>
                🕘 Prediction History
              </h2>

              <p>
                Previous email classifications
              </p>

            </div>

            {history.length > 0 && (

              <button
                className="clear-history-button"
                onClick={clearHistory}
              >
                🗑 Clear History
              </button>

            )}

          </div>

          {history.length === 0 ? (

            <div className="empty-history">

              <div>📭</div>

              <p>No predictions yet.</p>

              <span>
                Your classified emails will
                appear here.
              </span>

            </div>

          ) : (

            <div className="history-list">

              {history.map((item) => (

                <div
                  className="history-item"
                  key={item.id}
                >

                  <div className="history-icon">
                    {getIntentIcon(item.intent)}
                  </div>

                  <div className="history-content">

                    <div className="history-top">

                      <h3>{item.intent}</h3>

                      <span className="history-confidence">
                        {item.confidence}
                      </span>

                    </div>

                    <p className="history-email">
                      {item.email}
                    </p>

                    <div className="history-meta">

                      <span>
                        🚨 {item.priority}
                      </span>

                      <span>
                        🏢 {item.department}
                      </span>

                    </div>

                    <span className="history-date">
                      🕒 {item.date}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* ========================================
            SUPPORTED INTENTS
        ======================================== */}

        <section
          className="card intents-card"
          id="intents"
        >

          <div className="card-header">

            <div>
              <h2>📋 Supported Intents</h2>

              <p>
                Categories recognized by the ML model.
              </p>
            </div>

          </div>

          <div className="intent-grid">

            {intentNames.map((intent) => (

              <div
                className="intent-item"
                key={intent}
              >

                <span>
                  {getIntentIcon(intent)}
                </span>

                <strong>{intent}</strong>

                <small>
                  {intent === "Complaint" &&
                    "Customer dissatisfaction"}

                  {intent === "Enquiry" &&
                    "Questions and information"}

                  {intent === "Request" &&
                    "Service or action requests"}

                  {intent === "Feedback" &&
                    "Opinions and suggestions"}

                  {intent === "Application" &&
                    "Job or service applications"}

                  {intent === "Other" &&
                    "Uncategorized emails"}
                </small>

              </div>

            ))}

          </div>

        </section>

        {/* FOOTER */}

        <footer className="footer">

          <p>
            🤖 EmailAI — AI-Powered Email Intent
            Classification System
          </p>

          <span>
            Powered by Machine Learning
          </span>

        </footer>

      </main>

    </div>
  );
}

// ==========================================
// APPLICATION ROUTER
// ==========================================

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
