// ==========================================
// EMAIL INTENT CLASSIFICATION - BACKEND
// ==========================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { spawn } = require("child_process");

const connectDB = require("./models/db");
const authRoutes = require("./routes/auth");
const Prediction = require("./models/Prediction");
const authMiddleware = require("./middleware/authMiddleware");

// ==========================================
// APP SETUP
// ==========================================

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// CONNECT TO MONGODB
// ==========================================

connectDB();

// ==========================================
// AUTH ROUTES
// ==========================================

app.use("/api/auth", authRoutes);

// ==========================================
// BASIC TEST ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Email Intent Classification API is running",
  });
});

// ==========================================
// DEPARTMENT MAPPING
// ==========================================

const getDepartment = (intent) => {
  const departments = {
    Complaint: "Customer Support",
    Enquiry: "Information Desk",
    Request: "Service Department",
    Feedback: "Customer Experience",
    Application: "HR / Recruitment",
    Other: "General Support",
  };

  return departments[intent] || "General Support";
};

// ==========================================
// PRIORITY CALCULATION
// ==========================================

const getPriority = (intent, confidence) => {
  // Complaints are treated as high priority
  if (intent === "Complaint") {
    return "High";
  }

  if (confidence >= 70) {
    return "High";
  }

  if (confidence >= 40) {
    return "Medium";
  }

  return "Low";
};

// ==========================================
// CLASSIFY EMAIL
// ==========================================

app.post("/api/classify", authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;

    // ------------------------------------------
    // VALIDATION
    // ------------------------------------------

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email text is required",
      });
    }

    // ------------------------------------------
    // PYTHON PATH
    // ------------------------------------------

    const pythonPath =
      "C:\\Users\\Dell\\Documents\\email-intent-classifier\\ml\\venv\\Scripts\\python.exe";

    // ------------------------------------------
    // ML SCRIPT PATH
    // ------------------------------------------

    const mlPath = path.join(__dirname, "..", "ml");

    const scriptPath = path.join(mlPath, "predict_api.py");

    // ------------------------------------------
    // RUN PYTHON ML MODEL
    // ------------------------------------------

    const pythonProcess = spawn(pythonPath, [
      scriptPath,
      email,
    ]);

    let output = "";
    let errorOutput = "";

    // ------------------------------------------
    // PYTHON OUTPUT
    // ------------------------------------------

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    // ------------------------------------------
    // PYTHON ERROR
    // ------------------------------------------

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    // ------------------------------------------
    // PROCESS COMPLETED
    // ------------------------------------------

    pythonProcess.on("close", async (code) => {
      try {
        if (code !== 0) {
          console.error("Python error:", errorOutput);

          return res.status(500).json({
            success: false,
            message: "ML prediction failed",
            error: errorOutput,
          });
        }

        console.log("Python output:");
        console.log(output);

        // ------------------------------------------
        // PARSE INTENT
        // ------------------------------------------

        const intentMatch = output.match(
          /intent:\s*(.+)/i
        );

        // ------------------------------------------
        // PARSE CONFIDENCE
        // ------------------------------------------

        const confidenceMatch = output.match(
          /confidence:\s*([\d.]+)%/i
        );

        if (!intentMatch || !confidenceMatch) {
          console.error(
            "Unable to parse Python output:",
            output
          );

          return res.status(500).json({
            success: false,
            message: "Invalid ML prediction output",
          });
        }

        const intent = intentMatch[1].trim();

        const confidence = parseFloat(
          confidenceMatch[1]
        );

        // ------------------------------------------
        // PARSE PROBABILITIES
        // ------------------------------------------

        const probabilities = {};

        const probabilityRegex =
          /([A-Za-z]+):\s*([\d.]+)%/g;

        let match;

        while ((match = probabilityRegex.exec(output)) !== null) {
          const label = match[1];
          const value = parseFloat(match[2]);

          if (
            label !== "intent" &&
            label !== "confidence"
          ) {
            probabilities[label] = value;
          }
        }

        // ------------------------------------------
        // DEPARTMENT
        // ------------------------------------------

        const department = getDepartment(intent);

        // ------------------------------------------
        // PRIORITY
        // ------------------------------------------

        const priority = getPriority(
          intent,
          confidence
        );

        // ------------------------------------------
        // SAVE PREDICTION TO MONGODB
        // ------------------------------------------

        const prediction = new Prediction({
          userId: req.user.userId,
          email: email.trim(),
          intent,
          confidence,
          priority,
          department,
          probabilities,
        });

        await prediction.save();

        console.log(
          "Prediction saved to MongoDB:",
          prediction._id
        );

        // ------------------------------------------
        // SEND RESPONSE
        // ------------------------------------------

        return res.json({
          success: true,
          message: "Email classified successfully",

          intent,

          confidence,

          priority,

          department,

          probabilities,
        });
      } catch (error) {
        console.error(
          "Prediction processing error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Error processing ML prediction",
        });
      }
    });
  } catch (error) {
    console.error(
      "Classification error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error during classification",
    });
  }
});

// ==========================================
// GET USER PREDICTION HISTORY
// ==========================================

app.get(
  "/api/predictions",
  authMiddleware,
  async (req, res) => {
    try {
      const predictions =
        await Prediction.find({
          userId: req.user.userId,
        }).sort({
          createdAt: -1,
        });

      res.json({
        success: true,
        predictions,
      });
    } catch (error) {
      console.error(
        "History fetch error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to fetch prediction history",
      });
    }
  }
);

// ==========================================
// DELETE USER PREDICTION HISTORY
// ==========================================

app.delete(
  "/api/predictions",
  authMiddleware,
  async (req, res) => {
    try {
      const result =
        await Prediction.deleteMany({
          userId: req.user.userId,
        });

      res.json({
        success: true,
        message:
          "Prediction history cleared successfully",
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error(
        "History delete error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to clear prediction history",
      });
    }
  }
);

// ==========================================
// SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});