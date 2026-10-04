const crypto = require("crypto");
const mongoose = require("mongoose");

const CaptchaChallenge = require("../models/CaptchaChallenge");
const Wallet = require("../models/Wallet");
const GemTransaction = require("../models/GemTransaction");
const CaptchaRewardConfig = require("../models/CaptchaRewardConfig");
const AuditLog = require("../models/AuditLog");

const CAPTCHA_LENGTH = 6;
const CAPTCHA_EXPIRY_MINUTES = 5;

const CHARACTERS =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// -----------------------------------------
// Generate CAPTCHA text
// -----------------------------------------

const generateCaptchaText = () => {
  let captchaText = "";

  for (let i = 0; i < CAPTCHA_LENGTH; i++) {
    const randomIndex = crypto.randomInt(
      0,
      CHARACTERS.length
    );

    captchaText += CHARACTERS[randomIndex];
  }

  return captchaText;
};

// -----------------------------------------
// Shuffle options
// -----------------------------------------

const shuffleOptions = (options) => {
  const shuffled = [...options];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = crypto.randomInt(
      0,
      i + 1
    );

    [shuffled[i], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[i],
    ];
  }

  return shuffled;
};

// -----------------------------------------
// Escape XML safely
// -----------------------------------------

const escapeXml = (value) => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

// -----------------------------------------
// Get active CAPTCHA reward configuration
// -----------------------------------------

const getActiveRewardConfig = async () => {
  let config =
    await CaptchaRewardConfig.findOne({
      active: true,
    }).sort({
      updatedAt: -1,
    });

  // Create the initial backend configuration
  // automatically if no active configuration exists.
  if (!config) {
    config =
      await CaptchaRewardConfig.create({
        correctReward: 1,
        wrongReward: 0.5,
        currency: "GEM",
        active: true,
      });
  }

  const correctReward =
    Number(config.correctReward);

  const wrongReward =
    Number(config.wrongReward);

  if (
    !Number.isFinite(correctReward) ||
    correctReward < 0
  ) {
    throw new Error(
      "Invalid correct reward configuration"
    );
  }

  if (
    !Number.isFinite(wrongReward) ||
    wrongReward < 0
  ) {
    throw new Error(
      "Invalid wrong reward configuration"
    );
  }

  if (config.currency !== "GEM") {
    throw new Error(
      "Invalid reward currency configuration"
    );
  }

  return config;
};

// -----------------------------------------
// Create Audit Log
// -----------------------------------------

const createAuditLog = async ({
  action,
  userId = null,
  challengeId = null,
  referenceId = null,
  result = null,
  rewardAmount = 0,
  status = "INFO",
  message = null,
  metadata = {},
  session = null,
}) => {
  try {
    const auditData = { action, userId, challengeId, referenceId, result, rewardAmount, status, message, metadata };
    if (session) await AuditLog.create([auditData], { session });
    else await AuditLog.create(auditData);
  } catch (error) {
    console.error("Audit log error:", error);
  }
};

// -----------------------------------------
// Create CAPTCHA challenge
// -----------------------------------------

const createCaptchaChallenge = async (
  userId
) => {
  if (!userId) {
    throw new Error(
      "User ID is required"
    );
  }

  // Invalidate any currently active challenge
  await CaptchaChallenge.updateMany(
    {
      userId,
      status: "active",
    },
    {
      $set: {
        status: "skipped",
      },
    }
  );

  const captchaText =
    generateCaptchaText();

  const options = new Set();

  // Correct option
  options.add(captchaText);

  // 3 incorrect options
  while (options.size < 4) {
    const wrongOption =
      generateCaptchaText();

    if (!options.has(wrongOption)) {
      options.add(wrongOption);
    }
  }

  const shuffledOptions =
    shuffleOptions([
      ...options,
    ]);

  const challengeId =
    crypto.randomUUID();

  const expiresAt = new Date(
    Date.now() +
      CAPTCHA_EXPIRY_MINUTES *
        60 *
        1000
  );

  const challenge =
    await CaptchaChallenge.create({
      challengeId,
      userId,
      captchaText,
      options: shuffledOptions,
      correctOption: captchaText,
      status: "active",
      rewardAmount: 0,
      rewardStatus: "none",
      expiresAt,
    });

  await createAuditLog({
    action: "CHALLENGE_CREATED",
    userId,
    challengeId: challenge.challengeId,
    status: "SUCCESS",
    message: "CAPTCHA challenge created",
    metadata: { expiresAt: challenge.expiresAt, optionCount: challenge.options.length },
  });

  return {
    challengeId:
      challenge.challengeId,

    options:
      challenge.options,

    expiresAt:
      challenge.expiresAt,
  };
};

// -----------------------------------------
// Generate visual CAPTCHA image
// -----------------------------------------

const generateCaptchaImage = async (
  challengeId,
  userId
) => {
  const challenge =
    await CaptchaChallenge.findOne({
      challengeId,
      userId,
    }).select(
      "+captchaText"
    );

  if (!challenge) {
    throw new Error(
      "CAPTCHA challenge not found"
    );
  }

  if (
    challenge.status !== "active"
  ) {
    throw new Error(
      "CAPTCHA challenge is no longer active"
    );
  }

  if (
    challenge.expiresAt < new Date()
  ) {
    challenge.status =
      "expired";

    challenge.rewardStatus =
      "none";

    await challenge.save();

    throw new Error(
      "CAPTCHA challenge has expired"
    );
  }

  const captchaText =
    escapeXml(
      challenge.captchaText
    );

  const svg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="620"
  height="210"
  viewBox="0 0 620 210"
>
  <defs>

    <linearGradient
      id="backgroundGradient"
      x1="0%"
      y1="0%"
      x2="100%"
      y2="100%"
    >
      <stop
        offset="0%"
        stop-color="#17132f"
      />

      <stop
        offset="100%"
        stop-color="#0b1020"
      />
    </linearGradient>

    <filter
      id="softBlur"
      x="-20%"
      y="-20%"
      width="140%"
      height="140%"
    >
      <feGaussianBlur
        stdDeviation="0.8"
      />
    </filter>

    <filter
      id="textShadow"
      x="-30%"
      y="-30%"
      width="160%"
      height="160%"
    >
      <feDropShadow
        dx="0"
        dy="3"
        stdDeviation="3"
        flood-color="#000000"
        flood-opacity="0.55"
      />
    </filter>

    <pattern
      id="lines"
      width="28"
      height="28"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(20)"
    >
      <line
        x1="0"
        y1="0"
        x2="0"
        y2="28"
        stroke="#8b5cf6"
        stroke-opacity="0.12"
        stroke-width="2"
      />
    </pattern>

  </defs>

  <rect
    x="10"
    y="10"
    width="600"
    height="190"
    rx="24"
    fill="url(#backgroundGradient)"
    stroke="#6941c6"
    stroke-opacity="0.35"
    stroke-width="2"
  />

  <rect
    x="10"
    y="10"
    width="600"
    height="190"
    rx="24"
    fill="url(#lines)"
  />

  <circle
    cx="70"
    cy="50"
    r="18"
    fill="#8b5cf6"
    opacity="0.12"
  />

  <circle
    cx="550"
    cy="160"
    r="22"
    fill="#6366f1"
    opacity="0.1"
  />

  <text
    x="310"
    y="128"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="58"
    font-weight="800"
    letter-spacing="16"
    fill="#c4b5fd"
    filter="url(#textShadow)"
  >
    ${captchaText}
  </text>

  <path
    d="M55 90 C160 60, 240 120, 355 88 S500 70, 565 95"
    fill="none"
    stroke="#a78bfa"
    stroke-opacity="0.25"
    stroke-width="3"
    filter="url(#softBlur)"
  />

  <path
    d="M45 145 C140 115, 265 170, 380 130 S520 115, 580 145"
    fill="none"
    stroke="#818cf8"
    stroke-opacity="0.22"
    stroke-width="2"
  />

</svg>
`;

  return svg;
};

// -----------------------------------------
// Verify CAPTCHA
// -----------------------------------------

const verifyCaptchaChallenge = async (
  challengeId,
  userId,
  selectedOption
) => {
  if (
    !challengeId ||
    !userId ||
    !selectedOption
  ) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      message:
        "Challenge ID, user ID and selected option are required",
    };
  }

  const challenge =
    await CaptchaChallenge.findOne({
      challengeId,
      userId,
    }).select(
      "+captchaText +correctOption"
    );

  if (!challenge) {
    await createAuditLog({ action: "INVALID_ATTEMPT", userId, challengeId, status: "FAILED", message: "CAPTCHA challenge not found" });
    return {
      success: false,
      code: "CHALLENGE_NOT_FOUND",
      message:
        "CAPTCHA challenge not found",
    };
  }

  // -----------------------------------------
  // Replay protection
  // -----------------------------------------

  if (
    challenge.status !== "active"
  ) {
    await createAuditLog({
      action: "DUPLICATE_ATTEMPT",
      userId,
      challengeId,
      status: "BLOCKED",
      message: "CAPTCHA challenge replay/duplicate verification attempt",
      metadata: { challengeStatus: challenge.status, rewardStatus: challenge.rewardStatus },
    });
    return {
      success: false,
      code:
        "CHALLENGE_ALREADY_COMPLETED",
      message:
        "CAPTCHA challenge is no longer active",
    };
  }

  // -----------------------------------------
  // Expiry protection
  // -----------------------------------------

  if (
    challenge.expiresAt < new Date()
  ) {
    challenge.status =
      "expired";

    challenge.rewardStatus =
      "none";

    await challenge.save();
    await createAuditLog({ action: "EXPIRED_CHALLENGE", userId, challengeId: challenge.challengeId, status: "BLOCKED", message: "CAPTCHA challenge expired during verification" });

    return {
      success: false,
      code:
        "CHALLENGE_EXPIRED",
      message:
        "CAPTCHA challenge has expired",
    };
  }

  // -----------------------------------------
  // Validate selected option
  // -----------------------------------------
  // The client is allowed to submit only one of the
  // four options issued for this challenge. Arbitrary
  // values must never be treated as a wrong answer,
  // because that could incorrectly award the wrong-answer
  // reward for an invalid request.
  const normalizedSelectedOption = String(
    selectedOption
  ).trim().toUpperCase();

  const normalizedOptions = Array.isArray(
    challenge.options
  )
    ? challenge.options.map((option) =>
        String(option).trim().toUpperCase()
      )
    : [];

  if (
    !normalizedOptions.includes(
      normalizedSelectedOption
    )
  ) {
    console.warn(
      "Invalid CAPTCHA option submitted:",
      {
        challengeId,
        userId: String(userId),
      }
    );

    await createAuditLog({ action: "INVALID_ATTEMPT", userId, challengeId, status: "FAILED", message: "Selected option is not one of the issued CAPTCHA options", metadata: { selectedOption: normalizedSelectedOption } });
    await createAuditLog({ action: "SUSPICIOUS_REQUEST", userId, challengeId, status: "BLOCKED", message: "Invalid CAPTCHA option submitted", metadata: { selectedOption: normalizedSelectedOption } });

    return {
      success: false,
      code: "INVALID_OPTION",
      message:
        "Selected option is not valid for this CAPTCHA challenge",
    };
  }

  // Use the normalized value for the actual comparison
  // while preserving the original challenge data.
  selectedOption = normalizedSelectedOption;

  // -----------------------------------------
  // Get backend reward configuration
  // -----------------------------------------

  const rewardConfig =
    await getActiveRewardConfig();

  // -----------------------------------------
  // Compare server-side correct answer
  // -----------------------------------------

  const isCorrect =
    String(
      selectedOption
    ).toUpperCase() ===
    String(
      challenge.correctOption
    ).toUpperCase();

  // -----------------------------------------
  // Reward is controlled by backend config
  // -----------------------------------------

  const rewardAmount =
    isCorrect
      ? Number(
          rewardConfig.correctReward
        )
      : Number(
          rewardConfig.wrongReward
        );

  challenge.selectedOption =
    selectedOption;

  challenge.completedAt =
    new Date();

  challenge.status =
    "completed";

  challenge.result =
    isCorrect
      ? "correct"
      : "wrong";

  // Store the reward determined by the
  // backend at verification time.
  challenge.rewardAmount =
    rewardAmount;

  // Reward remains pending until Claim.
  challenge.rewardStatus =
    "pending";

  await challenge.save();

  await createAuditLog({
    action: "CHALLENGE_VERIFIED",
    userId,
    challengeId: challenge.challengeId,
    result: isCorrect ? "CORRECT" : "WRONG",
    rewardAmount,
    status: "SUCCESS",
    message: isCorrect ? "CAPTCHA verified successfully" : "CAPTCHA verified with an incorrect answer",
    metadata: { rewardStatus: challenge.rewardStatus },
  });

  await createAuditLog({
    action: "REWARD_CREATED",
    userId,
    challengeId: challenge.challengeId,
    referenceId: challenge.challengeId,
    result: isCorrect ? "CORRECT" : "WRONG",
    rewardAmount,
    status: "SUCCESS",
    message: "CAPTCHA reward created and marked pending",
    metadata: { currency: rewardConfig.currency },
  });

  return {
    success: true,

    code:
      "CAPTCHA_VERIFIED",

    correct:
      isCorrect,

    result:
      isCorrect
        ? "CORRECT"
        : "WRONG",

    message:
      isCorrect
        ? "CAPTCHA verified successfully"
        : "That answer wasn't correct",

    reward: {
      currency:
        rewardConfig.currency ===
        "GEM"
          ? "GEMS"
          : rewardConfig.currency,

      amount:
        rewardAmount,
    },

    challengeId:
      challenge.challengeId,

    claimAvailable:
      true,
  };
};

// -----------------------------------------
// Claim CAPTCHA Reward
// -----------------------------------------

const claimCaptchaReward = async (
  challengeId,
  userId
) => {
  if (
    !challengeId ||
    !userId
  ) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      message:
        "Challenge ID and user ID are required",
    };
  }

  const session =
    await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(
      async () => {
        // -----------------------------------
        // Atomically reserve pending reward
        // -----------------------------------

        const challenge =
          await CaptchaChallenge.findOneAndUpdate(
            {
              challengeId,
              userId,
              status:
                "completed",
              rewardStatus:
                "pending",
            },
            {
              $set: {
                rewardStatus:
                  "claimed",

                claimedAt:
                  new Date(),
              },
            },
            {
              returnDocument:
                "after",

              session,
            }
          );

        // -----------------------------------
        // Challenge could not be claimed
        // -----------------------------------

        if (!challenge) {
          const existing =
            await CaptchaChallenge.findOne(
              {
                challengeId,
                userId,
              }
            ).session(
              session
            );

          if (!existing) {
            await createAuditLog({ action: "INVALID_ATTEMPT", userId, challengeId, status: "FAILED", message: "CAPTCHA challenge not found during claim", session });
            result = {
              success: false,
              code:
                "CHALLENGE_NOT_FOUND",
              message:
                "CAPTCHA challenge not found",
            };
            return;
          }

          if (
            existing.rewardStatus ===
            "claimed"
          ) {
            await createAuditLog({ action: "DUPLICATE_ATTEMPT", userId, challengeId, referenceId: challengeId, status: "BLOCKED", message: "Reward has already been claimed", session });
            result = {
              success: false,
              code:
                "REWARD_ALREADY_CLAIMED",
              message:
                "Reward has already been claimed",
            };
            return;
          }

          if (
            existing.status !==
            "completed"
          ) {
            await createAuditLog({
              action: "INVALID_ATTEMPT",
              userId,
              challengeId,
              referenceId: challengeId,
              status: "BLOCKED",
              message: "Reward is not available for claiming",
              metadata: { challengeStatus: existing.status, rewardStatus: existing.rewardStatus },
              session,
            });
            result = {
              success: false,
              code:
                "CLAIM_NOT_AVAILABLE",
              message:
                "Reward is not available for claiming",
            };
            return;
          }

          result = {
            success: false,
            code:
              "CLAIM_NOT_AVAILABLE",
            message:
              "Reward is not available for claiming",
          };

          return;
        }

        // -----------------------------------
        // Get wallet
        // -----------------------------------

        let wallet =
          await Wallet.findOne({
            userId,
          }).session(
            session
          );

        // -----------------------------------
        // Create wallet if necessary
        // -----------------------------------

        if (!wallet) {
          const createdWallet =
            await Wallet.create(
              [
                {
                  userId,
                  gems: 0,
                },
              ],
              {
                session,
              }
            );

          wallet =
            createdWallet[0];
        }

        // -----------------------------------
        // Calculate balance
        // -----------------------------------

        const balanceBefore =
          Number(
            wallet.gems
          ) || 0;

        const rewardAmount =
          Number(
            challenge.rewardAmount
          ) || 0;

        const balanceAfter =
          balanceBefore +
          rewardAmount;

        // -----------------------------------
        // Update wallet
        // -----------------------------------

        wallet.gems =
          balanceAfter;

        await wallet.save({
          session,
        });

        // -----------------------------------
        // Create ledger transaction
        // -----------------------------------

        const transactionId =
          crypto.randomUUID();

        await GemTransaction.create(
          [
            {
              transactionId,

              userId,

              currency:
                "GEM",

              amount:
                rewardAmount,

              type:
                "CAPTCHA_REWARD",

              source:
                "CAPTCHA_EARN",

              referenceId:
                challenge.challengeId,

              balanceBefore,

              balanceAfter,

              status:
                "COMPLETED",
            },
          ],
          {
            session,
          }
        );

        await createAuditLog({
          action: "REWARD_CLAIMED",
          userId,
          challengeId: challenge.challengeId,
          referenceId: transactionId,
          rewardAmount,
          status: "SUCCESS",
          message: "CAPTCHA reward claimed successfully",
          metadata: { balanceBefore, balanceAfter, transactionId },
          session,
        });

        // -----------------------------------
        // Final result
        // -----------------------------------

        result = {
          success: true,

          code:
            "REWARD_CLAIMED",

          message:
            "Reward claimed successfully",

          reward: {
            currency:
              "GEMS",

            amount:
              rewardAmount,
          },

          wallet: {
            gems:
              balanceAfter,
          },

          challengeId:
            challenge.challengeId,
        };
      }
    );

    return result;
  } catch (error) {
    // ---------------------------------------
    // Duplicate ledger protection
    // ---------------------------------------

    if (
      error.code === 11000
    ) {
      return {
        success: false,
        code:
          "REWARD_ALREADY_CLAIMED",
        message:
          "Reward has already been claimed",
      };
    }

    console.error(
      "Claim CAPTCHA reward error:",
      error
    );

    throw error;
  } finally {
    await session.endSession();
  }
};

// -----------------------------------------
// Skip / No Thanks
// -----------------------------------------

const skipCaptchaChallenge = async (
  challengeId,
  userId
) => {
  if (
    !challengeId ||
    !userId
  ) {
    return {
      success: false,
      code:
        "VALIDATION_ERROR",
      message:
        "Challenge ID and user ID are required",
    };
  }

  const challenge =
    await CaptchaChallenge.findOneAndUpdate(
      {
        challengeId,
        userId,

        $or: [
          {
            status:
              "active",
          },

          {
            status:
              "completed",

            rewardStatus:
              "pending",
          },
        ],
      },
      {
        $set: {
          status:
            "skipped",

          rewardStatus:
            "none",

          claimedAt:
            null,
        },
      },
      {
        returnDocument:
          "after",
      }
    );

  if (!challenge) {
    await createAuditLog({ action: "INVALID_ATTEMPT", userId, challengeId, status: "BLOCKED", message: "CAPTCHA challenge cannot be skipped" });
    return {
      success: false,
      code:
        "CHALLENGE_NOT_FOUND",
      message:
        "CAPTCHA challenge cannot be skipped",
    };
  }

  await createAuditLog({
    action: "INVALID_ATTEMPT",
    userId,
    challengeId: challenge.challengeId,
    status: "INFO",
    message: "CAPTCHA challenge skipped by user",
    metadata: { skipped: true },
  });

  return {
    success: true,
    code:
      "CAPTCHA_SKIPPED",
    message:
      "CAPTCHA skipped successfully",
    challengeId:
      challenge.challengeId,
    status:
      challenge.status,
  };
};

// -----------------------------------------
// Get CAPTCHA History
// -----------------------------------------

const getCaptchaHistory = async (
  userId,
  requestedLimit = 20
) => {
  if (!userId) {
    return {
      success: false,
      code:
        "VALIDATION_ERROR",
      message:
        "User ID is required",
    };
  }

  const parsedLimit =
    Number.parseInt(
      requestedLimit,
      10
    );

  const limit =
    Number.isFinite(parsedLimit) &&
    parsedLimit > 0
      ? Math.min(
          parsedLimit,
          100
        )
      : 20;

  try {
    const history =
      await CaptchaChallenge.find({
        userId,
      })
        .select(
          "challengeId result rewardAmount rewardStatus status createdAt completedAt"
        )
        .sort({
          createdAt: -1,
        })
        .limit(limit)
        .lean();

    return {
      success: true,

      data: {
        history,

        count:
          history.length,
      },
    };
  } catch (error) {
    console.error(
      "Get CAPTCHA history error:",
      error
    );

    throw error;
  }
};

// -----------------------------------------
// Exports
// -----------------------------------------

module.exports = {
  createCaptchaChallenge,
  generateCaptchaImage,
  verifyCaptchaChallenge,
  claimCaptchaReward,
  skipCaptchaChallenge,
  getCaptchaHistory,
};