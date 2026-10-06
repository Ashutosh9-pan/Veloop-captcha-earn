# VELoop CAPTCHA Earn — Testing Documentation

## 1. Testing Overview

The project was tested through the running frontend, backend API, MongoDB persistence, browser Network/Console inspection, and direct negative/security test flows.

Testing focused on:

- Authentication
- CAPTCHA generation
- CAPTCHA verification
- Reward calculation
- Reward claim
- Wallet persistence
- CAPTCHA history
- Challenge expiry
- Replay protection
- User isolation
- Input validation
- Forged client values
- Rate limiting
- Concurrent claims
- Audit logging

---

## 2. Test Environment

### Frontend

```text
React + Vite
Local development server: http://localhost:5174
```

### Backend

```text
Node.js + Express
Local API server: http://localhost:5001
```

### Database

```text
MongoDB Atlas
```

### Authentication

```text
JWT Bearer authentication
```

---

## 3. Functional Test Matrix

| ID | Test | Expected Result | Status |
|---|---|---|---|
| TC-001 | Create account | New user account created successfully | PASS |
| TC-002 | Login | User authenticated and dashboard loaded | PASS |
| TC-003 | New CAPTCHA | Challenge with exactly four options generated | PASS |
| TC-004 | CAPTCHA image | CAPTCHA image returned for valid challenge | PASS |
| TC-005 | Correct answer | Verification succeeds and +1 GEM reward is created | PASS |
| TC-006 | Wrong answer | Verification succeeds as wrong and +0.5 GEM reward is created | PASS |
| TC-007 | Claim reward | Pending reward is credited to wallet | PASS |
| TC-008 | Wallet refresh | Balance remains correct after browser refresh | PASS |
| TC-009 | No Thanks / Skip | Challenge is skipped without an invalid reward | PASS |
| TC-010 | CAPTCHA history | User can view their own CAPTCHA history | PASS |
| TC-011 | Gem transactions | Reward ledger reflects claimed rewards | PASS |

---

## 4. Authentication Tests

### TC-001 — Create Account

**Steps**

1. Open the application.
2. Select `Create Account`.
3. Enter a new name, email and password.
4. Confirm the password.
5. Submit the registration form.

**Expected**

- Registration request succeeds.
- User can proceed to login.
- New account starts with a zero Gem balance.

**Observed**

- A new test account was successfully created.
- Login worked with the new account.
- Initial wallet balance displayed as `0.0 GEM`.

**Status:** PASS

---

### TC-002 — Login

**Steps**

1. Open Login.
2. Enter the newly created account credentials.
3. Submit.

**Expected**

- JWT authentication succeeds.
- Protected dashboard becomes available.
- User identity is displayed.

**Observed**

- Login succeeded.
- The dashboard displayed the authenticated user's name.
- Logout became available.

**Status:** PASS

---

## 5. CAPTCHA Tests

### TC-003 — Generate CAPTCHA

**Expected**

- Backend generates a new challenge.
- Challenge contains exactly four options.
- Challenge is associated with the authenticated user.
- Expiry is stored server-side.

**Status:** PASS

---

### TC-004 — CAPTCHA Image

**Expected**

- Valid authenticated challenge returns an SVG CAPTCHA image.
- Invalid/missing challenge is rejected.
- Expired/inactive challenge is rejected.

**Status:** PASS

---

### TC-005 — Correct CAPTCHA

**Steps**

1. Generate a new challenge.
2. Select the correct option.
3. Submit/verify.

**Expected**

```text
result = correct
reward = 1 GEM
```

**Observed**

- CAPTCHA verified successfully.
- Wallet increased by `1.0 GEM` after the reward flow.

**Status:** PASS

---

### TC-006 — Wrong CAPTCHA

**Steps**

1. Generate a new challenge.
2. Select an incorrect option.
3. Submit/verify.

**Expected**

```text
result = wrong
reward = 0.5 GEM
```

**Observed**

- Wrong-answer flow was tested.
- The configured wrong-answer reward was applied.

**Status:** PASS

---

## 6. Wallet Persistence Test

### TC-008 — Balance Persists After Refresh

**Steps**

1. Log in to a newly created account.
2. Complete a correct CAPTCHA.
3. Confirm the balance increased to `1.0 GEM`.
4. Refresh the browser with `Ctrl + R`.

**Expected**

```text
Before refresh: 1.0 GEM
After refresh:  1.0 GEM
```

**Observed**

- The balance remained `1.0 GEM` after refresh.

**Status:** PASS

This confirms the displayed balance is backed by persisted server/database state rather than only transient React state.

---

## 7. Challenge Lifecycle Tests

### TC-012 — Duplicate Verification / Replay

**Expected**

Once a challenge has been completed, another verification request for the same challenge is rejected.

Expected code:

```text
CHALLENGE_ALREADY_COMPLETED
```

**Status:** PASS

---

### TC-013 — Expired Challenge

**Expected**

An expired challenge cannot be verified or rewarded.

Expected behavior:

```text
CHALLENGE_EXPIRED
HTTP 410
```

The challenge is moved to an expired state and no reward is credited.

**Status:** PASS

---

### TC-014 — Invalid Challenge

**Test**

A non-existent challenge ID was submitted to the protected CAPTCHA operation.

**Observed**

```text
HTTP 404
code: CHALLENGE_NOT_FOUND
```

**Status:** PASS

---

### TC-015 — Invalid Option

**Test**

A selected option that was not one of the four options issued for the challenge was submitted.

**Expected**

```text
HTTP 400
code: INVALID_OPTION
```

**Status:** PASS

---

## 8. User Isolation Tests

### TC-016 — Wrong User / Cross-User Challenge

**Test**

A challenge belonging to one authenticated user was accessed using another user's authentication context.

**Expected**

- Challenge is not accessible.
- No verification is performed.
- No reward is created.

**Status:** PASS

---

### TC-017 — Fake User ID

**Test**

A client request attempts to supply a different `userId`.

**Expected**

The backend ignores the client-controlled identity and uses the authenticated JWT user.

**Status:** PASS

---

## 9. Reward Manipulation Tests

### TC-018 — Fake Reward

**Test**

A request attempts to provide a manipulated reward amount.

Example:

```json
{
  "reward": 9999
}
```

**Expected**

The server ignores the client-provided reward and uses the configured backend reward.

**Status:** PASS

---

### TC-019 — Fake `isCorrect`

**Test**

A request attempts to declare:

```json
{
  "isCorrect": true
}
```

without actually selecting the server-side correct option.

**Expected**

The server performs its own comparison and does not trust the client flag.

**Status:** PASS

---

## 10. Duplicate Claim Test

### TC-020 — Duplicate Reward Claim

**Steps**

1. Verify a CAPTCHA.
2. Claim the pending reward.
3. Submit another claim for the same challenge.

**Expected**

First claim:

```text
HTTP 200
```

Second claim:

```text
HTTP 409
code: REWARD_ALREADY_CLAIMED
```

No second wallet credit or duplicate reward ledger entry is created.

**Status:** PASS

---

## 11. Concurrent Claim Test

### TC-021 — Ten Simultaneous Claim Requests

A concurrent request test was executed against the same verified challenge.

### Observed result

```text
Total requests: 10
Successful claims: 1
Rejected duplicate claims: 9
```

Observed HTTP distribution:

```text
1 × HTTP 200
9 × HTTP 409
```

This demonstrates that simultaneous requests did not create ten wallet credits for one challenge.

**Status:** PASS

---

## 12. Unauthorized API Test

### TC-022 — Missing Authentication

**Test**

A protected endpoint is called without a valid Bearer token.

**Expected**

```text
HTTP 401
Authentication required
```

**Status:** PASS

---

## 13. Invalid JWT Test

### TC-023 — Invalid Token

**Test**

A malformed or invalid JWT is sent to a protected API.

**Expected**

```text
HTTP 401
```

No protected data or reward operation is performed.

**Status:** PASS

---

## 14. Rate Limiting Test

### TC-024 — Excessive Requests

The API rate limiter was exercised with repeated requests.

Configured development limit:

```text
Window: 15 minutes
Maximum: 200 API requests per window
```

Expected behavior after the limit:

```text
HTTP 429
Too many requests
```

The rate limiter prevents uncontrolled repeated API traffic.

**Status:** PASS

---

## 15. Audit Logging Tests

### TC-025 — Invalid Attempt Audit

An invalid/non-existent challenge request was tested.

Observed response:

```text
HTTP 404
CHALLENGE_NOT_FOUND
```

The corresponding invalid/security attempt was also visible in the MongoDB `auditlogs` collection.

**Status:** PASS

---

### TC-026 — Security Event Logging

The audit trail was checked for security-sensitive events.

Covered events include:

```text
INVALID_ATTEMPT
DUPLICATE_ATTEMPT
EXPIRED_CHALLENGE
SUSPICIOUS_REQUEST
```

Reward lifecycle events include:

```text
CHALLENGE_CREATED
CHALLENGE_VERIFIED
REWARD_CREATED
REWARD_CLAIMED
```

**Status:** PASS

---

## 16. Database Verification

The MongoDB database was checked during testing to confirm that application state was persisted.

Verified persistence areas:

- User records
- CAPTCHA challenges
- Wallet balance
- Gem transactions
- Reward configuration
- Audit logs

The wallet balance was specifically verified after browser refresh to confirm that the value was not dependent only on frontend state.

**Status:** PASS

---

## 17. Security Test Summary

| Security Area | Result |
|---|---|
| JWT authentication | PASS |
| User isolation | PASS |
| Server-side answer verification | PASS |
| Exactly four CAPTCHA options | PASS |
| Invalid option rejection | PASS |
| Challenge expiry | PASS |
| Replay protection | PASS |
| Duplicate claim protection | PASS |
| Concurrent claim protection | PASS |
| Fake reward protection | PASS |
| Fake `isCorrect` protection | PASS |
| Fake user ID protection | PASS |
| Rate limiting | PASS |
| Audit logging | PASS |

---

## 18. Final Functional Flow

The complete tested user flow is:

```text
Create Account
      ↓
Login
      ↓
Wallet = 0 GEM
      ↓
New CAPTCHA
      ↓
Select Answer
      ↓
Server-side Verification
      ↓
Reward Created
      ↓
Claim
      ↓
Wallet Updated
      ↓
Gem Transaction Created
      ↓
Audit Event Created
      ↓
Refresh Browser
      ↓
Persisted Balance Still Available
```

---

## 19. Negative Flow

The tested security flow is:

```text
Invalid / Expired / Completed / Wrong-user request
                    ↓
              Backend validation
                    ↓
                  Reject
                    ↓
          No unauthorized reward
                    ↓
            Audit event recorded
```

---

## 20. Testing Limitations

These tests were performed in the local development environment against the implemented application.

Production-scale testing would additionally include:

- Load testing at 100,000+ daily attempts
- Multiple backend instances
- Distributed rate limiting
- Network failure/retry testing
- Production database failover testing
- Browser/device compatibility testing
- Long-running concurrency testing
- Production monitoring and alert validation

The current test results should therefore be understood as functional and security validation of the local implementation, not a guarantee of production-scale behavior.


---


## Appendix A — Final Security Evidence

The Postman collection contains dedicated requests for the remaining assignment security requirements:

| Test | Result |
|---|---|
| Fake Reward | PASS |
| Fake `isCorrect` | PASS |
| Fake User ID | PASS |
| Wrong User Challenge | PASS |
| Duplicate Verification | PASS |
| Duplicate Claim | PASS |
| Expired Challenge | PASS |
| Concurrent Verification | PASS |
| Rate Limit | PASS |

Execution notes:

- Fake `isCorrect` was tested with a known wrong option while sending `isCorrect: true`; the backend returned `correct: false` and the configured wrong-answer reward.
- Wrong User Challenge used a different authenticated account against another user's challenge and returned `CHALLENGE_NOT_FOUND`.
- Concurrent Verification sent 10 parallel verification requests for one active challenge; the backend allowed one state transition and rejected the competing requests with `CHALLENGE_ALREADY_COMPLETED`.
- Rate Limit was verified locally by exceeding the 200-request / 15-minute API limit and observing HTTP 429 responses.


## Appendix B — Screenshot Evidence

The repository contains browser/API evidence screenshots for the implemented flows.

| Evidence | Screenshot |
|---|---|
| Home / logged-in UI | `screenshots/01_home_logged_in.png` |
| Create account | `screenshots/02_create_account.png` |
| Correct CAPTCHA reward | `screenshots/03_correct_captcha_reward.png` |
| Reward claimed | `screenshots/04_reward_claimed.png` |
| Gem transaction history | `screenshots/05_gem_transaction_history.png` |
| API / Network flow | `screenshots/06_api_network_flow.png` |
| Wallet | `screenshots/07_wallet.png` |
| Gem transaction | `screenshots/08_gem_transaction.png` |
| Audit logs | `screenshots/09_audit_logs.png` |
| Security audit logs | `screenshots/10_security_audit_logs.png` |
| Wrong CAPTCHA reward | `screenshots/11_wrong_captcha_reward.png` |
| No Thanks / new challenge | `screenshots/12_no_thanks_new_challenge.png` |
| Login | `screenshots/13_login.png` |
| Wallet persistence | `screenshots/14_wallet_persistence.png` |
| Postman collection | `screenshots/15_postman_collection.png` |
| Correct CAPTCHA API reward | `screenshots/16_correct_captcha_reward.png` |
| Claim API | `screenshots/17_claim_reward.png` |
| Wallet balance API | `screenshots/18_wallet_balance.png` |
| Gem transactions API | `screenshots/19_gem_transactions.png` |
| Unauthorized API | `screenshots/20_unauthorized_generate.png` |
| Invalid JWT | `screenshots/21_invalid_jwt.png` |
| Duplicate claim | `screenshots/22_duplicate_claim.png` |
| Invalid option | `screenshots/23_invalid_option.png` |
| Missing selected option | `screenshots/24_missing_selected_option.png` |

These files are supporting evidence; the actual security tests were also executed in Postman/local development as described above.
