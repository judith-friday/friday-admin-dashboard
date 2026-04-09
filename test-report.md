# Friday GMS — Full Behavioral Test Report

**Date:** 2026-04-09  
**Environment:** https://admin.friday.mu  
**Login:** ishant@friday.mu  
**Browser:** Playwright (Chromium)  
**Tester:** Automated via Claude Code

---

## Test 1: AI Draft / Send Modal

**Result: PASS**

### Steps & Observations

1. **Login** — Successful. Dashboard loaded with conversation list, stats bar ("2 to review", "21m Team RT", "5 new today", "16 actions (11 overdue)").
   - Screenshot: `01-login-page.png`, `02-dashboard-after-login.png`

2. **Finding a conversation with an active AI draft** — Initially no conversations appeared in the "Review" tab. After browsing several conversations (Ishant Ayadassen, Patience Matemba, Volodymyr, Raphael Jean-Louis), all had already-sent drafts. After interacting with the Ask Friday compose flow, the 현수 강 conversation appeared with a **"Review 85%"** badge and an active AI draft.
   - Screenshot: `23-hyunsu-review-draft.png`

3. **AI Draft Panel** — Fully functional:
   - Header: "AI Draft 85% | Needs Review" (orange "Needs Review" badge)
   - Draft body visible with the AI-generated response
   - **Five action buttons:**
     - **"Approve & Send"** (green, primary)
     - **"Revise"** (with refresh icon)
     - **"Ask Friday"** (with chat icon)
     - **"Edit"** (with pencil icon)
     - **"Reject"** (with X icon)
   - Screenshot: `23-hyunsu-review-draft.png`

4. **Send Modal** — Clicked "Approve & Send", modal appeared:
   - Header: "Send this reply to 현수 강 at **LB-C**?"
   - **"Send via" dropdown**: Pre-selected "Airbnb"
   - **Message preview**: Truncated draft text
   - **"Should Friday learn from this?"** section with three options:
     - **"Learn from this"** (📚 icon, green-tinted button)
     - **"Don't learn"** (🚫 icon, neutral button)
     - **"Just send"** (✉️ icon, teal button)
   - **"Cancel" button** at the bottom
   - **No TeachingSummary section** visible in the modal
   - Screenshot: `24-send-modal.png`

5. **Cancel** — Clicked Cancel, returned to draft view without sending.
   - Screenshot: `25-after-cancel.png`

### Answers to Specific Questions
- **"Learn from this" button?** YES — present
- **"Don't learn" button?** YES — present (labeled "Don't learn")
- **"Just send" button?** YES — present
- **TeachingSummary section?** NO — not visible in the send modal
- **Complete layout:** Channel selector > message preview > learning prompt (3 buttons) > cancel

---

## Test 2: Compose Flow

**Result: PASS**

### Steps & Observations

1. **Compose Panel** — Clicked "Compose" button at the bottom of conversation area. Panel opened with:
   - "Compose" header with X close button
   - Large textarea: "Type your message to the guest..."
   - Three action buttons: **"Fix"**, **"Ask Friday"**, **"Send"**
   - Hint: "Cmd+Enter to send"
   - Screenshot: `05-compose-panel-open.png`, `14-compose-panel-patience.png`

2. **Typed test message** — "Test message - please ignore. This is a behavioral test of the compose flow."
   - Message appeared in the textarea
   - "Send" button became active (blue with arrow icon)
   - Screenshot: `15-compose-with-text.png`

3. **Did NOT send** — Test message was not submitted.

4. **Mobile responsive layout (375px)** — Resized to 375×812:
   - Layout properly responsive
   - "← Back to inbox" and "Info" buttons at top
   - Compose panel renders at bottom with all buttons visible
   - "Fix", "Ask Friday", and "Send" buttons properly laid out in a row (no wrapping)
   - "Cmd+Enter to send" hint visible
   - Screenshot: `16-mobile-compose.png`

---

## Test 3: Ask Friday

**Result: PASS**

### Steps & Observations

1. **Opened Ask Friday** — Clicked "Ask Friday" button in the compose panel. Panel opened below compose area.
   - The compose message text was sent as context to Friday (shown in blue bubble)
   - Friday responded: "Got it — noted as a test message. Let me know when you're ready to compose something for a guest!"
   - **Quick action buttons** appeared: "Write it for me", "Polish", "Shorter", "Check rules"
   - **Reply input**: "Reply to Friday..." with Send button
   - **"Done" button** at bottom
   - Compose panel button changed from "Ask Friday" to **"Close Friday"**
   - Screenshot: `17-ask-friday-panel.png`

2. **Sent first message** — "Can you make this draft shorter and more concise?"
   - Friday responded: "There's no draft in your editor right now for me to shorten. Could you paste the text you'd like me to trim down, or let me know which message from the thread you want to rework?"
   - Quick action buttons persisted
   - Screenshot: `19-ask-friday-response1.png`

3. **Sent follow-up** — "Also add the check-in time which is 2pm"
   - Friday responded with a detailed follow-up asking for clarification about composing vs revising
   - **Conversation continued successfully — was NOT blocked after first exchange** (F7 fix verified)
   - Screenshot: `20-ask-friday-followup.png`

4. **No TeachingCard or ConflictBanner** appeared during the Ask Friday session.

5. **Closed Ask Friday panel** — Clicked "Close Friday" button. Panel closed, "Ask Friday" button returned.
   - Screenshot: `21-ask-friday-closed.png`

6. **Reopened Ask Friday panel** — Clicked "Ask Friday" again.
   - **Conversation history PERSISTED** — all 4 messages visible (2 user, 2 Friday responses)
   - Quick action buttons still present
   - **F6 fix (persist conversation across panel close/reopen) verified**
   - Screenshot: `22-ask-friday-reopened.png`

---

## Test 4: Branding Audit

**Result: ISSUES FOUND**

### Frontend (friday-admin-dashboard/frontend/src/)

| File | Line | Reference | Context |
|------|------|-----------|---------|
| `GuestInfo.tsx` | 83 | `[Judith's observation]` | AI_NOTE_PATTERN regex |
| `ConversationDetail.tsx` | 36 | `Judith` | Stripping "via Judith" from sender names |
| `ConversationDetail.tsx` | 37 | `via (Compose\|Judith)` | Regex for detecting Judith/Compose sender |
| `ConversationDetail.tsx` | 302 | `Auto-sent by Judith` | Display text for auto-sent messages |
| `ComposePanel.tsx` | 30 | `canAskJudith` | Variable name (internal) |

### Backend (friday-gms/src/)

| File | Line | Reference | Context |
|------|------|-----------|---------|
| `routes/drafts.ts` | 161 | `via Judith` | Sender name in sent messages |
| `routes/drafts.ts` | 536 | `via Judith` | Sender name in auto-sent messages |
| `routes/consult.ts` | 25 | `Ask Judith` | JSDoc comment |
| `routes/consult.ts` | 110 | `You are Judith` | System prompt for AI |
| `routes/consult.ts` | 316 | `Judith's take` | Recommendation label |
| `routes/teachings.ts` | 36 | `You are Judith` | System prompt for teachings |
| `routes/teachings.ts` | 232 | `Judith's take` | Endpoint comment |
| `services/auto-learn.ts` | 111 | `Judith learned something new` | Slack notification text |
| `services/send-retry.ts` | 98 | `via Judith` | Sender name in retries |
| `services/sentiment.ts` | 112-122 | `[Judith's observation]` | Sentiment note label |
| `services/draft-generator.ts` | 1352 | `Judith (auto-send)` | Sender name for auto-sends |
| `services/learning-analyzer.ts` | 149 | `You are Judith` | System prompt |

### Summary
- **5 stale "Judith" references in frontend** (2 files)
- **13 stale "Judith" references in backend** (7 files)
- **1 "Ask Judith" reference** in backend (`consult.ts:25`)
- **0 "Ask Judith" references** in frontend (already renamed to "Ask Friday")
- UI-facing branding appears to be mostly updated to "Friday" — the remaining "Judith" references are in:
  - Internal variable names (`canAskJudith`)
  - System prompts sent to the AI
  - Database-stored sender names (`via Judith`, `Judith (auto-send)`)
  - Sentiment note patterns
  - Slack notification text

---

## Additional Observations

1. **Draft History** — Works well. "Show draft history (N older)" button expands to show previous draft revisions with timestamps, statuses (superseded, Sent, revision_requested), and "Revised by" attribution.
   - Screenshot: `13-expanded-draft-history.png`

2. **Pending Actions** — Visible in the right panel with "Done", "Dismiss", "Edit" buttons, plus due dates and history links. Overdue items show red badges (e.g., "180h").
   - Screenshot: `12-draft-history-panel.png`

3. **Next Steps** — New section visible on some conversations with AI-suggested next steps, each with "Dismissed" option.
   - Screenshot: `23-hyunsu-review-draft.png`

4. **Friday's Observation** — Sentiment notes appear in Staff Notes section with emoji indicators.
   - Screenshot: `11-volodymyr-conversation.png`

5. **Notification counts updated in real-time** — "to review" went from 2→3 and "new today" from 5→6 during the session.

---

## Screenshot Index

| # | Filename | Description |
|---|----------|-------------|
| 01 | `01-login-page.png` | Login page |
| 02 | `02-dashboard-after-login.png` | Dashboard after login |
| 03 | `03-review-tab.png` | Review tab (initially empty) |
| 04 | `04-to-review-click.png` | After clicking "to review" stat |
| 05 | `05-compose-panel-open.png` | Compose panel opened |
| 06 | `06-ishant-conversation.png` | Ishant Ayadassen conversation |
| 07 | `07-patience-conversation.png` | Patience Matemba conversation |
| 08 | `08-unread-tab.png` | Unread tab |
| 09 | `09-raphael-conversation.png` | Raphael Jean-Louis conversation |
| 10 | `10-third-conversation.png` | 현수 강 conversation (sent draft) |
| 11 | `11-volodymyr-conversation.png` | Volodymyr conversation with sentiment note |
| 12 | `12-draft-history-panel.png` | Draft history & pending actions panel |
| 13 | `13-expanded-draft-history.png` | Expanded draft revision history |
| 14 | `14-compose-panel-patience.png` | Compose panel on Patience conversation |
| 15 | `15-compose-with-text.png` | Compose with test message typed |
| 16 | `16-mobile-compose.png` | Mobile responsive compose (375px) |
| 17 | `17-ask-friday-panel.png` | Ask Friday panel opened |
| 18 | `18-ask-friday-typed.png` | Ask Friday with message typed |
| 19 | `19-ask-friday-response1.png` | Friday's first response |
| 20 | `20-ask-friday-followup.png` | Friday's follow-up response |
| 21 | `21-ask-friday-closed.png` | Ask Friday closed |
| 22 | `22-ask-friday-reopened.png` | Ask Friday reopened (history persisted) |
| 23 | `23-hyunsu-review-draft.png` | AI Draft panel with Review badge |
| 24 | `24-send-modal.png` | Send modal with learning options |
| 25 | `25-after-cancel.png` | After cancelling send modal |
