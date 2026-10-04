const mongoose = require("mongoose");

const captchaChallengeSchema = new mongoose.Schema(
  {
    challengeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    captchaText: {
      type: String,
      required: true,
      select: false,
    },

    options: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => value.length === 4,
        message: "Captcha must contain exactly 4 options",
      },
    },

    correctOption: {
      type: String,
      required: true,
      select: false,
    },

    status: {
      type: String,
      enum: ["active", "completed", "skipped", "expired"],
      default: "active",
      index: true,
    },

    selectedOption: {
      type: String,
      default: null,
    },

    result: {
      type: String,
      enum: ["correct", "wrong", null],
      default: null,
    },

    rewardAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    rewardStatus: {
      type: String,
      enum: ["pending", "claimed", "none"],
      default: "none",
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    claimedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

captchaChallengeSchema.index({
  userId: 1,
  createdAt: -1,
});

captchaChallengeSchema.index({
  userId: 1,
  status: 1,
});

module.exports = mongoose.model(
  "CaptchaChallenge",
  captchaChallengeSchema
);