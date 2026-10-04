const express = require("express");

const router = express.Router();

const walletController = require("../controllers/wallet.controller");

const authMiddleware = require("../middleware/auth.middleware");

// -----------------------------------------
// Get current user's wallet balance
// -----------------------------------------

router.get(
  "/gems",
  authMiddleware,
  walletController.getWalletBalance
);

// -----------------------------------------
// Get current user's GEM transactions
// -----------------------------------------

router.get(
  "/transactions",
  authMiddleware,
  walletController.getWalletTransactions
);

module.exports = router;