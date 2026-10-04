# VELoop CAPTCHA Earn — Database Documentation

## 1. Overview

The application uses MongoDB with Mongoose. MongoDB is the source of truth for authentication-linked CAPTCHA challenges, wallet balances, reward transactions, reward configuration, and security audit events.

The main persistence entities are:

- `User`
- `CaptchaChallenge`
- `Wallet`
- `GemTransaction`
- `CaptchaRewardConfig`
- `AuditLog`

The design keeps the authoritative CAPTCHA answer and reward decision on the backend rather than in the React client.

---

## 2. Collection Summary

| Collection | Purpose |
|---|---|
| `users` | Stores registered user accounts and account status |
| `captchachallenges` | Stores generated CAPTCHA challenges, options, server-side answer, expiry, verification result and reward state |
| `wallets` | Stores the current Gem balance for each user |
| `gemtransactions` | Immutable-style reward ledger entries created when a reward is claimed |
| `captcharewardconfigs` | Stores backend-controlled correct/wrong reward configuration |
| `auditlogs` | Stores security and business audit events for challenge, verification, reward and suspicious/duplicate activity |

Mongoose normally derives the collection name from the model name.

---

## 3. User

### Purpose

Stores the authenticated application user.

### Main fields

| Field | Type | Notes |
|---|---|---|
| `name` | String | User display/full name |
| `email` | String | Login identifier |
| `password` | String | Stored as a protected/hashed credential by the authentication layer |
| `role` | String | `candidate`, `employer`, or `admin` |
| `profileImage` | String | Optional profile image reference |
| `phone` | String | Optional phone number |
| `location` | String | Optional location |
| `isActive` | Boolean | Used by authentication middleware to allow/block the account |

### Relationship

One user can have:

- one wallet,
- many CAPTCHA challenges,
- many Gem transactions,
- many audit log records.

---

## 4. CaptchaChallenge

### Purpose

Stores the complete server-side state of a CAPTCHA challenge.

### Fields

| Field | Type | Important behavior |
|---|---|---|
| `challengeId` | String | Required, unique challenge identifier |
| `userId` | ObjectId → `User` | Required; identifies the owner |
| `captchaText` | String | Required; hidden from normal queries with `select: false` |
| `options` | `[String]` | Required; validation enforces exactly 4 options |
| `correctOption` | String | Required; hidden from normal queries with `select: false` |
| `status` | String | `active`, `completed`, `skipped`, or `expired` |
| `selectedOption` | String/null | The option submitted by the user |
| `result` | String/null | `correct` or `wrong` |
| `rewardAmount` | Number | Backend-calculated reward assigned to the challenge |
| `rewardStatus` | String | `pending`, `credited`, `claimed`, or `none` |
| `expiresAt` | Date | Challenge expiry timestamp |
| `completedAt` | Date/null | Verification completion timestamp |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

### Security design

`captchaText` and `correctOption` are not returned through normal Mongoose queries because both fields use `select: false`. The service explicitly selects them only when the backend needs them for image generation or verification.

The public challenge response contains the `challengeId`, four options, and `expiresAt`; the server-side answer is not exposed to the frontend.

### Challenge lifecycle

```text
ACTIVE
  │
  ├── correct/wrong verification ──> COMPLETED
  │                                    │
  │                                    ├── claim ──> rewardStatus=CLAIMED
  │                                    │
  │                                    └── skip/no thanks ──> SKIPPED
  │
  ├── no thanks / replacement ──> SKIPPED
  │
  └── expiry ──> EXPIRED
```

A completed or expired challenge cannot be verified again.

---

## 5. Wallet

### Purpose

Stores the current Gem balance for a user.

### Fields

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId → `User` | Required and unique; one wallet per user |
| `gems` | Number | Required, defaults to `0`, minimum `0` |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

### Relationship

```text
User 1 ───────── 1 Wallet
```

The frontend does not own the authoritative wallet value. The wallet balance is read from `GET /api/wallet/gems` after authentication and after a reward claim.

---

## 6. GemTransaction

### Purpose

Provides the reward ledger for every claimed CAPTCHA reward.

### Fields

| Field | Type | Notes |
|---|---|---|
| `transactionId` | String | Required and unique |
| `userId` | ObjectId → `User` | Required |
| `currency` | String | `GEM` |
| `amount` | Number | Claimed reward amount |
| `type` | String | `CAPTCHA_REWARD` |
| `source` | String | `CAPTCHA_EARN` |
| `referenceId` | String | References the CAPTCHA `challengeId` |
| `balanceBefore` | Number | Wallet balance before credit |
| `balanceAfter` | Number | Wallet balance after credit |
| `status` | String | `COMPLETED` |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

### Ledger relationship

```text
User 1 ───────── N GemTransaction
                 │
                 └── referenceId → CaptchaChallenge.challengeId
```

A unique compound index on `{ userId, referenceId, type }` prevents a second reward ledger entry for the same challenge and reward type.

---

## 7. CaptchaRewardConfig

### Purpose

Stores backend-controlled reward rules instead of trusting the frontend.

### Fields

| Field | Type | Notes |
|---|---|---|
| `correctReward` | Number | Reward for a correct answer; current configuration is `1` |
| `wrongReward` | Number | Reward for an incorrect answer; current configuration is `0.5` |
| `currency` | String | `GEM` |
| `active` | Boolean | Identifies the active configuration |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

### Current development configuration

```text
correctReward = 1 GEM
wrongReward   = 0.5 GEM
currency      = GEM
active        = true
```

Reward values are read by the backend service during CAPTCHA verification.

---

## 8. AuditLog

### Purpose

Provides an audit trail for business and security-sensitive CAPTCHA activity.

### Main fields

| Field | Type | Notes |
|---|---|---|
| `action` | String | Business/security event |
| `userId` | ObjectId/null | Related authenticated user |
| `challengeId` | String/null | Related CAPTCHA challenge |
| `referenceId` | String/null | Related transaction/reference |
| `result` | String/null | `CORRECT` or `WRONG` |
| `rewardAmount` | Number | Related reward amount |
| `status` | String | `SUCCESS`, `FAILED`, `BLOCKED`, or `INFO` |
| `message` | String/null | Human-readable event description |
| `metadata` | Mixed | Additional diagnostic/security details |
| `ipAddress` | String/null | Request IP when available |
| `userAgent` | String/null | Client user agent when available |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

### Supported audit actions

```text
CHALLENGE_CREATED
CHALLENGE_VERIFIED
REWARD_CREATED
REWARD_CLAIMED
DUPLICATE_ATTEMPT
INVALID_ATTEMPT
EXPIRED_CHALLENGE
SUSPICIOUS_REQUEST
```

These events cover the assignment's required audit cases, including normal reward flow and blocked/replayed/invalid activity.

---

## 9. Indexes

The application defines indexes for common lookup and protection paths.

### CaptchaChallenge

- Unique index: `challengeId`
- Index: `userId`
- Index: `status`
- Index: `expiresAt`
- Compound index: `{ userId: 1, createdAt: -1 }`

The user/createdAt index supports recent history retrieval.

### Wallet

- Unique index: `userId`

This guarantees one wallet document per user.

### GemTransaction

- Unique index: `transactionId`
- Index: `userId`
- Index: `referenceId`
- Compound unique index: `{ userId: 1, referenceId: 1, type: 1 }`

The compound uniqueness prevents duplicate reward ledger entries for the same challenge.

### CaptchaRewardConfig

- Index: `active`

### AuditLog

- Index: `action`
- Index: `userId`
- Index: `challengeId`
- Compound index: `{ userId: 1, createdAt: -1 }`
- Compound index: `{ challengeId: 1, createdAt: -1 }`
- Compound index: `{ action: 1, createdAt: -1 }`

These indexes support audit/history queries and recent security-event inspection.

---

## 10. Reward Processing and Consistency

The reward is not credited merely because the frontend displays a success state.

The backend flow is:

```text
User submits option
        │
        ▼
Find challenge for authenticated user
        │
        ├── invalid / expired / completed → reject
        │
        ▼
Validate submitted option is one of the issued four options
        │
        ▼
Compare with server-side correctOption
        │
        ▼
Read active CaptchaRewardConfig
        │
        ▼
Store result + rewardAmount + pending reward state
        │
        ▼
User chooses Claim
        │
        ▼
Atomic claim operation / MongoDB transaction
        │
        ├── mark pending reward as claimed
        ├── update wallet balance
        ├── create GemTransaction ledger record
        └── create REWARD_CLAIMED audit record
```

This separates verification from wallet crediting and protects the claim operation against duplicate/concurrent requests.

---

## 11. User Isolation

Every protected CAPTCHA operation uses the authenticated user's identity from the JWT middleware.

The service queries challenges with both:

```text
challengeId
userId = authenticated user
```

The client therefore cannot switch users by supplying another `userId` value in the request body.

History is also queried by the authenticated user's ID, so one user cannot request another user's CAPTCHA history through a user ID parameter.

---

## 12. Data Visibility Rules

The following fields are intentionally server-side:

```text
CaptchaChallenge.captchaText
CaptchaChallenge.correctOption
```

The public CAPTCHA generation response contains only information required by the UI:

```json
{
  "challengeId": "challenge-id",
  "options": [
    "OPTION-1",
    "OPTION-2",
    "OPTION-3",
    "OPTION-4"
  ],
  "expiresAt": "2026-10-02T00:00:00.000Z"
}
```

The history response does not include `correctOption`.

---

## 13. Source of Truth

The authoritative state for each requirement is stored as follows:

| Requirement | Source of truth |
|---|---|
| User identity | JWT + `User` |
| CAPTCHA answer | `CaptchaChallenge.correctOption` |
| CAPTCHA options | `CaptchaChallenge.options` |
| Challenge validity | `CaptchaChallenge.status` + `expiresAt` |
| Verification result | `CaptchaChallenge.result` |
| Reward amount | `CaptchaRewardConfig` + stored `CaptchaChallenge.rewardAmount` |
| Reward claim state | `CaptchaChallenge.rewardStatus` |
| Current Gem balance | `Wallet.gems` |
| Reward ledger | `GemTransaction` |
| Security/business audit trail | `AuditLog` |

---

## 14. Example Reward Data Flow

For a user with a wallet balance of `1.0`:

```text
CAPTCHA verified correctly
        │
        └── rewardAmount = 1.0
              │
              ▼
Claim
  │
  ├── balanceBefore = 1.0
  ├── amount = 1.0
  ├── balanceAfter = 2.0
  └── GemTransaction created
```

For an incorrect answer:

```text
CAPTCHA verified incorrectly
        │
        └── rewardAmount = 0.5
              │
              ▼
Claim
  │
  ├── balanceBefore = 2.0
  ├── amount = 0.5
  ├── balanceAfter = 2.5
  └── GemTransaction created
```

The exact reward comes from the backend configuration rather than a value supplied by the browser.
