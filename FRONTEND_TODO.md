# CoWork.ai — Frontend Implementation Guide

This document defines all UI features to be built based on backend readiness.

---

## 🔐 Auth Pages

### Login Page
- Email + password
- Store JWT in localStorage
- Redirect → `/dashboard`

### Register Page
Fields:
- Name
- Email
- Password
- Age (optional)
- DOB (optional)
- Gender (optional)
- Mobile number (optional)
- Country (optional)

---

### Forgot Password
- Input email
- Call `/api/auth/forgot-password`
- Show success message

---

### Reset Password
Route: `/auth/reset-password/[token]`
- Input new password
- Call `/api/auth/reset-password`

---

## 🧑 Profile

### Profile Page
- Fetch `/api/me`
- Editable:
  - name
  - email
  - mobile
  - country

### Change Password
- current password
- new password
- call `/api/me/password`

---

## 📊 Dashboard

### Project List
Display:
- Project name
- Description
- Owner email
- Role badge (owner/editor/viewer)
- Shared badge

### Actions
- Create project
- Open project

---

## 📁 Project Page

### Layout
- Sidebar:
  - Chat list
  - New chat button
- Main:
  - Chat messages
- Right panel:
  - Files

---

## 💬 Chat System

### Chat List
- List chats
- Rename on click
- Delete chat
- Show public/private badge

---

### Messages UI
- Single bubble per message
- Version navigation (← →)
- Edit message inline
- Retry message
- Copy response
- Copy question

---

### Input Box
- Send message
- Attach files
- Select AI role
- Team mode toggle (🔒 Pro)

---

## 📎 File System

### Upload
- Drag & drop
- Show limit:
  - Free: 5
  - Pro: 30

### File List
Each file shows:
- Name
- Rename button
- Delete button
- "Used in: Chat X / All project chats"

---

## 📤 Export

### Export Button
- Opens modal

Options:
- With questions / Without questions
- Format:
  - PDF
  - TXT

---

### Select Messages Mode
- Checkbox UI
- Export selected messages

---

## 👥 Collaboration

### Invite Dialog
- Input email
- Select role:
  - Free: only viewer
  - Pro: viewer/editor/owner

---

### Members List
- Show users
- Role dropdown (🔒 Pro)
- Remove user (🔒 Pro)

---

## 📊 Analytics

### Sidebar Card (Free + Pro)
- Today tokens
- Cost
- Most used model

---

### Full Analytics Page (🔒 Pro)
- Charts
- Usage trends
- Cost breakdown
- Model usage

---

## ⚙️ Settings

### Project Settings
- Name
- Description
- Instructions

---

### Website Settings
- Theme (light/dark)
- Default preferences

---

## 🌙 Theme

- Toggle button in sidebar
- Persist in localStorage
- Apply globally

---

## 💰 Plan Gating

Frontend must:

### Disable / hide:
- Team mode
- Private chat toggle
- Editor/owner invites
- Member role changes
- Full analytics

### Show upgrade prompts:
- “Upgrade to Pro”

---

## ⚠️ Error Handling

- Handle 401 → redirect to login
- Handle 403 → show upgrade message
- Handle 500 → generic error

---

## 🚀 Priority Order

1. Auth pages
2. Dashboard
3. Project + chat UI
4. File system
5. Export
6. Collaboration
7. Analytics
8. Settings
9. Theme
10. Billing (later)

---

## Notes

- Backend is source of truth
- Always trust API responses over UI assumptions
- Handle loading + empty states properly