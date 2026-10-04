const mongoose = require("mongoose");

const gemTransactionSchema = new mongoose.Schema(
  {
    // Unique transaction ID
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    // User who received the gems
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Currency type
    currency: {
      type: String,
      enum: ["GEM"],
      default: "GEM",
      required: true,
    },

    // Amount credited
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    // Transaction type
    type: {
      type: String,
      enum: ["CAPTCHA_REWARD"],
      required: true,
      index: true,
    },

    // Reward source
    source: {
      type: String,
      enum: ["CAPTCHA_EARN"],
      required: true,
      index: true,
    },

    // CAPTCHA challenge that generated this reward
    referenceId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    // Wallet balance before reward
    balanceBefore: {
      type: Number,
      required: true,
      min: 0,
    },

    // Wallet balance after reward
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },

    // Transaction status
    status: {
      type: String,
      enum: ["COMPLETED"],
      default: "COMPLETED",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// --------------------------------------------------
// Prevent duplicate reward for same CAPTCHA challenge
// --------------------------------------------------

gemTransactionSchema.index(
  {
    userId: 1,
    referenceId: 1,
    type: 1,
  },
  {
    unique: true,
    name: "unique_captcha_reward_per_user",
  }
);

// --------------------------------------------------
// Useful index for user's transaction history
// --------------------------------------------------

gemTransactionSchema.index({
  userId: 1,
  createdAt: -1,
});

// --------------------------------------------------
// Export
// --------------------------------------------------

module.exports = mongoose.model(
  "GemTransaction",
  gemTransactionSchema
);