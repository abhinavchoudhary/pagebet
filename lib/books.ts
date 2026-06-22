export interface BookResult {
  id: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  pageCount: number | null;
}

export async function searchBooks(query: string): Promise<BookResult[]> {
  const res = await fetch(`/api/books?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return res.json();
}
