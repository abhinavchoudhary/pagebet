import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  primaryKey,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ── NextAuth tables ────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ── App tables ─────────────────────────────────────────────────────

export const challenges = pgTable("challenges", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  creatorId: text("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dailyGoal: integer("daily_goal").notNull().default(5),
  weeklyGoal: integer("weekly_goal").notNull().default(35),
  penaltyAmount: numeric("penalty_amount").notNull().default("10"),
  penaltyCurrency: text("penalty_currency").notNull().default("₹"),
  carryOver: boolean("carry_over").notNull().default(false),
  inviteToken: text("invite_token").unique().notNull(),
  inviteActive: boolean("invite_active").notNull().default(true),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const challengeMembers = pgTable(
  "challenge_members",
  {
    challengeId: text("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (cm) => [primaryKey({ columns: [cm.challengeId, cm.userId] })]
);

export const books = pgTable(
  "books",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    googleBooksId: text("google_books_id").notNull(),
    title: text("title").notNull(),
    authors: text("authors").array(),
    coverUrl: text("cover_url"),
    totalPages: integer("total_pages"),
    finished: boolean("finished").notNull().default(false),
    addedAt: timestamp("added_at").notNull().defaultNow(),
  },
  (b) => [uniqueIndex("books_user_google_idx").on(b.userId, b.googleBooksId)]
);

export const readingSessions = pgTable("reading_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bookId: text("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  logMode: text("log_mode", { enum: ["cumulative", "direct"] }).notNull(),
  pagePosition: integer("page_position"),
  pagesRead: integer("pages_read").notNull(),
  loggedAt: timestamp("logged_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const challengeSessionCredits = pgTable(
  "challenge_session_credits",
  {
    sessionId: text("session_id")
      .notNull()
      .references(() => readingSessions.id, { onDelete: "cascade" }),
    challengeId: text("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pagesCredited: integer("pages_credited").notNull(),
    weekStart: date("week_start").notNull(),
  },
  (csc) => [primaryKey({ columns: [csc.sessionId, csc.challengeId] })]
);

export const feedReactions = pgTable(
  "feed_reactions",
  {
    sessionId: text("session_id")
      .notNull()
      .references(() => readingSessions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
  },
  (fr) => [primaryKey({ columns: [fr.sessionId, fr.userId] })]
);
