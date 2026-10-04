const mongoose = require("mongoose");

const captchaAttemptSchema = new mongoose.Schema(
  {
    attemptId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CaptchaChallenge",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    selectedOption: {
      type: String,
      required: true,
    },

    result: {
      type: String,
      enum: ["correct", "wrong", "expired"],
      required: true,
    },

    rewardAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    rewardStatus: {
      type: String,
      enum: ["pending", "credited", "none"],
      default: "none",
    },

    attemptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

captchaAttemptSchema.index({ userId: 1, createdAt: -1 });
captchaAttemptSchema.index({ challengeId: 1, userId: 1 });

module.exports = mongoose.model(
  "CaptchaAttempt",
  captchaAttemptSchema
);