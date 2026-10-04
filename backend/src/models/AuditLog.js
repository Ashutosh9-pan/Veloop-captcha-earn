const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        "CHALLENGE_CREATED",
        "CHALLENGE_VERIFIED",
        "REWARD_CREATED",
        "REWARD_CLAIMED",
        "DUPLICATE_ATTEMPT",
        "INVALID_ATTEMPT",
        "EXPIRED_CHALLENGE",
        "SUSPICIOUS_REQUEST",
      ],
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    challengeId: {
      type: String,
      default: null,
      index: true,
    },

    referenceId: {
      type: String,
      default: null,
      index: true,
    },

    result: {
      type: String,
      enum: ["CORRECT", "WRONG", null],
      default: null,
    },

    rewardAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "SUCCESS",
        "FAILED",
        "BLOCKED",
        "INFO",
      ],
      default: "INFO",
    },

    message: {
      type: String,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Useful query indexes
auditLogSchema.index({
  userId: 1,
  createdAt: -1,
});

auditLogSchema.index({
  challengeId: 1,
  createdAt: -1,
});

auditLogSchema.index({
  action: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "AuditLog",
  auditLogSchema
);