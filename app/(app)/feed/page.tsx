import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FeedItem } from "@/components/feed-item";

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("challenge_members")
    .select("challenge_id")
    .eq("user_id", user.id);

  const challengeIds = (memberships ?? []).map((m) => m.challenge_id);

  if (challengeIds.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <span className="text-4xl">📖</span>
        <p className="font-serif text-lg text-center" style={{ color: "var(--text-secondary)" }}>
          The story begins when someone logs a session
        </p>
      </div>
    );
  }

  const { data: memberUserIds } = await supabase
    .from("challenge_members")
    .select("user_id")
    .in("challenge_id", challengeIds);

  const userIds = [...new Set((memberUserIds ?? []).map((m) => m.user_id))];

  const { data: sessions } = await supabase
    .from("reading_sessions")
    .select("*, books(*), profiles(*)")
    .in("user_id", userIds)
    .order("logged_at", { ascending: false })
    .limit(50);

  const sessionIds = (sessions ?? []).map((s) => s.id);

  const { data: allReactions } = await supabase
    .from("feed_reactions")
    .select("*")
    .in("session_id", sessionIds);

  const reactionsBySession: Record<string, Record<string, number>> = {};
  const myReactionBySession: Record<string, string | null> = {};

  for (const r of allReactions ?? []) {
    if (!reactionsBySession[r.session_id]) reactionsBySession[r.session_id] = {};
    reactionsBySession[r.session_id][r.emoji] = (reactionsBySession[r.session_id][r.emoji] ?? 0) + 1;
    if (r.user_id === user.id) myReactionBySession[r.session_id] = r.emoji;
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-serif text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
        Activity
      </h1>

      {(sessions ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <span className="text-4xl">📖</span>
          <p className="font-serif text-lg text-center" style={{ color: "var(--text-secondary)" }}>
            The story begins when someone logs a session
          </p>
        </div>
      ) : (
        (sessions ?? []).map((session) => {
          const book = session.books as Record<string, unknown>;
          const profile = session.profiles as Record<string, unknown>;
          return (
            <FeedItem
              key={session.id}
              sessionId={session.id}
              userId={session.user_id}
              userName={(profile?.display_name as string) ?? "Reader"}
              avatarUrl={(profile?.avatar_url as string) ?? null}
              bookTitle={(book?.title as string) ?? "Unknown book"}
              bookCoverUrl={(book?.cover_url as string) ?? null}
              bookAuthor={(book?.authors as string[])?.[0] ?? null}
              pagesRead={session.pages_read}
              loggedAt={session.logged_at}
              reactions={reactionsBySession[session.id] ?? {}}
              myReaction={myReactionBySession[session.id] ?? null}
              currentUserId={user.id}
            />
          );
        })
      )}
    </div>
  );
}
