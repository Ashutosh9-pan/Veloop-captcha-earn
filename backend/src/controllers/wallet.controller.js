const Wallet = require("../models/Wallet");
const GemTransaction = require("../models/GemTransaction");

// -----------------------------------------
// Get current user's wallet balance
// -----------------------------------------

const getWalletBalance = async (req, res) => {
  try {
    const userId =
      req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const wallet = await Wallet.findOne({
      userId,
    }).lean();

    if (!wallet) {
      return res.status(200).json({
        success: true,
        data: {
          gems: 0,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        gems: Number(wallet.gems) || 0,
      },
    });
  } catch (error) {
    console.error(
      "Get wallet balance error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch wallet balance",
    });
  }
};

// -----------------------------------------
// Get user's GEM transaction history
// -----------------------------------------

const getWalletTransactions = async (
  req,
  res
) => {
  try {
    const userId =
      req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const limitValue = Number(
      req.query.limit
    );

    const limit =
      Number.isFinite(limitValue) &&
      limitValue > 0
        ? Math.min(limitValue, 100)
        : 20;

    const transactions =
      await GemTransaction.find({
        userId,
      })
        .select(
          "-_id transactionId currency amount type source referenceId balanceBefore balanceAfter status createdAt"
        )
        .sort({
          createdAt: -1,
        })
        .limit(limit)
        .lean();

    return res.status(200).json({
      success: true,

      data: {
        transactions,
        count: transactions.length,
      },
    });
  } catch (error) {
    console.error(
      "Get wallet transactions error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch wallet transactions",
    });
  }
};

// -----------------------------------------
// Exports
// -----------------------------------------

module.exports = {
  getWalletBalance,
  getWalletTransactions,
};