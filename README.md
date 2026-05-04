# 🚀 CoWork.ai

CoWork.ai is a **multi-AI collaborative workspace** where users can organize work into projects, chat with AI models, and collaborate with teammates using structured context.

---

## ✨ Features

### 🧠 Core
- Project-based AI workspace
- Multiple chats per project
- Public / private chats
- Project instructions + memory
- Streaming AI responses

### 🤖 AI
- Single-model responses (Free)
- Multi-model Team Mode (Pro)

### 📎 Files
- Upload files (PDF, TXT, code, DOCX)
- Inject file context into AI
- Rename / delete files
- Chat-scoped file usage

### 💬 Chat
- Message retry
- Message edit with versioning
- Copy responses/questions
- Export chat (PDF / TXT)
- Select messages for export

### 👥 Collaboration
- Shared projects
- Invite via email
- Role system:
  - Owner
  - Editor (Pro)
  - Viewer

### 🔐 Auth
- Register / Login
- Forgot password
- Reset password
- Profile management

### 📊 Analytics
- Token usage (Free)
- Full analytics dashboard (Pro)

---

## 💰 Plans

### Free
- Max 3 projects
- Single-model AI
- 5 files per project
- Viewer-only collaboration

### Pro
- Unlimited projects
- AI Team Mode
- 30 files per project
- Full collaboration (roles)
- Private chats
- Full analytics

---

## 🏗 Tech Stack

- **Frontend:** Next.js (App Router)
- **Backend:** Next.js API routes
- **Database:** Neon PostgreSQL
- **Auth:** JWT
- **Email:** Resend
- **File Processing:** pdf-parse / docx

---

## ⚙️ Setup

### 1. Clone

```bash
git clone https://github.com/your-repo/cowork-ai.git
cd cowork-ai
````

---

### 2. Install

```bash
npm install
```

---

### 3. Environment

Create `.env.local`:

```env
DATABASE_URL=your_neon_db_url
JWT_SECRET=your_secret

RESEND_API_KEY=your_key
APP_URL=http://localhost:3000
```

---

### 4. Setup DB

```bash
npm run db:setup
```

---

### 5. Run

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

---

## 📡 API

Full API documentation:

```txt
API_ROUTES.md
```

---

## 📊 Plan Enforcement

See:

```txt
PLAN_LIMITS.md
```

---

## 🎨 Frontend Guide

See:

```txt
FRONTEND_TODO.md
```

---

## 📌 Notes

* Backend strictly enforces Free vs Pro limits
* Frontend should handle `403` responses gracefully
* File context is scoped per chat + project

---

## 🚧 Future

* Billing (Razorpay / Stripe)
* Integrations
* AI workflow automation
* Team dashboards

---

## 👨‍💻 Author

Built as a full-stack SaaS system with scalable architecture.

````