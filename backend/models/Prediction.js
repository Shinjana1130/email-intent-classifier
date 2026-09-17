const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
    },

    intent: {
      type: String,
      required: true,
    },

    confidence: {
      type: Number,
      required: true,
    },

    priority: {
      type: String,
      required: true,
    },

    department: {
      type: String,
      required: true,
    },

    probabilities: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Prediction", predictionSchema);