# Product Requirements Document — Reading Challenge App

## Overview

A mobile-first web app where friend groups create reading challenges, log reading sessions, and track each other's progress and penalty exposure in real time.

---

## Problem Statement

Reading accountability groups lack a dedicated, low-friction tool. Tracking pages in spreadsheets is clunky and doesn't surface penalties, streaks, or social progress in an engaging way.

---

## Goals

- Make logging a reading session take under 10 seconds on mobile.
- Give each member instant visibility into their own penalty exposure and the group's progress.
- Support multiple simultaneous challenges per user, with configurable rules per challenge.

---

## Users

- **Challenge creators** — set up the challenge rules and invite friends.
- **Participants** — join via invite link, log reading sessions, view progress.

Both roles are the same user type; anyone can be a creator and a participant simultaneously.

---

## Authentication

- Google OAuth only (via Supabase Auth).
- No email/password. No magic links.
- On first login, user creates a profile (display name, avatar auto-pulled from Google).

---

## Core Concepts

### Challenge

A named reading challenge with configurable rules:

| Parameter | Default | Configurable? |
|---|---|---|
| Daily page goal | 5 pages | Yes |
| Weekly page goal | 35 pages (7 × daily) | Auto-computed, can override |
| Penalty per missed page | ₹10 | Yes (currency-agnostic) |
| Week type | Rolling 7-day | Yes |
| Surplus carry-over | Off | Yes, toggle per challenge |

**Week type — Rolling 7-day:** Each participant's week is a 7-day window starting from when they joined the challenge. Week resets are personal, not calendar-based.

**Surplus carry-over:** If enabled, pages read above the weekly goal roll over to reduce the next week's requirement. If disabled, surplus pages are discarded at week-end.

### Book Library (per user)

Each user maintains a personal library of books. Books are searched via Google Books API and saved to the user's library. A saved book stores: title, author(s), cover image URL, total page count, Google Books ID.

### Reading Session Log

A log entry records a single reading session. Inputs:
- Book (from personal library)
- Logging mode: **"I'm on page X"** (cumulative) OR **"I read N pages"** (direct count)
  - In cumulative mode: pages credited = current page − last logged page for that book in that challenge.
  - In direct mode: pages credited = N.
- Date/time (auto-filled as now, editable)

A session can contribute to multiple challenges simultaneously — any challenge the user is enrolled in at the time of logging receives credit for those pages.

---

## Features

### F1 — Challenge Creation

- Creator sets: name, description, daily goal, penalty amount, penalty currency symbol, surplus carry-over toggle.
- Weekly goal is auto-computed as daily × 7 but can be overridden.
- On creation, a unique invite link is generated (e.g., `app.com/join/[token]`).
- Creator can regenerate or disable the invite link.

### F2 — Joining a Challenge

- User visits invite link → sees challenge details and creator name.
- If not logged in, prompted to sign in with Google first, then redirected back.
- One tap to join. Week window starts from join date.

### F3 — Book Library

- Search by title or author → results from Google Books API.
- Tap a result to add to personal library: title, author, cover, page count are stored.
- User can edit page count (e.g., for a different edition).
- User can mark a book as "finished".
- Library is shared across all challenges the user is in.

### F4 — Reading Session Logging

- Entry point: prominent floating button on home screen ("+ Log").
- Step 1: Pick a book (search/filter personal library).
- Step 2: Choose mode — "I'm on page X" or "I read N pages today".
- Step 3: Enter the number. Page credit is calculated and shown inline.
- Step 4: Confirm. Pages are credited to all active challenges.
- The whole flow should complete in ≤ 3 taps + one number entry on mobile.

### F5 — Home Dashboard (Personal + Leaderboard)

**Personal card (top):**
- Pages read this week vs. weekly goal (ring or bar).
- Days remaining in current 7-day window.
- Current penalty exposure if week ended today (₹X).
- Carry-over surplus, if applicable.
- Books currently in progress (quick tap to log for them).

**Challenge leaderboard (per challenge, scrollable):**
- Each member's pages this week and % of goal.
- Penalty exposure next to each member.
- Sorted by pages read descending.
- Tap a challenge to expand the full leaderboard.

### F6 — Activity Feed (separate tab)

- Chronological feed of reading logs across all challenges the user is in.
- Each entry shows: user avatar, name, book cover, pages read, book title, time ago.
- Users can react with emoji (👏, 🔥, 📚) — one reaction type per log per user.
- No comments in v1.

### F7 — Challenge Settings Page

Accessible by challenge creator:
- Edit challenge name, description, goals, penalty, carry-over toggle.
- View and manage invite link.
- Remove members.
- Archive challenge (stops penalty calculation, read-only history).

### F8 — Penalty Summary

Visible per challenge at week-end and on the leaderboard:
- How many pages short each member is.
- Penalty in ₹ (or configured currency).
- Auto-calculated, display only — no payment flow in v1.
- Historical penalty ledger per member (past weeks) on their profile page.

---

## Visual Design Philosophy

The app should feel like a cozy reading nook, not a fitness tracker. The reference aesthetic is warm, calm, and literary — it should make users *want* to open it. Key principles:

- **Warm and unhurried**: cream and sand backgrounds, never stark white or dark grey. The app should feel like afternoon light through a window.
- **Serif for feeling, sans for function**: display headings use an elegant serif (Lora or Playfair Display). Body text, stats, and UI labels use a clean sans-serif (Inter).
- **Soft depth over flat UI**: cards have a very subtle warm shadow (`0 2px 12px rgba(0,0,0,0.06)`), not heavy drop shadows or harsh borders.
- **Muted, nature-inspired palette**: no bright primary colors. Accents are deep burgundy/wine. Backgrounds layer warm cream → soft peach. Greens and blues are desaturated.
- **Progress as quiet encouragement**: progress arcs are thin and elegant, not thick game-style rings. The number is the star, not the animation.
- **Illustrations over icons**: where possible, use soft 3D-style illustrated icons (book, quill, candle) in warm tones rather than flat icon sets. For UI actions, use minimal line icons only.
- **Generous whitespace**: sections breathe. Nothing feels cramped. Line heights are comfortable (1.6+).
- **Penalties are shown gently**: penalty exposure uses muted warm amber tones, not red. The tone is "friendly accountability", not alarm.

---

## Out of Scope (v1)

- Push / email notifications.
- Payment integration.
- Comments on feed entries.
- Admin-approved joining.
- Public/discoverable challenges.
- PDF export / reports.
- Dark mode.

---

## Success Metrics

- Time to log a session: target ≤ 30 seconds end-to-end.
- Weekly retention: % of users who log at least once per week.
- Challenge completion rate: % of members hitting their weekly goal.
