# Design Document — Reading Challenge App

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 14 (App Router) | File-based routing, RSC for fast loads, Vercel-native |
| Styling | Tailwind CSS + shadcn/ui | Mobile-first utilities, accessible headless components |
| Backend | Supabase | Auth (Google OAuth), Postgres, Realtime, Storage |
| Deployment | Vercel (linked to GitHub) | Zero-config Next.js, preview deployments per PR |
| Book data | Google Books API | Free, no key required for basic search |

---

## Repository Structure

```
reading-challenge/
├── app/                        # Next.js App Router
│   ├── (auth)/
│   │   └── login/page.tsx      # Google OAuth entry point
│   ├── (app)/                  # Authenticated shell
│   │   ├── layout.tsx          # Bottom nav, session guard
│   │   ├── page.tsx            # Home: personal card + leaderboards
│   │   ├── feed/page.tsx       # Activity feed tab
│   │   ├── library/page.tsx    # Personal book library
│   │   ├── log/page.tsx        # Log reading session flow
│   │   ├── challenges/
│   │   │   ├── new/page.tsx    # Create challenge
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # Challenge detail + full leaderboard
│   │   │       └── settings/page.tsx
│   │   └── profile/page.tsx    # User profile + penalty history
│   ├── join/[token]/page.tsx   # Public invite page (no auth required to view)
│   └── api/
│       └── books/route.ts      # Proxy for Google Books API search
├── components/
│   ├── ui/                     # shadcn primitives
│   ├── log-session-drawer.tsx  # Bottom sheet for logging
│   ├── book-search.tsx
│   ├── challenge-card.tsx
│   ├── leaderboard.tsx
│   ├── progress-ring.tsx
│   └── feed-item.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   └── server.ts           # Server-side Supabase client
│   ├── books.ts                # Google Books API wrapper
│   ├── pages-credit.ts         # Core page-credit calculation logic
│   └── penalty.ts              # Penalty calculation logic
└── supabase/
    └── migrations/             # SQL migration files
```

---

## Database Schema

### `profiles`
```sql
id          uuid PRIMARY KEY REFERENCES auth.users
display_name text NOT NULL
avatar_url  text
created_at  timestamptz DEFAULT now()
```

### `challenges`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
name            text NOT NULL
description     text
creator_id      uuid REFERENCES profiles(id)
daily_goal      int NOT NULL DEFAULT 5
weekly_goal     int NOT NULL DEFAULT 35
penalty_amount  numeric NOT NULL DEFAULT 10
penalty_currency text NOT NULL DEFAULT '₹'
carry_over      boolean NOT NULL DEFAULT false
invite_token    text UNIQUE NOT NULL
invite_active   boolean NOT NULL DEFAULT true
archived        boolean NOT NULL DEFAULT false
created_at      timestamptz DEFAULT now()
```

### `challenge_members`
```sql
challenge_id  uuid REFERENCES challenges(id)
user_id       uuid REFERENCES profiles(id)
joined_at     timestamptz DEFAULT now()
PRIMARY KEY (challenge_id, user_id)
```

### `books` (user's personal library)
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid REFERENCES profiles(id)
google_books_id text NOT NULL
title           text NOT NULL
authors         text[]
cover_url       text
total_pages     int
finished        boolean NOT NULL DEFAULT false
added_at        timestamptz DEFAULT now()
UNIQUE (user_id, google_books_id)
```

### `reading_sessions`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id       uuid REFERENCES profiles(id)
book_id       uuid REFERENCES books(id)
log_mode      text NOT NULL CHECK (log_mode IN ('cumulative', 'direct'))
page_position int     -- for cumulative mode: page number user is on
pages_read    int NOT NULL  -- computed at insert time, stored for fast queries
logged_at     timestamptz NOT NULL DEFAULT now()
created_at    timestamptz DEFAULT now()
```

### `challenge_session_credits`
```sql
session_id    uuid REFERENCES reading_sessions(id)
challenge_id  uuid REFERENCES challenges(id)
user_id       uuid REFERENCES profiles(id)
pages_credited int NOT NULL
week_start    date NOT NULL  -- ISO date of this user's rolling week start
PRIMARY KEY (session_id, challenge_id)
```

> **Why a junction table for credits?** A single session applies to all challenges the user is in. Storing credits per challenge per session makes weekly aggregation a simple GROUP BY and avoids recalculation.

### `feed_reactions`
```sql
session_id  uuid REFERENCES reading_sessions(id)
user_id     uuid REFERENCES profiles(id)
emoji       text NOT NULL
PRIMARY KEY (session_id, user_id)
```

---

## Key Logic

### Page Credit Calculation (`lib/pages-credit.ts`)

```
if log_mode == 'direct':
    pages_read = input_pages

if log_mode == 'cumulative':
    last_position = last reading_session for (user, book) where log_mode == 'cumulative'
    pages_read = max(0, input_page_position - last_position)
    -- if no prior cumulative log: pages_read = input_page_position
```

### Rolling Week Window

Each member's week is computed at query time:
```
week_number = floor((now() - joined_at) / 7 days)
week_start  = joined_at + week_number * 7 days
week_end    = week_start + 7 days
```

Pages this week = SUM(pages_credited) WHERE week_start = computed week_start AND challenge_id = X.

### Penalty Calculation (`lib/penalty.ts`)

```
pages_owed = max(0, weekly_goal - pages_this_week)
penalty    = pages_owed * penalty_amount
```

If carry_over is enabled:
```
surplus_last_week = max(0, pages_last_week - weekly_goal)
effective_goal    = max(0, weekly_goal - surplus_last_week)
pages_owed        = max(0, effective_goal - pages_this_week)
```

---

## API Routes

### `GET /api/books?q=<query>`
Proxies Google Books API. Returns: `[{ id, title, authors, coverUrl, pageCount }]`.
Rationale: proxying avoids exposing any future API key client-side and allows caching.

### Supabase RPC (Postgres functions)
- `get_my_week_summary(challenge_id, user_id)` → pages this week, goal, penalty, carry-over.
- `get_leaderboard(challenge_id)` → all members sorted by pages this week DESC.

All other data access uses Supabase's auto-generated REST/Realtime client.

---

## Row-Level Security (RLS) Policies

| Table | Read | Write |
|---|---|---|
| `profiles` | Any authenticated user | Own row only |
| `challenges` | Members + creator | Creator only |
| `challenge_members` | Members of same challenge | Self (join/leave); creator (remove) |
| `books` | Own rows only | Own rows only |
| `reading_sessions` | Members of shared challenges | Own rows only |
| `challenge_session_credits` | Members of that challenge | Insert on own session via server function |
| `feed_reactions` | Members of shared challenges | Own rows only |

---

## Visual Design System

### Design Philosophy

The app should feel like a cozy reading nook. Warm, calm, unhurried. No gamification chrome — no XP bars, badges, or confetti. The aesthetic reference is a well-loved literary app: soft illustrated depth, generous whitespace, and typography that feels like a book.

### Color Tokens

```css
/* Backgrounds — layered warm cream */
--color-bg-base:        #FAF7F2;   /* page background */
--color-bg-card:        #FFFFFF;   /* card surfaces */
--color-bg-subtle:      #F3EDE4;   /* section dividers, input fills */
--color-bg-warm:        #FDEEDE;   /* soft peach tint, highlight areas */

/* Accent — deep burgundy/wine */
--color-accent:         #7B3B52;   /* primary CTA, active nav, progress arc */
--color-accent-light:   #F2E5E9;   /* accent backgrounds, pill tags */

/* Penalty tone — muted amber, not red */
--color-penalty:        #B45309;   /* penalty amount text */
--color-penalty-bg:     #FEF3C7;   /* penalty chip background */

/* Text */
--color-text-primary:   #1C1309;   /* headings, numbers */
--color-text-secondary: #6B5B4E;   /* labels, captions */
--color-text-muted:     #A89080;   /* placeholders, timestamps */

/* Border */
--color-border:         #EDE4D9;   /* card borders, dividers */
--color-border-strong:  #D4C4B4;   /* inputs, focused states */
```

### Typography

```css
/* Display / headings — literary feel */
font-family: 'Lora', Georgia, serif;          /* h1–h3, challenge names, hero text */

/* UI / body — clean and readable */
font-family: 'Inter', system-ui, sans-serif;  /* body, labels, numbers, captions */
```

Scale:
- `text-2xl` (24px) Lora 600 — screen titles, progress number
- `text-lg` (18px) Lora 500 — card headings, challenge names
- `text-sm` (14px) Inter 400 — body, feed text
- `text-xs` (12px) Inter 400 — timestamps, captions, labels

### Elevation / Shadow

Cards use a single warm, low-opacity shadow — no dark or blue-tinted shadows:
```css
--shadow-card: 0 2px 12px rgba(100, 60, 30, 0.07);
--shadow-drawer: 0 -4px 24px rgba(100, 60, 30, 0.10);  /* bottom sheet */
```

No `border-radius` larger than `16px`. Cards: `12px`. Buttons: `10px`. Inputs: `10px`.

### Progress Visualization — Page Strip

Weekly progress uses a **large hero number + page strip**, not an arc or ring.

**Hero number:**
- The pages-read count is displayed in Lora 64px, color `--color-text-primary`
- "pages read this week" in Inter 12px muted below it
- Goal ("of 35 pages"), days remaining, and penalty chip sit to the right

**Page strip:**
- A row of 35 small vertical rectangles (one per page goal), rendered via JS
- Read pages: `height: 28px`, color `--color-accent` (`#7B3B52`)
- Current page (last read): `height: 20px`, color `#C4919F` (lighter burgundy)
- Unread pages: `height: 16px`, color `--color-bg-subtle` (`#F0EAE3`)
- Milestone labels below at 0, 7, 14, 21, 35
- On goal completion: all marks fill to accent, a muted sage green (`#4A7C59`) variant is used

### Iconography

- Navigation icons: minimal line icons (Lucide React), 22px, `stroke-width: 1.5`
- Decorative / empty states: soft illustrated 3D-style icons — use the Phosphor "Duotone" set in warm tones, or custom SVG illustrations
- Book covers are the primary visual element — they provide all the color variety needed

### Bottom Navigation

Minimal, icon + label. Active tab uses `--color-accent` for icon and a 2px bottom indicator dot, not a filled background.

```
Home        Feed        Library     Profile
[icon ·]    [icon]      [icon]      [icon]
```

### Floating Log Button

Not a standard FAB circle. Styled as a warm pill button: `"+ Log session"`, burgundy fill, Lora text, centered above bottom nav. Width: `160px`.

---

## UI / UX Design

### Mobile-First Layout

Bottom navigation bar (4 tabs):
```
[Home]  [Feed]  [Library]  [Profile]
```

Floating "Log session" pill — pinned above bottom nav on every screen.

### Home Screen Layout

Everything fits in one screen — no scroll needed on the home tab.

```
┌──────────────────────────────┐
│  Sunday, June 22   [Inter xs] │  ← date, muted
│  Your reading corner [Lora italic] │
├──────────────────────────────┤
│  ┌────────────────────────┐  │
│  │  22          of 35 pg  │  │  ← 64px Lora number, meta right
│  │  pages read   4 days   │  │
│  │  this week   [₹130 risk│  │  ← penalty chip, amber
│  │                         │  │
│  │  ████████░░░░░░░░░░░░  │  │  ← page strip (35 marks)
│  │  0    7    14   21  35  │  │  ← milestone labels
│  └────────────────────────┘  │
│                               │
│  Reading now   [section label]│
│  [📗 Atomic Habits  p.142]    │  ← horizontal book chips
│  [📘 Meditations    p.67 ]    │
│                               │
│  My challenges [section label]│
│  ┌────────────────────────┐  │
│  │  Book Club — Jan 2026  │  │  ← challenge card
│  │  Abhinav [████░] 35 done│ │  ← thin inline bar
│  │  Priya   [███░░] 28 ₹70│ │
│  │  Rohan   [█░░░░] 12 ₹230│ │
│  └────────────────────────┘  │
│                               │
│      [ + Log session ]        │  ← burgundy pill, Lora
│  ──────────────────────────   │
│  Home   Feed  Library Profile │  ← bottom nav
└──────────────────────────────┘
```

### Log Session — Bottom Sheet (3 steps)

Opens as a bottom sheet (rounded top corners, warm shadow above). Draggable to dismiss.

**Step 1 — Pick a book:**
- Header: "What did you read?" (Lora)
- Search input at top (Inter, warm fill)
- Grid of book covers (2 per row) from library — covers are prominent, title below in small Inter
- "Add a new book →" link at bottom

**Step 2 — Enter pages:**
- Header: "How far did you get?" (Lora)
- Two pill toggles: `I'm on page` / `Pages I read`
- Large centered number input (Lora 40px, auto-focus)
- Live preview below: "That's +18 pages towards your goals" (muted Inter)

**Step 3 — Confirm:**
- Minimal summary: book cover thumbnail, "+18 pages", "Added to 2 challenges"
- Large "Log it" button (burgundy, full-width, Lora)

### Feed Screen

Each feed item is a card with warm background, generous padding:

```
┌───────────────────────────────┐
│  [Avatar]  Priya              │  ← avatar 32px circle
│            2 hours ago        │  ← Inter xs, muted
│                               │
│  [cover]  read 30 pages of    │  ← cover 48×64px
│           Atomic Habits       │  ← Lora sm, book title
│           by James Clear      │  ← Inter xs, muted
│                               │
│  👏 3   🔥 1   📚 0           │  ← reaction row, tap to toggle
└───────────────────────────────┘
```

No dividers between cards — spacing creates the separation.

### Invite / Join Page (public, no auth needed)

Warm illustrated hero with challenge name in large Lora type, creator avatar, and challenge rules laid out in a clean card. Single CTA: "Join this challenge →". If not logged in, tapping CTA triggers Google sign-in and redirects back.

### Empty States

Each empty state has a small warm illustration and a short Lora sentence:
- No challenges yet: "Start a challenge with friends"
- No books in library: "Add your first book to get started"
- Empty feed: "The story begins when someone logs a session"

---

## Deployment Pipeline

```
GitHub main branch
       │
       ▼
   Vercel (production)
       │── vercel.json (env vars from Vercel dashboard)
       │── NEXT_PUBLIC_SUPABASE_URL
       └── NEXT_PUBLIC_SUPABASE_ANON_KEY

GitHub PR branch
       │
       ▼
   Vercel Preview URL (per PR, auto-generated)
```

Supabase migrations run manually via `supabase db push` or through the Supabase dashboard. In v2, add a GitHub Action to run migrations on merge to main.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-side only, never exposed to client
```

---

## Open Questions / Future v2

- **Notifications**: Push via Supabase Edge Functions + web push API — notify when week is ending and user is short.
- **Streak tracking**: Consecutive weeks hitting goal.
- **Payment integration**: UPI QR code per week for penalty settlement.
- **Challenge templates**: Pre-configured challenge types (5/35, 10/70, etc.).
- **Group chat**: Basic thread per challenge.
