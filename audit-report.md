# F9: Compose + AI Draft + Ask Friday — Mobile UI Audit Report

**Date:** 2026-04-09  
**Auditor:** Claude (automated code review + visual inspection via Peekaboo)  
**Target:** https://admin.friday.mu (Friday GMS PWA)  
**Method:** Code review of all frontend components + desktop screenshots via Brave Browser  

**Limitation:** Peekaboo could not interact with web-page elements inside Brave (only native macOS UI). Playwright required authentication not available. Mobile viewport testing was done via code analysis of responsive CSS breakpoints and component logic. Desktop screenshots were captured successfully.

---

## Screenshots Reference

All screenshots saved to `audit-screenshots/`:
- `01-initial-load.png` — Initial desktop load with notification prompt + Keychain dialog
- `03-desktop-overview.png` — Desktop overview after dismissing Keychain dialog  
- `06-devtools-mobile.png` — Mobile responsive view via DevTools device toolbar (~428px)
- `09-desktop-full.png` — Full desktop view (1400x900)

---

## Issues Found

### ISSUE 1: DraftPanel action buttons wrap poorly on narrow mobile screens
- **Severity:** High
- **Screenshot:** `06-devtools-mobile.png` (bottom area)
- **Component:** `DraftPanel.tsx:122-144`
- **Description:** The DraftPanel action row uses `flex flex-wrap gap-2` with 5 buttons (Approve & Send, Revise, Ask Friday, Edit, Reject). On a 375px viewport, these buttons will wrap across 3+ lines, creating a very tall action area that pushes the message timeline out of view. The buttons all have `min-height: 44px` from the mobile CSS (`globals.css:357-359`), making the wrapped layout even taller.
- **Likely impact:** On small phones (iPhone SE, 375px), the draft panel with all action buttons expanded takes up most of the viewport, leaving little room for messages.

### ISSUE 2: ConsultChat (Ask Friday) maxHeight conflicts with DraftPanel maxHeight
- **Severity:** High  
- **Component:** `DraftPanel.tsx:80`, `ConsultChat.tsx:249`, `globals.css:322-324`
- **Description:** DraftPanel sets `maxHeight: consultDraftId ? '70vh' : '40vh'` when Ask Friday is active. ConsultChat's message area has `maxHeight: '40vh'` inline, but mobile CSS overrides it to `max-height: 25vh !important`. The DraftPanel itself can be 70vh. Combined with the CollapsibleMobilePanel wrapper, the draft body, action buttons, AND the Ask Friday chat all compete for vertical space. On mobile, the sum can easily exceed 100vh, causing the compose area and potentially the message timeline to be pushed entirely off-screen.
- **Likely impact:** When Ask Friday is open within the DraftPanel on mobile, the user may not be able to see the conversation messages or the compose area at all.

### ISSUE 3: Compose panel sticky positioning may fail when Ask Friday is open
- **Severity:** Medium
- **Component:** `globals.css:312-319`, `ComposePanel.tsx:93-112`
- **Description:** The mobile CSS makes `[data-testid="container-compose-panel"]` sticky at `bottom: 0` with `max-height: 70vh`. When the ConsultChat is opened inside ComposePanel, its content (chat messages + chips + reply input + action buttons) can exceed this max-height. The `overflow-y: auto` should handle this, but combined with the parent flex layout and the sticky positioning, this may cause the compose input to scroll out of view within its own container.
- **Likely impact:** After opening Ask Friday in compose mode and having a multi-turn conversation, the user may need to scroll within the compose panel to reach the text input.

### ISSUE 4: Search bar right-side buttons can overlap input text on narrow widths
- **Severity:** Medium
- **Component:** `ConversationList.tsx:130-160`
- **Description:** The search input has `pr-24` (96px right padding) to make room for the absolutely-positioned buttons (clear, refresh, filter). When all 3 buttons are visible simultaneously (search active + onRefresh provided + filter button), they occupy `3 * 28px = 84px` plus spacing. This fits within 96px. However, on mobile with the 44px min-height CSS rule (`globals.css:264`), the buttons get inflated to 44px tall while remaining 28px wide, creating an awkward visual where tall thin buttons sit inside the search area. The buttons are not constrained by `min-height: unset` like the stats bar buttons are (`globals.css:307-309`).
- **Likely impact:** Search bar buttons appear vertically oversized on mobile, though functionally they work. Visual inconsistency.

### ISSUE 5: NotificationPrompt banner overlaps conversation header on mobile
- **Severity:** Medium
- **Component:** `NotificationPrompt.tsx:36-96`
- **Description:** The notification prompt uses `position: fixed`, `top: 1rem`, `z-index: 9999`. On mobile, the header bar and conversation list start at the very top of the viewport. The notification banner at `top: 1rem` overlaps the header navigation bar and the first conversation item(s). There's no corresponding `padding-top` or `margin-top` on the main content to account for this overlay.
- **Likely impact:** First-time users (who haven't yet granted notification permission) will have the top of the conversation list obscured by the notification banner. The "Enable" and dismiss buttons may be hard to tap if they overlap with the header buttons. Visible in screenshots `01-initial-load.png` through `09-desktop-full.png`.

### ISSUE 6: DraftPanel edit mode textarea has no mobile max-height constraint
- **Severity:** Medium
- **Component:** `DraftPanel.tsx:101-102`
- **Description:** The edit mode textarea has `rows={4}` but no explicit `maxHeight` constraint. On mobile, if the draft body is long, the textarea can expand significantly. Unlike the compose textarea which has mobile CSS limiting it to `max-height: 80px` (`globals.css:328-329`), the draft edit textarea has no such constraint. Combined with the 44px min-height mobile CSS on textareas, this could push the "Save and Send" / "Cancel" buttons below the fold.
- **Likely impact:** When editing a long draft on mobile, the action buttons may not be visible without scrolling.

### ISSUE 7: CollapsibleMobilePanel collapse handle is only 28px tall — below 44px touch target
- **Severity:** Medium
- **Component:** `CollapsibleMobilePanel.tsx:72-73`
- **Description:** The collapse handle (drag indicator + chevron) has `height: 28` explicitly set. This is below the Apple HIG recommended 44px minimum touch target. While the global CSS sets `button { min-height: 44px }` on mobile, this element is a `div` with `onClick`, not a `button`, so the CSS rule doesn't apply.
- **Likely impact:** Users may have difficulty tapping the collapse handle to minimize the draft/compose panel on mobile.

### ISSUE 8: NotificationBell dropdown can overflow viewport on mobile
- **Severity:** Low
- **Component:** `NotificationBell.tsx:117-125`
- **Description:** The dropdown uses `width: 'min(380px, calc(100vw - 32px))'` and `position: absolute; right: 0; top: 100%`. On mobile, the bell icon is positioned in the header bar. Depending on the bell's horizontal position, the dropdown could extend beyond the left edge of the viewport. The dropdown has no `max-height` constraint for the overall container (only the inner list has `maxHeight: 400px`), and on shorter mobile screens the list could extend below the viewport.
- **Likely impact:** On mobile screens shorter than ~500px (rare but possible with keyboard open), the notification dropdown may not be fully visible.

### ISSUE 9: SendQueuePanel cancel button uses `confirm()` — poor UX on mobile PWA
- **Severity:** Low
- **Component:** `SendQueuePanel.tsx:96`, `ConversationDetail.tsx:451`
- **Description:** Both the SendQueuePanel cancel and the inline queued draft "Mark Failed" button use `confirm()` for confirmation. In a PWA context on mobile, `confirm()` dialogs look like system alerts and break the immersive app experience. The task description mentions "cancel button with confirmation (E3)" — this works but the UX is native-dialog-based rather than in-app.
- **Likely impact:** Functional but feels out of place in a PWA. Not a bug, but a UX polish opportunity.

### ISSUE 10: Revision input in DraftPanel uses `type="text"` with Enter-to-submit — no visual affordance
- **Severity:** Low
- **Component:** `DraftPanel.tsx:151-158`
- **Description:** The revision instruction input is a single-line `<input type="text">` that submits on Enter. On mobile, there's no hint that pressing Enter/Return will submit. The keyboard's return key shows "return" not "send" or "go". Users might expect to tap the "Revise" button instead.
- **Likely impact:** Minor discoverability issue for keyboard submission on mobile.

### ISSUE 11: ConsultChat reply textarea auto-grow may fight mobile max-height
- **Severity:** Low
- **Component:** `ConsultChat.tsx:140-145, 381-386`
- **Description:** The reply textarea auto-grows up to 96px (`maxHeight: '96px'`). On mobile, textareas get `min-height: 44px` from globals.css. The auto-grow logic (`adjustTextareaHeight`) sets height via JS inline style, which will override CSS. When the keyboard is open on mobile, the available viewport shrinks significantly. The chat messages container (`max-height: 25vh !important` on mobile) plus the expanding textarea may leave very little room for the conversation context.
- **Likely impact:** When typing a long reply in Ask Friday on mobile with keyboard open, earlier messages may be scrolled out of view.

---

## Feature-Specific Checks

### Notification Prompt (E1)
- **Status:** Working (visible in screenshots)
- **Issues:** Overlaps header content (Issue #5 above)
- **File:** `NotificationPrompt.tsx`

### Pull-to-Refresh (E4)
- **Status:** Code review confirms implementation looks correct
- **Notes:** Touch-based with 70px threshold, dampened to 50%, max 120px. Spinner visible during refresh. Only activates when `scrollTop <= 0`. Correctly guards against non-touch devices.
- **File:** `ConversationList.tsx:62-112`

### Sidebar Search Bar (E5)
- **Status:** Functional, minor visual issue on mobile (Issue #4)
- **Notes:** Search, clear, refresh, and filter buttons are properly positioned with `pr-24` padding. Filter count badge works.
- **File:** `ConversationList.tsx:128-161`

### Send Queue Panel (E3)
- **Status:** Functional with native `confirm()` dialogs (Issue #9)
- **Notes:** Cancel button present for queued items. Uses `z-[70]` for proper stacking. Has filter tabs, retry, and clear-all functionality.
- **File:** `SendQueuePanel.tsx`

### Rejected Messages in Timeline (F1)
- **Status:** Correctly implemented
- **Notes:** Red styling with `rgba(239,68,68,0.08)` background and `rgba(239,68,68,0.25)` border. "Rejected" badge shown. Rejection reason and reviewer displayed in footer. Chronologically ordered in unified timeline.
- **File:** `ConversationDetail.tsx:309-328`

### Notification Click Navigation (F3)
- **Status:** Correctly implemented
- **Notes:** `handleNotificationClick` sets `selectedConvId`, `activeTab` to 'all', `mobileView` to 'detail', fetches conversation detail, and marks as read. Both NotificationBell and NotificationPanel route through same handler.
- **File:** `page.tsx:179-197`

### Ask Friday Conversation Persistence (F6)
- **Status:** Implemented via session restore
- **Notes:** ConsultChat attempts to restore active session on mount via `/api/ai/consult/session/active`. Session is ended with history preservation on close via `/api/ai/consult/session/end`. However, the `active` prop controls visibility via `display: none` — when the panel is closed/reopened, the component may unmount and remount, triggering a fresh session restore.
- **File:** `ConsultChat.tsx:76-93`

### Ask Friday Continued Chat After Draft Suggestion (F7)
- **Status:** Implemented
- **Notes:** After receiving a draft update (`onDraftUpdate`), the chat remains active — the reply input is shown when `messages.length >= 2` regardless of draft update state. The `draftUpdated` notification badge appears temporarily but doesn't block the chat.
- **File:** `ConsultChat.tsx:378-394`

---

## Summary

| Severity | Count | Key Themes |
|----------|-------|------------|
| Critical | 0     | —          |
| High     | 2     | Draft panel button wrapping, Ask Friday viewport overflow on mobile |
| Medium   | 4     | Compose sticky issues, search bar button sizing, notification overlap, edit textarea unbounded |
| Low      | 5     | Touch targets, dropdown overflow, confirm() UX, revision input affordance, textarea auto-grow |

**Most impactful issues to fix first:**
1. Issue #2 (Ask Friday + DraftPanel height stacking) — can make the app unusable on mobile when reviewing drafts with Ask Friday
2. Issue #1 (DraftPanel button wrapping) — affects every mobile user reviewing drafts
3. Issue #5 (NotificationPrompt overlap) — affects all first-time users
