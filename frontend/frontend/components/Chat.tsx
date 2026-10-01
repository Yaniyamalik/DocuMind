"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Menu, Send, Sparkles, Trash2 } from "lucide-react";
import MessageBubble from "@/components/MessageBubble";
import { askQuestion, type Book, type Message } from "@/lib/api";

const SUGGESTIONS = [
  "Give me a short summary of this book",
  "What are the main topics covered?",
  "List the key definitions or terms",
  "What are the important takeaways?",
];

type Props = { ready: boolean; book: Book | null; onMenu: () => void };

export default function Chat({ ready, book, onMenu }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rag:chat");
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem("rag:chat", JSON.stringify(messages)); } catch {}
  }, [messages, hydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const question = (text ?? input).trim();
    if (!question || loading || !ready) return;
    const t0 = Date.now();
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text: question, time: t0 }]);
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    setLoading(true);
    try {
      const r = await askQuestion(question);
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "ai", text: r.answer, sources: r.sources, time: Date.now(), ms: Date.now() - t0 },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "ai", text: e instanceof Error ? e.message : "Something went wrong", time: Date.now(), error: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={onMenu} className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-800 md:hidden"><Menu size={20} /></button>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Ask your book</h2>
            <p className="truncate text-xs text-neutral-500">{book ? book.filename : "No book selected"}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-neutral-400 hover:bg-neutral-800"
          >
            <Trash2 size={14} /> Clear chat
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {hydrated && messages.length === 0 && (
            <div className="mt-16 flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300"><Sparkles size={26} /></div>
              <h3 className="mt-4 text-lg font-semibold">{ready ? "What do you want to know?" : "Upload a PDF to get started"}</h3>
              <p className="mt-1 max-w-sm text-sm text-neutral-500">
                Answers are grounded in your document, with the source pages shown for every reply.
              </p>
              {ready && (
                <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-xl border border-neutral-800 p-3 text-left text-sm text-neutral-300 transition hover:border-indigo-500/50 hover:bg-neutral-900"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((m) => <MessageBubble key={m.id} m={m} />)}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800"><Bot size={16} /></div>
              <div className="flex gap-1 rounded-2xl bg-neutral-900 px-4 py-4">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-neutral-800 p-4">
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-neutral-700 bg-neutral-900 p-2 focus-within:border-indigo-500/60">
          <textarea
            ref={taRef}
            rows={1}
            value={input}
            disabled={!ready}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={ready ? "Ask a question about your book..." : "Upload a PDF first"}
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none disabled:opacity-50"
          />
          <button
            onClick={() => send()}
            disabled={!ready || loading || !input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-white transition hover:bg-indigo-400 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-neutral-600">Enter to send · Shift+Enter for a new line</p>
      </div>
    </main>
  );
}
