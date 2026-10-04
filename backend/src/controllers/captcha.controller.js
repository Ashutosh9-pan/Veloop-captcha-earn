const captchaService = require("../services/captcha.service");

// -----------------------------------------
// Generate CAPTCHA
// -----------------------------------------

const generateCaptcha = async (req, res) => {
  try {
    const userId =
      req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication required",
      });
    }

    const challenge =
      await captchaService.createCaptchaChallenge(
        userId
      );

    return res.status(201).json({
      success: true,
      message:
        "CAPTCHA challenge generated successfully",
      data: challenge,
    });
  } catch (error) {
    console.error(
      "Generate CAPTCHA error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Unable to generate CAPTCHA challenge",
    });
  }
};

// -----------------------------------------
// Get CAPTCHA Visual Image
// -----------------------------------------

const getCaptchaImage = async (req, res) => {
  try {
    const userId =
      req.user?.id || req.user?._id;

    const { challengeId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication required",
      });
    }

    if (!challengeId) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message:
          "Challenge ID is required",
      });
    }

    const image =
      await captchaService.generateCaptchaImage(
        challengeId,
        userId
      );

    res.setHeader(
      "Content-Type",
      "image/svg+xml"
    );

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );

    return res.status(200).send(image);
  } catch (error) {
    console.error(
      "CAPTCHA image error:",
      error
    );

    if (
      error.message ===
      "CAPTCHA challenge not found"
    ) {
      return res.status(404).json({
        success: false,
        code: "CHALLENGE_NOT_FOUND",
        message: error.message,
      });
    }

    if (
      error.message ===
      "CAPTCHA challenge is no longer active"
    ) {
      return res.status(409).json({
        success: false,
        code:
          "CHALLENGE_ALREADY_COMPLETED",
        message: error.message,
      });
    }

    if (
      error.message ===
      "CAPTCHA challenge has expired"
    ) {
      return res.status(410).json({
        success: false,
        code: "CHALLENGE_EXPIRED",
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Unable to generate CAPTCHA image",
    });
  }
};

// -----------------------------------------
// Submit / Verify CAPTCHA
// -----------------------------------------

const submitCaptcha = async (req, res) => {
  try {
    const userId =
      req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication required",
      });
    }

    const {
      challengeId,
      selectedOption,
    } = req.body;

    // Controller-level validation
    if (
      !challengeId ||
      !selectedOption
    ) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message:
          "Challenge ID and selected option are required",
      });
    }

    const result =
      await captchaService.verifyCaptchaChallenge(
        challengeId,
        userId,
        selectedOption
      );

    // -------------------------------------
    // Known challenge states
    // -------------------------------------

    if (
      result.code ===
      "CHALLENGE_ALREADY_COMPLETED"
    ) {
      return res.status(409).json(result);
    }

    if (
      result.code ===
      "CHALLENGE_EXPIRED"
    ) {
      return res.status(410).json(result);
    }

    if (
      result.code ===
      "CHALLENGE_NOT_FOUND"
    ) {
      return res.status(404).json(result);
    }

    if (
      result.code ===
      "INVALID_OPTION"
    ) {
      return res.status(400).json(result);
    }

    if (
      result.code ===
      "VALIDATION_ERROR"
    ) {
      return res.status(400).json(result);
    }

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Submit CAPTCHA error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Unable to verify CAPTCHA",
    });
  }
};

// -----------------------------------------
// Claim Reward
// -----------------------------------------

const claimCaptcha = async (req, res) => {
  try {
    const userId =
      req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication required",
      });
    }

    const { challengeId } = req.body;

    if (!challengeId) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message:
          "Challenge ID is required",
      });
    }

    const result =
      await captchaService.claimCaptchaReward(
        challengeId,
        userId
      );

    if (
      result.code ===
      "CHALLENGE_NOT_FOUND"
    ) {
      return res.status(404).json(result);
    }

    if (
      result.code ===
      "REWARD_ALREADY_CLAIMED"
    ) {
      return res.status(409).json(result);
    }

    if (
      result.code ===
      "CLAIM_NOT_AVAILABLE"
    ) {
      return res.status(409).json(result);
    }

    if (
      result.code ===
      "NO_REWARD_AVAILABLE"
    ) {
      return res.status(409).json(result);
    }

    if (
      result.code ===
      "VALIDATION_ERROR"
    ) {
      return res.status(400).json(result);
    }

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Claim CAPTCHA error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Unable to claim CAPTCHA reward",
    });
  }
};

// -----------------------------------------
// No Thanks / Skip
// -----------------------------------------

const skipCaptcha = async (req, res) => {
  try {
    const userId =
      req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication required",
      });
    }

    const { challengeId } = req.body;

    if (!challengeId) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message:
          "Challenge ID is required",
      });
    }

    const result =
      await captchaService.skipCaptchaChallenge(
        challengeId,
        userId
      );

    if (
      result.code ===
      "CHALLENGE_NOT_FOUND"
    ) {
      return res.status(404).json(result);
    }

    if (
      result.code ===
      "VALIDATION_ERROR"
    ) {
      return res.status(400).json(result);
    }

    if (!result.success) {
      return res.status(409).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Skip CAPTCHA error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Unable to skip CAPTCHA",
    });
  }
};

// -----------------------------------------
// Get CAPTCHA History
// -----------------------------------------

const getCaptchaHistory = async (
  req,
  res
) => {
  try {
    const userId =
      req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication required",
      });
    }

    const limit =
      req.query.limit || 20;

    const result =
      await captchaService.getCaptchaHistory(
        userId,
        limit
      );

    if (
      result.code ===
      "VALIDATION_ERROR"
    ) {
      return res.status(400).json(result);
    }

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Get CAPTCHA history error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Unable to fetch CAPTCHA history",
    });
  }
};

// -----------------------------------------
// Exports
// -----------------------------------------

module.exports = {
  generateCaptcha,
  getCaptchaImage,
  submitCaptcha,
  claimCaptcha,
  skipCaptcha,
  getCaptchaHistory,
};