# CoWork.ai Plan Limits

## Overview

User plans are stored in:
- `users.plan` → "free" | "pro"

---

## 🆓 Free Plan

### Projects
- Max 3 projects per user

### Chats
- Unlimited chats per project
- Public chats allowed
- Private chats ❌ NOT allowed

### AI
- Single-model responses only
- Team Mode ❌ NOT allowed

### Files
- Max 5 files per project
- File context included in AI

### Collaboration
- Shared projects allowed
- Can invite users:
  - ✔ viewer
  - ❌ editor
  - ❌ owner

### Roles
- Viewer: allowed
- Editor: ❌ blocked
- Owner controls (remove/change roles): ❌ blocked

### Export
- TXT export ✔
- PDF export ✔
- Selected message export ✔

### Analytics
- Sidebar token card only:
  - today usage
  - cost
  - most used model
- Full analytics ❌ NOT allowed

### Support
- Standard only

---

## 💰 Pro Plan

Includes everything in Free +

### Projects
- Unlimited projects

### AI
- Team Mode ✔ enabled

### Files
- Max 30 files per project

### Collaboration
- Full sharing enabled
- Can invite:
  - ✔ viewer
  - ✔ editor
  - ✔ owner

### Roles
- Full member management:
  - change roles
  - remove members

### Chats
- Private chats ✔ allowed

### Analytics
- Full analytics dashboard:
  - usage charts
  - cost trends
  - model usage
  - provider breakdown

### Support
- Priority support

---

## Enforcement Points (Backend)

| Feature | Location |
|--------|---------|
| Project limit | `/api/projects` POST |
| File limit | `/api/projects/[id]/files` POST |
| Team mode | `/api/projects/[id]/message/team` |
| Private chats | `/api/projects/[id]/chats` |
| Invite roles | `/api/projects/[id]/invites` |
| Member management | `/api/projects/[id]/members` |

---

## Frontend Rules

Frontend must:
- Disable UI for restricted features
- Show upgrade prompts for:
  - Team mode
  - Private chat toggle
  - Editor/owner invites
  - Analytics page

Backend is the source of truth.