const express = require("express");

const {
  generateCaptcha,
  getCaptchaImage,
  submitCaptcha,
  claimCaptcha,
  skipCaptcha,
  getCaptchaHistory,
} = require("../controllers/captcha.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// -----------------------------------------
// Generate new CAPTCHA
// -----------------------------------------

router.get(
  "/generate",
  authMiddleware,
  generateCaptcha
);

// -----------------------------------------
// Get CAPTCHA visual image
// -----------------------------------------

router.get(
  "/image/:challengeId",
  authMiddleware,
  getCaptchaImage
);

// -----------------------------------------
// Verify CAPTCHA answer
// -----------------------------------------

router.post(
  "/submit",
  authMiddleware,
  submitCaptcha
);

// -----------------------------------------
// Claim reward
// -----------------------------------------

router.post(
  "/claim",
  authMiddleware,
  claimCaptcha
);

// -----------------------------------------
// No Thanks / Skip CAPTCHA
// -----------------------------------------

router.post(
  "/skip",
  authMiddleware,
  skipCaptcha
);

// -----------------------------------------
// CAPTCHA History
// -----------------------------------------

router.get(
  "/history",
  authMiddleware,
  getCaptchaHistory
);

module.exports = router;