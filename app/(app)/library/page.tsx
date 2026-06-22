import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AddBookButton } from "@/components/add-book-button";

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: books } = await supabase
    .from("books")
    .select("*")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  const reading = (books ?? []).filter((b) => !b.finished);
  const finished = (books ?? []).filter((b) => b.finished);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          My Library
        </h1>
        <AddBookButton userId={user.id} />
      </div>

      {books?.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <span className="text-4xl">📚</span>
          <p className="font-serif text-lg text-center" style={{ color: "var(--text-secondary)" }}>
            Add your first book to get started
          </p>
        </div>
      ) : (
        <>
          {reading.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                Reading now
              </p>
              <div className="grid grid-cols-3 gap-3">
                {reading.map((book) => (
                  <BookTile key={book.id} book={book} />
                ))}
              </div>
            </div>
          )}

          {finished.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                Finished
              </p>
              <div className="grid grid-cols-3 gap-3 opacity-60">
                {finished.map((book) => (
                  <BookTile key={book.id} book={book} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BookTile({ book }: { book: Record<string, unknown> }) {
  return (
    <div className="flex flex-col gap-1.5">
      {book.cover_url ? (
        <img
          src={book.cover_url as string}
          alt={book.title as string}
          className="w-full rounded-[8px] object-cover shadow-sm"
          style={{ aspectRatio: "2/3" }}
        />
      ) : (
        <div
          className="w-full rounded-[8px] flex items-center justify-center"
          style={{
            aspectRatio: "2/3",
            backgroundColor: "var(--app-accent-light)",
          }}
        >
          <span className="text-2xl">📖</span>
        </div>
      )}
      <p className="text-xs leading-tight line-clamp-2" style={{ color: "var(--text-secondary)" }}>
        {book.title as string}
      </p>
    </div>
  );
}
