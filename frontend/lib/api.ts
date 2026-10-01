export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Source = { content: string; page: number; source?: string };
export type Message = {
  id: string;
  role: "user" | "ai";
  text: string;
  time: number;
  ms?: number;
  sources?: Source[];
  error?: boolean;
};
export type Book = { filename: string; pages: number; chunks: number };

async function parse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail ?? `Request failed (${res.status})`);
  return data;
}

export async function getStatus(): Promise<boolean> {
  const data = await parse(await fetch(`${API}/status`));
  return data.ready;
}

export async function uploadPdf(file: File): Promise<Book> {
  const form = new FormData();
  form.append("file", file);
  return parse(await fetch(`${API}/upload`, { method: "POST", body: form }));
}

export async function askQuestion(question: string): Promise<{ answer: string; sources: Source[] }> {
  return parse(
    await fetch(`${API}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    })
  );
}
