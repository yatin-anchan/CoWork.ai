# CoWork.ai API Routes

## Auth

### POST /api/auth/register
Create user account

### POST /api/auth/login
Returns JWT token

### POST /api/auth/forgot-password
Send reset email

### POST /api/auth/reset-password
Reset password using token

---

## User

### GET /api/me
Get current user profile

### PATCH /api/me
Update profile

### PATCH /api/me/password
Change password (logged in)

---

## Projects

### GET /api/projects
List all projects (owned + shared)

### POST /api/projects
Create project (Free: max 3)

---

### GET /api/projects/:id
Get project details

### PATCH /api/projects/:id
Update project (name, description, instructions)

---

## Chats

### GET /api/projects/:id/chats
List chats in project

### POST /api/projects/:id/chats
Create chat

---

### GET /api/projects/:id/chats/:chatId
Get chat messages

### PATCH /api/projects/:id/chats/:chatId
Update chat (name, visibility)

### DELETE /api/projects/:id/chats/:chatId
Delete chat

---

## Messages

### POST /api/projects/:id/message
Single-model AI response

### POST /api/projects/:id/message/stream
Streaming response

### POST /api/projects/:id/message/team
Multi-model Team Mode (Pro only)

---

## Message Actions

### POST /api/projects/:id/chats/:chatId/messages/:messageId/retry
Retry message

### POST /api/projects/:id/chats/:chatId/messages/:messageId/edit
Edit message (creates version)

---

## Export

### POST /api/projects/:id/chats/:chatId/export

Body:
```json
{
  "format": "pdf" | "txt",
  "includeQuestions": true,
  "messageIds": ["optional"]
}
```

---

## 📎 Files

### GET `/api/projects/:id/files`
List uploaded files.

### POST `/api/projects/:id/files`
Upload file.
- Free: max 5 per project
- Pro: max 30 per project

### PATCH `/api/projects/:id/files/:fileId`
Rename file.

### DELETE `/api/projects/:id/files/:fileId`
Delete file.

---

## 👥 Collaboration

### GET `/api/projects/:id/members`
List project members.

### POST `/api/projects/:id/invites`
Invite user via email.

### POST `/api/invites/:token`
Accept invite.

### GET `/api/projects/:id/roles`
Get current user role in project.

---

## 📊 Analytics

### GET `/api/usage`
Basic usage stats (available to all users).
- Full analytics dashboard → 🔒 Pro only (frontend-gated)

---

## 🔗 Utilities

### GET `/api/models/roles`
List available AI roles.

### GET `/api/link-preview?url=`
Fetch metadata preview for URLs.

---

## 🔑 Authentication

All protected endpoints require:

```
Authorization: Bearer <token>
```

---

## ⚠️ Notes

- Backend strictly enforces plan limits (Free vs Pro)
- Frontend must:
  - Handle `403` responses gracefully
  - Show upgrade prompts for restricted features
- Always validate user role before enabling UI actions

---