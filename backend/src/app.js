const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth.routes");
const captchaRoutes = require("./routes/captcha.routes");
const walletRoutes = require("./routes/wallet.routes");

const app = express();

// -----------------------------------------
// Security
// -----------------------------------------

app.use(helmet());

// -----------------------------------------
// CORS
// -----------------------------------------

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);

// -----------------------------------------
// JSON parser
// -----------------------------------------

app.use(express.json());

// -----------------------------------------
// Global API rate limit
// -----------------------------------------

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

// -----------------------------------------
// Routes
// -----------------------------------------

app.use("/api/auth", authRoutes);

app.use("/api/captcha", captchaRoutes);

app.use("/api/wallet", walletRoutes);

// -----------------------------------------
// Health check
// -----------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message:
      "Welcome to VELoop CAPTCHA Earn API",
  });
});

// -----------------------------------------
// Export
// -----------------------------------------

module.exports = app;