# VELoop CAPTCHA Earn — Security Documentation

## 1. Security Objective

The application treats the backend as the authoritative source for:

- User identity
- CAPTCHA correctness
- CAPTCHA challenge validity
- Challenge ownership
- Verification result
- Reward amount
- Reward claim eligibility
- Gem balance
- Reward transaction creation
- Security/business audit events

The frontend is treated as untrusted client input. A user may inspect or modify browser-side JavaScript, request payloads, or browser storage without gaining authority over server-side reward data.

---

## 2. Authentication and Authorization

### JWT authentication

Protected APIs require a JWT in the HTTP Authorization header:

```http
Authorization: Bearer <JWT>
```

The authentication middleware:

1. Reads the Bearer token.
2. Verifies the token using the server-side JWT secret.
3. Resolves the authenticated user.
4. Checks that the user account is active.
5. Exposes the authenticated user to protected controllers/services.

Requests without a valid authenticated identity are rejected.

### User identity is server-derived

The application does not trust a `userId` sent by the frontend to identify the reward recipient.

For CAPTCHA operations, the service derives the user identity from the authenticated request:

```text
JWT
 ↓
Authentication middleware
 ↓
req.user
 ↓
CAPTCHA service
```

This prevents a client from changing a request body field and redirecting a reward or history query to another account.

---

## 3. CAPTCHA Anti-Cheat Controls

### Server-side answer verification

The server stores:

```text
captchaText
correctOption
options
challengeId
userId
status
expiresAt
```

The normal public challenge response does not expose `correctOption`.

During verification, the backend loads the challenge for the authenticated user and independently compares the submitted option with the stored server-side `correctOption`.

The client cannot declare:

```json
{
  "isCorrect": true
}
```

or choose its own reward amount and have the server accept those fields as authoritative.

### Four-option validation

The submitted answer is validated against the four options issued for that challenge before the correctness comparison.

An arbitrary value that was not issued as one of the challenge options is rejected with:

```text
INVALID_OPTION
```

This prevents an invalid request from being treated as an ordinary wrong answer.

### Hidden sensitive fields

`captchaText` and `correctOption` use Mongoose `select: false`.

The service explicitly selects these fields only for backend operations that require them, such as rendering the CAPTCHA image or checking the answer.

---

## 4. Challenge Ownership and User Isolation

A CAPTCHA challenge is associated with a specific authenticated user.

Sensitive challenge queries use both:

```text
challengeId
userId = authenticated user
```

Therefore:

```text
User A + User B challengeId
        ↓
not found / rejected
        ↓
no reward
```

The same isolation rule applies to CAPTCHA history, wallet balance, and transaction history.

The server does not expose a general-purpose client-controlled `userId` parameter for switching the owner of a protected operation.

---

## 5. Replay Protection

A CAPTCHA challenge has a lifecycle state:

```text
active
completed
skipped
expired
```

Once a challenge is no longer active, it cannot be verified again.

A completed challenge returns:

```text
CHALLENGE_ALREADY_COMPLETED
```

and does not create another reward.

When a new challenge is generated for the same user, the previously active challenge is invalidated/skipped before the replacement challenge is created.

---

## 6. Expiry Protection

CAPTCHA challenges have an `expiresAt` timestamp.

The current backend configuration uses a five-minute CAPTCHA expiry window.

Before image generation and verification, the backend checks the expiry time.

For an expired challenge:

```text
status → expired
rewardStatus → none
```

and verification is rejected with:

```text
CHALLENGE_EXPIRED
```

No reward is created for an expired challenge.

---

## 7. Reward Manipulation Protection

Reward values are controlled by backend configuration.

Current configuration:

```text
correctReward = 1 GEM
wrongReward   = 0.5 GEM
currency      = GEM
```

The backend determines the reward after independently determining whether the stored server-side answer matches the submitted option.

A client request containing a forged reward such as:

```json
{
  "challengeId": "challenge-id",
  "selectedOption": "option",
  "reward": 9999
}
```

does not override the server's configured reward.

Likewise, the backend ignores a client-supplied:

```json
{
  "isCorrect": true
}
```

and performs its own correctness check.

A fake `userId` in the request cannot change the authenticated reward recipient.

---

## 8. Reward Claim Protection

Verification stores the calculated reward on the challenge as a pending reward.

Wallet credit happens during the claim operation rather than by trusting the frontend result state.

The claim query requires the expected state:

```text
challengeId
authenticated userId
status = completed
rewardStatus = pending
```

The backend then changes the pending reward to claimed and processes the wallet/ledger update.

### Duplicate claim protection

A reward cannot be claimed twice.

A second claim returns:

```text
REWARD_ALREADY_CLAIMED
```

The service also records the duplicate attempt in the audit log.

### Concurrent claim protection

The claim operation uses a MongoDB transaction and an atomic state transition for the pending reward.

This prevents two simultaneous claim requests from both successfully crediting the same challenge.

---

## 9. Wallet Integrity

The wallet is stored in MongoDB and is keyed by the authenticated `userId`.

The authoritative balance is:

```text
Wallet.gems
```

The React application does not use browser local storage as the wallet database.

After a successful claim, the frontend requests the server wallet balance again:

```http
GET /api/wallet/gems
```

This ensures the displayed balance is refreshed from the backend.

A user cannot legitimately increase the authoritative wallet merely by changing a browser-side number.

---

## 10. Reward Ledger Integrity

Every successfully claimed CAPTCHA reward creates a `GemTransaction`.

A transaction contains:

```text
transactionId
userId
currency
amount
type
source
referenceId
balanceBefore
balanceAfter
status
```

The transaction references the source CAPTCHA challenge through `referenceId`.

A unique compound index on:

```text
userId + referenceId + type
```

prevents duplicate reward ledger entries for the same user/challenge/reward type.

This provides a persistent history of wallet credits instead of relying only on the current wallet balance.

---

## 11. Atomic Reward Processing

The claim flow uses a MongoDB transaction covering the related reward state, wallet update, ledger creation, and claim audit event.

Conceptually:

```text
Pending reward
      │
      ▼
Atomic claim transaction
      │
      ├── mark reward claimed
      ├── update wallet
      ├── create GemTransaction
      └── create REWARD_CLAIMED audit event
```

If the transaction fails, MongoDB can roll back the transaction so the related reward state and wallet/ledger changes do not remain partially applied.

---

## 12. Input Validation

The backend validates required request fields before processing.

Examples:

### Missing challenge ID

```text
VALIDATION_ERROR
```

### Missing selected option

```text
VALIDATION_ERROR
```

### Invalid option

```text
INVALID_OPTION
```

### Unknown challenge

```text
CHALLENGE_NOT_FOUND
```

### Already completed challenge

```text
CHALLENGE_ALREADY_COMPLETED
```

### Expired challenge

```text
CHALLENGE_EXPIRED
```

The API also enforces authentication before protected CAPTCHA and wallet operations.

---

## 13. Rate Limiting and Abuse Protection

The Express application uses a global API rate limiter for `/api` requests.

Current development configuration:

```text
Window: 15 minutes
Maximum: 200 requests per window
```

This reduces automated API spam and rapid repeated requests.

Additional application-level controls include:

- Challenge ownership checks
- Challenge expiry checks
- One-time verification
- One-time reward claim
- Invalid option rejection
- Duplicate/replay detection
- Transaction uniqueness
- Security audit logging

The system is not described as 100% fraud-proof. These controls are intended to reduce common replay, manipulation, duplication, and API-abuse paths.

---

## 14. Security Audit Logging

The backend records security-sensitive and reward-sensitive activity in `AuditLog`.

Supported actions include:

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

Examples:

### Normal flow

```text
CHALLENGE_CREATED
CHALLENGE_VERIFIED
REWARD_CREATED
REWARD_CLAIMED
```

### Blocked/abnormal flow

```text
INVALID_ATTEMPT
EXPIRED_CHALLENGE
DUPLICATE_ATTEMPT
SUSPICIOUS_REQUEST
```

Audit records can include the user, challenge, result, reward amount, status, message, and additional metadata.

---

## 15. Security Response Behavior

Typical protected API behavior:

| Situation | Expected result |
|---|---|
| Missing JWT | `401` |
| Invalid JWT | `401` |
| Missing required request field | `400` |
| Invalid option | `400` |
| Unknown challenge | `404` |
| Challenge already completed | `409` |
| Expired challenge | `410` |
| Duplicate claim | `409` |
| Rate limit exceeded | `429` |

Exact response payloads are documented in `API_DOCUMENTATION.md`.

---

## 16. Negative Security Test Coverage

The implementation was checked against the assignment's required negative cases:

| Test | Expected security behavior |
|---|---|
| Invalid challenge | Reject; no reward |
| Expired challenge | Reject; mark expired; no reward |
| Completed challenge | Reject replay |
| Wrong user | Reject cross-user access |
| Duplicate claim | Reject second claim |
| Duplicate verification | Reject second verification |
| Invalid option | Reject with `INVALID_OPTION` |
| Missing option | Reject with validation error |
| Fake reward | Ignore client reward and use server configuration |
| Fake `isCorrect` | Ignore client flag and calculate server-side |
| Fake `userId` | Use authenticated user identity |
| Unauthorized API | Reject with `401` |
| Rate limit | Reject excessive traffic with `429` |
| Concurrent claim | One successful claim; duplicate requests rejected |

The observed development tests included duplicate verification, invalid option, expired challenge, cross-user access, duplicate claim, forged reward/`isCorrect`/`userId`, unauthorized access, invalid JWT, rate limiting, concurrent claim, and suspicious-request audit logging.

---

## 17. Secrets and Environment Variables

Sensitive deployment values must not be committed to Git.

The project uses environment variables for:

```text
PORT
MONGO_URI
JWT_SECRET
CLIENT_URL
```

`.env` files are ignored by Git, while `.env.example` documents the required variable names without real secrets.

Never commit:

- MongoDB credentials
- JWT secrets
- production tokens
- API keys
- private deployment credentials

---

## 18. Frontend Security Boundary

The frontend can control presentation state, such as:

```text
selected option
loading state
claim UI state
modal visibility
messages
```

It cannot be trusted for:

```text
correct answer
reward amount
wallet balance
challenge ownership
challenge completion
claim eligibility
reward transaction
```

The server is the authority for all of these values.

---

## 19. Security Design Principles

The implementation follows these practical principles:

1. **Never trust client-calculated reward values.**
2. **Never trust client-declared correctness.**
3. **Derive user identity from authentication.**
4. **Bind challenges to authenticated users.**
5. **Expire and invalidate challenges.**
6. **Allow only one verification per challenge.**
7. **Allow only one successful reward claim per challenge.**
8. **Use a persistent wallet and reward ledger.**
9. **Protect reward updates with atomic/transactional processing.**
10. **Log suspicious, invalid, duplicate, and reward-sensitive events.**
11. **Apply API rate limiting.**
12. **Keep secrets outside source control.**

---

## 20. Security Scope and Limitations

This document describes the implemented development security controls and their tested behavior.

It does not claim complete protection against every possible fraud technique. A production deployment would additionally benefit from operational monitoring, stronger fraud/risk signals, distributed rate limiting where multiple API instances are used, centralized logging, alerting, and infrastructure-level protections.
