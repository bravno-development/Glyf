# User Journey

An end-to-end walkthrough of the Glyf user experience — from first visit to
long-term mastery. For the underlying SM-2 algorithm, database tables, &
scheduling internals, see
[`user-journey-sm-2-srs.md`](./user-journey-sm-2-srs.md).

---

## 1. Overview

Glyf is an **offline-first** web app for learning writing systems (hiragana,
katakana, & more to come) using **SM-2 spaced repetition**. All learning state
lives in the browser's IndexedDB so you can study without a connection; progress
syncs to the server when online.

---

## 2. Authentication

Glyf uses **passwordless email login** — no password to remember.

1. **Enter email** — the user types their email on `/auth/login` and taps
   _Continue_.
2. **Receive a 6-digit code** — the server emails a one-time code (expires in 15
   minutes). The login page switches to a code-entry view.
3. **Enter code** — the user types the 6-digit code. On success the app stores a
   JWT token & user object in the client-side user store and redirects to the
   root (`/`).
4. **Magic-link fallback** — a clickable link in the same email hits
   `/auth/verify?token=…`, which auto-verifies & redirects straight to
   `/dashboard`.

If the user is already authenticated, protected routes redirect away from
`/auth/login` automatically. Unauthenticated users are bounced to `/auth/login`
from any protected route.

---

## 3. Onboarding

First-time users land on `/onboarding`, a **3-step flow**:

### Step 1 — Choose your script

A list of available writing systems (e.g. Japanese — Hiragana, 92 characters).
Unavailable scripts show a "Soon" badge and are disabled. The user taps a card
to select, then _Continue_.

### Step 2 — Set your pace

Three daily-goal options:

| Pace       | New chars/day | Approx. timeline (hiragana) |
| ---------- | ------------- | --------------------------- |
| Relaxed    | 5             | ~19 days                    |
| **Steady** | **10**        | **~10 days** (recommended)  |
| Intensive  | 15            | ~7 days                     |

A badge shows "Recommended" on the Steady option.

### Step 3 — Summary & start

A confirmation card recaps the chosen script, daily goal, & estimated timeline.
A tip reminds the user that short daily sessions beat long irregular ones. Tap
_Start learning_ to complete onboarding, which calls the server, records the
choice, & redirects to `/dashboard`.

A _Skip_ button on step 1 defaults to Hiragana w/ 10 chars/day.

Already-onboarded users who visit `/onboarding` are redirected to `/dashboard`.

---

## 4. Dashboard

The dashboard (`/dashboard`) is the home screen after onboarding.

### Script tabs

If the user is learning more than one script, pill-shaped tabs at the top let
them switch. All stats & grids below update for the selected script.

### Start Studying & Review buttons

Two primary actions at the top of the dashboard:

- **Start Studying** — Opens `/learn/[scriptId]` to introduce new glyphs (intro
  phase) and then quiz. Enabled only when there are unlearned glyphs and the
  daily study goal is not yet met. Disabled when the goal is met or all glyphs
  are learnt.
- **Review** — Opens `/learn/[scriptId]?mode=review` to skip intro and go
  straight to the quiz. Enabled when there are due items (Due Today > 0).
  Disabled when none are due.

### Stats cards

Three headline cards for the active script:

- **Characters Learnt** — total characters w/ at least one review
- **Review Accuracy** — percentage of correct responses
- **Due Today** — characters whose next review date is today or earlier

### Character grid

A visual grid of every character in the script. Each cell is colour-coded by
mastery level: New, Difficult, Learning, Good, or Mastered. A legend in the top
corner explains the colours.

### Mastery breakdown bar

A horizontal stacked bar showing how many characters fall into each mastery
bucket (Mastered, Good, Learning, Difficult, New) w/ counts beneath.

### Script progress sidebar

A list of all scripts the user is learning, each w/ a percentage progress bar.

### Upcoming reviews

A list of characters due for review soon, showing the character, its reading,
the current SM-2 interval in days, & how soon it's due.

### Weekly activity

A bar chart of daily review counts for the current week (Mon–Sun).

---

## 5. Study Session

Navigating to `/learn` shows a script-selection page. Tapping a script card
opens `/learn/[scriptId]`, which starts a study session. The same route serves
both learning (new glyphs) and review (due items).

### Daily study goal

The daily goal counts **new glyphs introduced today** — the intro batches only.
When the goal is met, the Start Studying button is disabled; the user may only
review until the next day. If all glyphs are learnt, the goal is irrelevant.

### Intro phase vs quiz phase

- **Intro phase** — Shown only when learning new glyphs (first-time). Characters
  are introduced in small batches (e.g. 5 at a time), capped by the daily goal.
- **Quiz phase** — Runs after the intro or when entering via **Review** on the
  dashboard. Same multi-choice flow in both cases.
- **Review mode** — When the user taps **Review** on the dashboard, the learn
  page opens with `?mode=review` and skips the intro, going straight to the
  quiz.

### Session flow

1. **Queue building** — the app loads due reviews (SM-2 `nextReview` in the
   past) and, for learning mode, up to 20 new cards from IndexedDB.
2. **Card display** — the current character is shown large & centred, w/ a
   progress counter (e.g. "3 / 12").
3. **Grading** — three buttons:
   - **Fail** (grade 0) — resets repetitions, interval → 1 day
   - **Pass** (grade 3) — advances the SM-2 schedule normally
   - **Easy** (grade 5) — advances w/ a larger interval boost
4. **SM-2 scheduling** — the app calls `calculateNextReview()` to compute the
   new ease factor, interval, & next review date, then writes the updated review
   record to IndexedDB.
5. **Attempt submission** — the attempt (correct/incorrect, response time) is
   sent to the server. If the request fails, the local state is preserved and
   sync will retry later.
6. **Session completion** — after the last card, the user is redirected to
   `/dashboard`.

If there are no cards to review & no new cards remaining, the session page shows
"No cards to review" w/ a link back to the dashboard.

---

## 6. Adding Another Script

At any time after onboarding, the user can visit `/learn` and pick a new script.
The app calls `seedCharacters()` to populate IndexedDB w/ the script's character
definitions. Each script's progress is tracked independently — separate review
records, separate stats, separate grid on the dashboard.

The dashboard's script tabs automatically include the new script once it has
data.

---

## 7. All Glyphs Learned but Not Yet Mastered

When the user has seen every character at least once:

- The script progress bar reaches **100%**.
- No new cards appear in the study queue — only due reviews.
- The character grid shows a mix of Learning, Good, & Mastered colours as
  different characters are at different SM-2 stages.
- The user continues reviewing daily. As recall improves, intervals grow and
  characters move from Learning → Good → Mastered.

---

## 8. All Glyphs at Perfect Recall (Mastered)

When every character has been reviewed successfully enough times for SM-2 to
assign long intervals (21+ days):

- The entire character grid turns green (Mastered).
- Reviews become very infrequent — only a handful per week or less.
- The dashboard still shows the script w/ 100% progress & mostly-empty "Upcoming
  Reviews".

**Gap:** There is no completion or celebration screen yet. The user simply sees
a fully green grid. See [Phase 2 roadmap](../agent-os/product/roadmap.md) for
the planned mastery celebration feature.

---

## 9. Restarting a Script

**Not yet implemented** — there is currently no way to reset SM-2 progress for a
script & start fresh. See [Phase 2 roadmap](../agent-os/product/roadmap.md).

---

## 10. Removing a Script

**Not yet implemented** — there is currently no way to remove a script from the
user's learning list. See [Phase 2 roadmap](../agent-os/product/roadmap.md).

---

## 11. Settings

The settings page (`/settings`) is a **placeholder** — it shows "Settings page
coming soon." and has no functional controls.

**Gap:** Daily goal cannot be changed post-onboarding. The onboarding pace-step
UI says "You can change this anytime in Settings", but the settings page doesn't
support it yet. See [Phase 2 roadmap](../agent-os/product/roadmap.md).

---

## 12. Offline & Sync

Glyf is designed to work fully offline.

- **IndexedDB is the source of truth** — all characters, reviews, & sync state
  are stored locally via Dexie.
- **Background sync every 5 minutes** — while the user is authenticated, the app
  uploads pending review changes to the server on a 5-minute interval
  (configured in the root `+layout.svelte`).
- **Sync on login** — when the user authenticates (or re-authenticates), a
  `syncFromServer()` call pulls the latest state from the server.
- **Last-write-wins** — if the server has newer data (based on `lastSync`
  timestamps), the server's reviews overwrite local ones; otherwise local
  changes are uploaded.
- **Graceful failure** — if sync fails (no connection, server error), it logs
  the error & retries on the next interval. Local study is never blocked.
