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
current_page    int NOT NULL DEFAULT 0   -- reader's current position; maintained by recomputeBookProgress() + updateBookProgress()
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

## Visual Design System — "Warm Material You"

The UI is built on **Material Design 3** foundations (token system, elevation,
shape scale, motion, M3 components) while keeping Pagebet's cozy, literary
identity: the palette is **seeded from amber `#c8913a`**, and display type stays
**Newsreader** (serif). Interaction craft follows **Emil Kowalski's principles**
(emilkowal.ski/ui). The app ships **light + dark** themes.

### Token layer — `app/globals.css`

All colour, shape, elevation and motion values are CSS custom properties. Nothing
in components should hard-code a hex value.

**Colour** — hand-authored warm tonal ramps (`--md-ref-*`, tones 10–99) resolve
into M3 **system roles** (`--md-sys-color-*`): `primary`, `on-primary`,
`primary-container`, `secondary`, `tertiary` (a soft sage — success / on-track),
`error`, `surface`, `surface-container{,-low,-high,-highest}`, `on-surface`,
`on-surface-variant`, `outline`, `outline-variant`, `inverse-surface`, …
Light values sit on bare `:root`; dark values are redefined under both
`@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and
`:root[data-theme="dark"]` so the manual toggle wins in either direction.

**Shape** — `--md-sys-shape-corner-{none,xs,sm,md,lg,xl,full}` = 0/4/8/12/16/28/full.
Exposed to Tailwind as `rounded-corner-{xs…full}`.

**Elevation** — `--md-sys-elevation-{0-5}` warm-tinted shadows; utilities
`.md-elevation-{0-5}`.

**Motion** — `--md-sys-motion-easing-*` (standard / emphasized / …) plus
`--ease-out-expo` / `--ease-out-quart` for enters. Duration tokens
`--md-sys-motion-duration-{short,medium}-{1-4}` (50–400 ms). A global
`prefers-reduced-motion` block zeroes every animation/transition.

**Typography roles** — `.md-display-{large,medium,small}`, `.md-headline-*`,
`.md-title-*`, `.md-body-*`, `.md-label-*` (+ `.md-label-overline`). Display /
headline / title-large = Newsreader; everything else = Inter.

**Tailwind bridge** — `@theme inline` maps the M3 roles to Tailwind colour
utilities (`bg-surface-container`, `text-on-surface-variant`,
`bg-primary-container`, `border-outline`, …) and keeps the shadcn `--*` aliases
pointing at the same roles. Legacy app tokens (`--espresso`, `--cream`,
`--text-primary`, …) are aliased to M3 roles for backward compatibility.

### Emil Kowalski interaction principles (applied)

| Principle | Where |
|---|---|
| `scale(0.97)` on `:active` | global rule in `globals.css` for every `button` / `[role=button]` |
| Never animate from `scale(0)` — start ≥ 0.96 | `@keyframes md-enter` (`.96 → 1`), `.md-blur-in` (`.98 → 1`) |
| Custom easing, not CSS built-ins | all transitions use `--md-sys-motion-easing-*` / `--ease-out-*` |
| `ease-out` for enter/exit | drawer steps, menus, toasts |
| Keep animations < 300 ms, off high-frequency actions | duration tokens cap at 400 ms; reactions/nav use `short-*` |
| Blur to bridge awkward state changes | `.md-blur-in` on the log-session step transition; drawer overlay `backdrop-blur` |
| Respect `prefers-reduced-motion` | global override block |

**Sonner** (Emil's toast library, `components/ui/toaster.tsx` + `lib/toast.ts`)
handles success / error / **undo** feedback — e.g. deleting a reading log shows
an Undo toast that re-inserts the session.

### Component primitives — `components/ui/`

`button` (filled / tonal / elevated / outlined / text / filled-tertiary / danger
/ fab), `card` (filled / elevated / outlined), `chip`, `linear-progress`,
`circular-progress`, `text-field` (filled + floating label), `switch`,
`segmented-button`, `top-app-bar`, `list-item`, `toaster`. `state-layer` behaviour
comes from the `.md-state-layer` utility (hover / focus / pressed overlay).

`components/bottom-nav.tsx` is the M3 navigation bar (animated pill indicator,
transform/opacity only).

### Theming

`components/theme-provider.tsx` exposes `useTheme()` (`pref`: light | dark |
system, `resolved`, `setPref`) via `useSyncExternalStore` (no hydration
mismatch). Preference persists to `localStorage` (`pagebet-theme`); an inline
`beforeInteractive` script (`lib/theme.ts` → `NO_FLASH_SCRIPT`) sets
`data-theme` before first paint. `components/theme-toggle.tsx` (a segmented
button) lives on the Profile screen.

### Progress visualisation

Weekly goal progress uses the M3 hero number + `LinearProgress`. Per-book
reading progress uses `CircularProgress` (book detail page) and `LinearProgress`
(Library tiles, Home "Reading now" rail, Feed cards, Profile). The computation
lives in `lib/book-progress.ts` (`bookProgress()`), the single source of truth.

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
