const mongoose = require("mongoose");

const captchaRewardConfigSchema =
  new mongoose.Schema(
    {
      correctReward: {
        type: Number,
        required: true,
        min: 0,
        default: 1,
      },

      wrongReward: {
        type: Number,
        required: true,
        min: 0,
        default: 0.5,
      },

      currency: {
        type: String,
        required: true,
        enum: ["GEM"],
        default: "GEM",
      },

      active: {
        type: Boolean,
        required: true,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

// Only one active configuration is needed
captchaRewardConfigSchema.index(
  { active: 1 }
);

module.exports = mongoose.model(
  "CaptchaRewardConfig",
  captchaRewardConfigSchema
);