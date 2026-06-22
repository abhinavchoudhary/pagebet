import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.trim().length === 0) {
    return NextResponse.json([]);
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const keyParam = apiKey ? `&key=${apiKey}` : "";
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=12&printType=books${keyParam}`;
  const res = await fetch(url, { next: { revalidate: 300 } });

  if (!res.ok) {
    return NextResponse.json([], { status: 200 });
  }

  const data = await res.json();
  const items = data.items ?? [];

  const books = items.map((item: Record<string, unknown>) => {
    const info = (item.volumeInfo ?? {}) as Record<string, unknown>;
    const imageLinks = (info.imageLinks ?? {}) as Record<string, string>;
    const cover =
      imageLinks.thumbnail?.replace("http://", "https://") ?? null;

    return {
      id: item.id as string,
      title: (info.title as string) ?? "Untitled",
      authors: (info.authors as string[]) ?? [],
      coverUrl: cover,
      pageCount: (info.pageCount as number) ?? null,
    };
  });

  return NextResponse.json(books);
}
