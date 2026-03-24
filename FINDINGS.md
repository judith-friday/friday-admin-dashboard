# Friday GMS v3.6 — Frontend Feature Audit

**Date:** March 25, 2026
**Auditor:** Judith (AI Assistant)

## Backend API Endpoints

| Route Group | Endpoints | Frontend Uses |
|---|---|---|
| `/api/auth` | POST /login, GET /me, PATCH /me/password | ✅ All used |
| `/api/conversations` | GET /, GET /:id, PATCH /:id, POST /:id/read, POST /:id/unread, GET /:id/messages, GET /:id/drafts, GET /:id/channels, GET /:id/reservation | ✅ Most used, ❌ GET /:id/channels not used, ⚠️ GET /:id/reservation not used in UI |
| `/api/drafts` | GET /:id, POST /:id/approve, POST /:id/reject, POST /:id/revise, POST /:id/retry, POST /:id/fail, DELETE /:draft_id | ✅ All used |
| `/api/properties` | GET /, GET /:code/card, PUT /:code/card, GET /:code/card/history | ❌ NOT used in frontend — property card popup not implemented |
| `/api/reservations` | GET /:id | ❌ NOT used directly |
| `/api/stats` | GET /inbox | ✅ Used for header stats |
| `/api/pending-actions` | GET /, POST /, PATCH /:id | ✅ All used |
| `/api/teachings` | GET /, POST /, PATCH /:id/revoke, DELETE /:id | ✅ Used (delete not called but available) |
| `/api/sse` | GET /events | ✅ Used for real-time updates |
| `/api/users` | GET /, POST /, PATCH /:id, DELETE /:id | ❌ Admin user management UI not built |
| `/api/send-queue` | POST /send-complete, GET /poller-status | ❌ NOT used in frontend |
| `/api/briefing` | POST /test | ⚠️ Admin-only test endpoint, not in UI |
| `/api/import` | POST /conversations | ⚠️ Admin tool, not in UI |
| `/api/webhooks` | POST /guesty, GET /guesty | ⚠️ Backend webhook handler, not UI-facing |

## Feature Checklist

### ✅ Working End-to-End
- [x] **Read/unread blue dots and bold names** — `is_unread` tracked, blue dot on unread conversations, bold styling
- [x] **Mark-as-unread on hover** — Button appears on hover, calls POST /conversations/:id/unread
- [x] **Conversation close/reopen** — "Mark as Done" button, status toggle, auto-reopen on new inbound
- [x] **Pending actions tab with age badges** — ⏳ Actions tab, age badges (green/amber/red), overdue alerts
- [x] **Done/Dismiss on pending actions** — Both actions available in actions tab
- [x] **Overdue action alerts** — Color-coded age badges indicate urgency
- [x] **Auto-send toggle per conversation** — Toggle in sidebar, saves to DB
- [x] **Staff notes in sidebar** — Text input, saves via PATCH /conversations/:id
- [x] **Response time tracking in stats bar** — "avg response" shown in header (green/amber/red based on minutes)
- [x] **Notification sound + mute toggle** — Mute button in header, sound plays on new messages
- [x] **Keyboard shortcuts** — ↑/↓ navigation, Enter to select, Cmd+Enter to approve, Escape to close, / to search
- [x] **"Ask Judith to adjust" revision input** — Text input below draft with Revise button
- [x] **Three revision modes** — "Revise" (standard), "Revise & teach" (🧠), "one-time" — all functional
- [x] **Report bug button → Slack** — Link to #fr-gms-feedback Slack channel in help panel
- [x] **Header stats** — "to review", "avg response", "new today", "pending actions" all showing
- [x] **Filter tabs** — All, Unread, Review, Open, Done, Actions — all functional
- [x] **Translation at send time with dual display** — Translates on approve, shows English draft + translated version after sending
- [x] **Send confirmation with 5-second undo** — Confirmation modal → 5s countdown → can cancel
- [x] **Channel badges** — ✅ Fixed in v3.6 Task 1
- [x] **Send channel selector** — ✅ Fixed in v3.6 Task 3
- [x] **Teaching attribution** — ✅ Fixed in v3.6 Task 4
- [x] **Queued message retry** — ✅ Fixed in v3.6 Task 2

### ❌ Not Implemented in Frontend
- [ ] **Property card popup on click** — Help text says "Click any property code to view its knowledge card" but NO click handler exists on property codes. Backend has full CRUD: GET/PUT /:code/card and GET /:code/card/history. **Priority: HIGH** — this is referenced in help text and would be very useful for the team.
- [ ] **User management UI** — Backend has full CRUD (GET/POST/PATCH/DELETE /api/users) but no admin panel in frontend. Team members are created via API only. **Priority: MEDIUM** — needed before giving team access.
- [ ] **Send queue management** — Backend has /api/send-queue endpoints but no UI to view/manage the queue. **Priority: LOW** — retry buttons on queued drafts handle this per-draft.
- [ ] **Briefing test UI** — Backend has POST /api/briefing/test but no button in UI. **Priority: LOW** — admin utility.
- [ ] **Conversation channels endpoint** — GET /api/conversations/:id/channels exists but not called from frontend. May have been intended for the channel selector but was built differently. **Priority: LOW**.
- [ ] **Reservation detail panel** — Backend has GET /api/conversations/:id/reservation and full reservation data, but the sidebar only shows check-in/out dates. Could show guest phone, email, total price, special requests. **Priority: MEDIUM** — would help team make better decisions.

### ⚠️ Partially Working / Needs Attention
- **Guesty send API** — `sendMessage()` doesn't include required `module` field. All sends via Guesty API will fail with `VALIDATION_ERROR: "module" is required`. This is blocking actual message delivery. **Priority: CRITICAL**.
- **Conversation summary** — Summary field exists in DB and is shown in the conversation header, but it's only populated for conversations that had summaries at import time. New conversations don't generate summaries. **Priority: MEDIUM**.
- **Slack notifications** — Backend code exists (`slack-notifier.ts`) but needs webhook URL configuration. Session context says "needs webhook URL from Ishant." **Priority: HIGH for rollout**.

## Gaps by Priority

### 🔴 CRITICAL (blocks rollout)
1. **Guesty sendMessage needs `module` field** — no messages can actually be sent to guests right now

### 🟡 HIGH (should fix before rollout)
2. **Property card popup** — help text promises it, backend supports it, frontend missing
3. **Slack notifications webhook** — needs Ishant to provide URL
4. **User management UI** — team can't manage their own accounts

### 🟢 MEDIUM (nice to have)
5. **Reservation detail panel** — show more guest/booking info in sidebar
6. **Conversation summary generation** — auto-generate for new conversations
7. **Send queue management UI** — bulk view of queued messages

### ⚪ LOW
8. **Briefing test UI** — admin utility
9. **Channels endpoint integration** — may not be needed
