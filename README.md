# 🚀 VELoop CAPTCHA Earn

> **A full-stack CAPTCHA earning platform where users solve CAPTCHA challenges and earn GEM rewards through a secure, authenticated API-driven workflow.**

VELoop CAPTCHA Earn is an independent full-stack project built to demonstrate practical experience in **REST API development, JWT authentication, CAPTCHA verification, reward management, wallet transactions, validation, security controls, audit logging, and API testing with Postman**.

---

## ✨ Project Highlights

🔐 JWT-based authentication  
🧩 CAPTCHA challenge generation  
🖼️ CAPTCHA image generation  
✅ CAPTCHA answer verification  
💎 GEM reward system  
💰 Wallet balance management  
📜 GEM transaction history  
🧾 CAPTCHA attempt/history tracking  
⏭️ CAPTCHA skip functionality  
🛡️ Authentication and security validation  
🚫 Duplicate reward claim protection  
⚠️ Invalid CAPTCHA option validation  
🧪 Comprehensive Postman API testing  
📊 Audit and security logging  
📚 Structured project documentation  

---

## 🎯 Project Overview

VELoop CAPTCHA Earn provides a complete workflow where an authenticated user can generate CAPTCHA challenges, view CAPTCHA images, submit answers, earn GEM rewards after successful verification, and track those rewards through a wallet and transaction history.

The project also includes negative and security testing to verify how the API behaves when users provide invalid credentials, invalid CAPTCHA options, missing fields, or attempt duplicate reward claims.

---

# 🔄 Core CAPTCHA Earning Workflow

```text
                    👤 USER
                      │
                      ▼
               🔐 REGISTER / LOGIN
                      │
                      ▼
             🧩 GENERATE CHALLENGE
                      │
                      ▼
               🖼️ GET CAPTCHA IMAGE
                      │
                      ▼
              ✍️ SUBMIT CAPTCHA
                      │
             ┌────────┴────────┐
             │                 │
             ▼                 ▼
        ✅ CORRECT          ❌ WRONG
             │                 │
             ▼                 ▼
       🎁 CLAIM REWARD      📝 ATTEMPT RECORDED
             │
             ▼
        💎 GEM ADDED
             │
             ▼
       💰 WALLET UPDATED
             │
             ▼
      📜 TRANSACTION CREATED
```

Users can also skip an active CAPTCHA challenge.

---

# 🌟 Features

## 🔐 Authentication

- User registration
- User login
- JWT-based authentication
- Protected API endpoints
- Invalid and expired token handling
- Unauthorized request protection

---

## 🧩 CAPTCHA System

- Generate unique CAPTCHA challenges
- Generate CAPTCHA images
- Provide multiple answer options
- Submit CAPTCHA answers
- Validate CAPTCHA answers
- Track CAPTCHA challenge status
- Track correct and incorrect attempts
- Handle challenge expiration
- Skip active CAPTCHA challenges
- Retrieve CAPTCHA history

---

## 💎 Reward System

- Reward users after successful CAPTCHA verification
- Dedicated reward claiming endpoint
- Reward status tracking
- Duplicate claim protection
- Challenge-linked rewards
- Wallet-linked reward transactions

---

## 💰 GEM Wallet

- View current GEM balance
- Track GEM transactions
- Record balance before transaction
- Record balance after transaction
- Store transaction source
- Store transaction reference
- Maintain transaction status

---

## 🛡️ Security & Validation

The project includes dedicated negative and security test coverage for:

- Unauthorized API requests
- Invalid JWT
- Expired/inactive CAPTCHA challenges
- Duplicate reward claims
- Invalid CAPTCHA options
- Missing required request fields
- Completed challenge protection

---

# 🏗️ System Architecture

```text
┌──────────────────────────────────────────────┐
│                 🌐 FRONTEND                 │
│              React + Vite                   │
└──────────────────────┬───────────────────────┘
                       │
                       │ HTTP / REST API
                       ▼
┌──────────────────────────────────────────────┐
│                 ⚙️ BACKEND                 │
│             Node.js + Express               │
├──────────────────────────────────────────────┤
│                                              │
│  🔐 Authentication                          │
│  🧩 CAPTCHA Controller                      │
│  💰 Wallet Controller                       │
│  🛡️ Authentication Middleware               │
│  ⚙️ CAPTCHA Service                         │
│                                              │
└──────────────────────┬───────────────────────┘
                       │
                       │ Mongoose
                       ▼
┌──────────────────────────────────────────────┐
│                 🍃 MONGODB                 │
├──────────────────────────────────────────────┤
│                                              │
│  👤 Users                                   │
│  🧩 CAPTCHA Challenges                      │
│  📝 CAPTCHA Attempts                        │
│  💎 CAPTCHA Reward Configuration            │
│  💰 Wallets                                 │
│  💳 GEM Transactions                        │
│  🛡️ Audit Logs                              │
│                                              │
└──────────────────────────────────────────────┘
```

---

# 🧰 Tech Stack

## 🎨 Frontend

- **React**
- **Vite**
- **JavaScript**
- **CSS**

## ⚙️ Backend

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **JWT Authentication**

## 🧪 API Testing

- **Postman**

## 🛠️ Development Tools

- **Visual Studio Code**
- **Git**
- **GitHub**
- **npm**

---

# 📂 Project Structure

```text
veloop-captcha-earn/
│
├── 📄 README.md
├── 📄 .gitignore
│
├── ⚙️ backend/
│   │
│   ├── 📄 .env.example
│   ├── 📄 package.json
│   ├── 📄 package-lock.json
│   │
│   └── src/
│       │
│       ├── 📄 app.js
│       ├── 📄 server.js
│       │
│       ├── config/
│       │   └── 📄 db.js
│       │
│       ├── controllers/
│       │   ├── 📄 auth.controller.js
│       │   ├── 📄 captcha.controller.js
│       │   └── 📄 wallet.controller.js
│       │
│       ├── middleware/
│       │   └── 📄 auth.middleware.js
│       │
│       ├── models/
│       │   ├── 📄 User.js
│       │   ├── 📄 CaptchaChallenge.js
│       │   ├── 📄 CaptchaAttempt.js
│       │   ├── 📄 CaptchaRewardConfig.js
│       │   ├── 📄 Wallet.js
│       │   ├── 📄 GemTransaction.js
│       │   └── 📄 AuditLog.js
│       │
│       ├── routes/
│       │   ├── 📄 auth.routes.js
│       │   ├── 📄 captcha.routes.js
│       │   └── 📄 wallet.routes.js
│       │
│       └── services/
│           └── 📄 captcha.service.js
│
├── 🎨 frontend/
│   │
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── 📄 App.jsx
│   │   ├── 📄 App.css
│   │   ├── 📄 index.css
│   │   └── 📄 main.jsx
│   │
│   ├── 📄 package.json
│   ├── 📄 package-lock.json
│   └── 📄 vite.config.js
│
├── 📚 docs/
│   ├── 📄 API_DOCUMENTATION.md
│   ├── 📄 DATABASE.md
│   ├── 📄 SECURITY.md
│   └── 📄 TESTING.md
│
├── 🧪 postman/
│   └── 📄 VELoop-Captcha.postman_collection.json
│
└── 📸 screenshots/
    ├── Project UI screenshots
    └── API testing evidence
```

---

# 🔐 Authentication Flow

The application uses JWT-based authentication for protected API access.

```text
👤 User
   │
   ▼
📝 Register
   │
   ▼
🔐 Login
   │
   ▼
🎟️ JWT Token
   │
   ▼
🛡️ Protected API Requests
```

Protected API requests use:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

# 📡 REST API Reference

## 🔐 Authentication APIs

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT |

---

## 🧩 CAPTCHA APIs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/captcha/generate` | Generate a new CAPTCHA challenge |
| `GET` | `/api/captcha/image/:challengeId` | Get CAPTCHA image |
| `POST` | `/api/captcha/submit` | Submit CAPTCHA answer |
| `POST` | `/api/captcha/claim` | Claim available reward |
| `POST` | `/api/captcha/skip` | Skip an active CAPTCHA |
| `GET` | `/api/captcha/history` | Retrieve CAPTCHA history |

---

## 💰 Wallet APIs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/wallet/gems` | Get current GEM balance |
| `GET` | `/api/wallet/transactions` | Get GEM transaction history |

---

# 🧩 CAPTCHA API Workflow

## 1️⃣ Generate Challenge

```http
GET /api/captcha/generate
```

Generates a new CAPTCHA challenge with:

- Unique challenge ID
- Multiple answer options
- Expiration timestamp

---

## 2️⃣ Get CAPTCHA Image

```http
GET /api/captcha/image/:challengeId
```

Returns the CAPTCHA image associated with the specified challenge.

---

## 3️⃣ Submit CAPTCHA

```http
POST /api/captcha/submit
```

Example request:

```json
{
  "challengeId": "challenge-id",
  "selectedOption": "CAPTCHA_VALUE"
}
```

The server validates the selected CAPTCHA option and records the attempt.

---

## 4️⃣ Claim Reward

```http
POST /api/captcha/claim
```

A successfully verified CAPTCHA can make a reward available for claiming.

---

## 5️⃣ Skip CAPTCHA

```http
POST /api/captcha/skip
```

Allows an active challenge to be skipped.

---

## 6️⃣ View CAPTCHA History

```http
GET /api/captcha/history
```

Returns previous CAPTCHA activity including challenge status, result, reward amount, reward status, and timestamps.

---

# 💎 Wallet Workflow

## Get GEM Balance

```http
GET /api/wallet/gems
```

Returns the user's current GEM balance.

Example response structure:

```json
{
  "success": true,
  "data": {
    "gems": 4
  }
}
```

---

## Get GEM Transactions

```http
GET /api/wallet/transactions
```

Returns the user's GEM transaction history.

Transactions can contain:

- Transaction ID
- Currency
- Amount
- Transaction type
- Source
- Reference ID
- Balance before
- Balance after
- Status
- Creation timestamp

---

# 🧠 Database Models

The backend is organized around dedicated MongoDB/Mongoose models.

## 👤 User

Stores user information required for authentication and application usage.

## 🧩 CaptchaChallenge

Stores CAPTCHA challenges and their lifecycle state.

## 📝 CaptchaAttempt

Tracks submitted CAPTCHA attempts and their results.

## 💎 CaptchaRewardConfig

Stores CAPTCHA reward configuration.

## 💰 Wallet

Maintains the user's current GEM balance.

## 💳 GemTransaction

Records GEM transactions and balance changes.

## 🛡️ AuditLog

Stores audit information for traceability and monitoring.

---

# 🧪 Postman API Testing

The repository includes a dedicated Postman collection:

```text
postman/
└── VELoop-Captcha.postman_collection.json
```

The collection is organized into four sections:

```text
01 - Authentication
02 - CAPTCHA Main Flow
03 - Wallet
04 - Negative & Security Tests
```

---

# ✅ Tested Authentication Flow

## Registration

Successful registration was verified with:

```text
201 Created
Registration successful
```

## Login

Successful login was verified with:

```text
200 OK
Login successful
```

---

# ✅ Tested CAPTCHA Flow

The following end-to-end flow was successfully verified:

```text
🔐 Login
   ↓
🧩 Generate Challenge
   ↓
🖼️ Get CAPTCHA Image
   ↓
✅ Submit Correct CAPTCHA
   ↓
🎯 CAPTCHA Verified
   ↓
🎁 Claim Reward
   ↓
💎 GEM Added to Wallet
```

Additional scenarios were tested:

```text
❌ Wrong CAPTCHA
⏭️ Skip CAPTCHA
⏰ Expired CAPTCHA
📜 CAPTCHA History
```

---

# 💰 Wallet Verification

The reward system was also verified through wallet APIs.

The wallet balance reflects successful CAPTCHA rewards, while the transaction endpoint records each completed reward transaction.

Example balance progression:

```text
0 GEM
  ↓
+1 GEM
  ↓
1 GEM
  ↓
+1 GEM
  ↓
2 GEM
  ↓
+1 GEM
  ↓
3 GEM
```

---

# 🛡️ Negative & Security Testing

The project includes dedicated security and validation tests.

| Test Case | Expected Response | Result |
|---|---:|---|
| Unauthorized Generate | `401 Unauthorized` | ✅ PASS |
| Invalid JWT | `401 Unauthorized` | ✅ PASS |
| Duplicate Claim | `409 Conflict` | ✅ PASS |
| Invalid Option | `400 Bad Request` | ✅ PASS |
| Missing Selected Option | `400 Bad Request` | ✅ PASS |

---

## 🔒 Unauthorized Access

Attempting to access a protected endpoint without authentication returns:

```text
401 Unauthorized
Authentication required
```

This confirms protected endpoints require authentication.

---

## 🔑 Invalid JWT

Using an invalid or expired JWT returns:

```text
401 Unauthorized
Invalid or expired authentication token
```

---

## 🔁 Duplicate Claim Protection

Attempting to claim an already processed reward returns:

```text
409 Conflict
CLAIM_NOT_AVAILABLE
```

This prevents duplicate reward claims for the same challenge.

---

## ❌ Invalid CAPTCHA Option

Submitting an option that is not valid for the current challenge returns:

```text
400 Bad Request
INVALID_OPTION
```

---

## ⚠️ Missing Selected Option

Submitting a request without the required selected option returns:

```text
400 Bad Request
VALIDATION_ERROR
```

---

# ⏰ Challenge Lifecycle Protection

A CAPTCHA challenge can transition through different states such as:

```text
🆕 Active
   │
   ├── ✅ Completed
   │       └── 🎁 Reward Claimed
   │
   ├── ⏭️ Skipped
   │
   └── ⏰ Expired
```

Inactive/completed challenges cannot be reused for operations that require an active challenge.

---

# 📊 Audit & Security Logging

The project also includes audit/security logging to improve traceability and monitoring.

Audit-related information can help track:

- User activity
- CAPTCHA events
- Security-related actions
- Reward-related operations
- Important application events

---

# 📸 Screenshots & Evidence

Project screenshots and API testing evidence are available in the:

```text
screenshots/
```

directory.

The screenshots cover:

### 🖥️ Frontend / UI Evidence

- Home screen
- Account creation
- Login
- CAPTCHA interaction
- Correct CAPTCHA reward
- Reward claimed
- Wallet
- GEM transactions
- Audit logs
- Security audit logs
- Wrong CAPTCHA scenario
- Skip/No Thanks flow
- Wallet persistence

### 🧪 API Testing Evidence

- Postman collection overview
- Correct CAPTCHA verification
- Reward claim
- Wallet balance
- GEM transactions
- Unauthorized access
- Invalid JWT
- Duplicate claim
- Invalid CAPTCHA option
- Missing selected option

---

# 📁 Documentation

Additional technical documentation is available in the `docs/` directory:

```text
📄 docs/API_DOCUMENTATION.md
📄 docs/DATABASE.md
📄 docs/SECURITY.md
📄 docs/TESTING.md
```

---

# 🚀 Getting Started

## 📋 Prerequisites

Install the following before running the project:

- **Node.js**
- **npm**
- **MongoDB**
- **Git**

---

## 1️⃣ Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

Then:

```bash
cd veloop-captcha-earn
```

---

## 2️⃣ Backend Setup

Move into the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a local environment file based on:

```text
.env.example
```

Configure the required environment variables.

Start the backend:

```bash
npm run dev
```

The local API is configured to run on:

```text
http://localhost:5001
```

---

## 3️⃣ Frontend Setup

Open another terminal.

Move into the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

---

# 🧪 Running API Tests

Open the Postman collection:

```text
postman/VELoop-Captcha.postman_collection.json
```

Recommended execution order:

```text
01 - Authentication
        ↓
02 - CAPTCHA Main Flow
        ↓
03 - Wallet
        ↓
04 - Negative & Security Tests
```

---

# 🔄 Complete End-to-End Example

```text
👤 Register
    ↓
🔐 Login
    ↓
🎟️ JWT Authentication
    ↓
🧩 Generate Challenge
    ↓
🖼️ Get CAPTCHA Image
    ↓
✍️ Submit Answer
    ↓
✅ Correct Verification
    ↓
🎁 Claim Reward
    ↓
💎 GEM Added
    ↓
💰 Wallet Updated
    ↓
📜 Transaction Recorded
    ↓
🛡️ Security Tests
```

---

# 🔒 Security Best Practices

Never commit sensitive information to GitHub.

```text
❌ .env files
❌ Database credentials
❌ Passwords
❌ JWT tokens
❌ API keys
❌ Private secrets
```

Use:

```text
✅ .env.example
```

for safe configuration examples.

The repository is configured to ignore local environment files through `.gitignore`.

---

# 📌 Project Status

## ✅ Completed

- ✅ User registration
- ✅ User login
- ✅ JWT authentication
- ✅ CAPTCHA challenge generation
- ✅ CAPTCHA image generation
- ✅ CAPTCHA verification
- ✅ Reward claiming
- ✅ CAPTCHA skip flow
- ✅ CAPTCHA history
- ✅ GEM wallet
- ✅ GEM transaction history
- ✅ Audit logging
- ✅ Security logging
- ✅ Postman collection
- ✅ Positive API testing
- ✅ Negative API testing
- ✅ Security testing
- ✅ Project documentation
- ✅ Screenshot evidence
- ✅ Git repository setup

---

# 🎯 Why This Project?

VELoop CAPTCHA Earn was built to demonstrate practical full-stack engineering rather than a simple CRUD application.

The project combines:

```text
REST APIs
    +
Authentication
    +
Database Design
    +
Business Logic
    +
Reward System
    +
Wallet Management
    +
Transaction Tracking
    +
Security Validation
    +
API Testing
    +
Technical Documentation
```

This makes the project useful as a portfolio demonstration of backend and full-stack development skills.

---

# 🧠 Key Learning Outcomes

Through this project, the following concepts were implemented and practiced:

- Designing RESTful APIs
- Structuring an Express.js application
- Implementing JWT authentication
- Creating reusable middleware
- Designing MongoDB/Mongoose models
- Implementing business logic
- Managing wallet balances
- Recording financial-style transactions
- Implementing reward workflows
- Handling API validation
- Designing negative/security tests
- Organizing Postman collections
- Maintaining technical documentation
- Using Git for version control

---

# 🏆 Project Summary

**VELoop CAPTCHA Earn** is a full-stack application that demonstrates a complete user-to-reward workflow:

```text
🔐 Authentication
       ↓
🧩 CAPTCHA Challenge
       ↓
✅ Verification
       ↓
🎁 Reward Claim
       ↓
💎 GEM Wallet
       ↓
📜 Transaction History
       ↓
🛡️ Security Validation
```

The project brings together **frontend development, backend API engineering, authentication, database design, business logic, wallet management, security validation, API testing, audit logging, and documentation** into one complete application.

---

# 👨‍💻 Author

## Ashutosh Panwar

💻 Full-Stack Developer  
🤖 AI/ML Developer  
⚙️ Backend & API Development  

VELoop CAPTCHA Earn is an **independent portfolio project** created to demonstrate practical software development, API engineering, authentication, security, testing, and documentation skills.

---

# ⭐ Support

If you find this project interesting or useful:

⭐ Star the repository  
🍴 Explore the source code  
🧪 Review the Postman API collection  
📚 Read the project documentation  

---

# 🚀 VELoop CAPTCHA Earn

```text
💡 Build
   ↓
⚙️ Engineer
   ↓
🧪 Test
   ↓
🛡️ Secure
   ↓
📚 Document
   ↓
🚀 Deliver
```

### ❤️ Built with code, testing, and continuous learning.
