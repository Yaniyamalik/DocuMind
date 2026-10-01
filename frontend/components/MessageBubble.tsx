"use client";

import { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Bot, Check, ChevronDown, Copy, FileText, User } from "lucide-react";
import type { Message } from "@/lib/api";

const md: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 ml-5 list-disc space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 ml-5 list-decimal space-y-1">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  code: ({ children }) => <code className="rounded bg-neutral-800 px-1 py-0.5 text-xs">{children}</code>,
};

export default function MessageBubble({ m }: { m: Message }) {
  const [copied, setCopied] = useState(false);
  const [showSrc, setShowSrc] = useState(false);
  const isUser = m.role === "user";

  function copy() {
    navigator.clipboard.writeText(m.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isUser ? "bg-indigo-500" : "bg-neutral-800"}`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className={`flex min-w-0 max-w-[85%] flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser ? "bg-indigo-500 text-white" : m.error ? "border border-red-900 bg-red-950/40 text-red-200" : "bg-neutral-900"
          }`}
        >
          {isUser ? <p className="whitespace-pre-wrap">{m.text}</p> : <ReactMarkdown components={md}>{m.text}</ReactMarkdown>}
        </div>

        <div className="flex items-center gap-3 px-1 text-[11px] text-neutral-500">
          <span>{new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          {m.ms && <span>{(m.ms / 1000).toFixed(1)}s</span>}
          {!isUser && !m.error && (
            <button onClick={copy} className="flex items-center gap-1 hover:text-neutral-300">
              {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
            </button>
          )}
          {m.sources && m.sources.length > 0 && (
            <button onClick={() => setShowSrc((s) => !s)} className="flex items-center gap-1 hover:text-neutral-300">
              <FileText size={12} /> {m.sources.length} sources
              <ChevronDown size={12} className={`transition ${showSrc ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>

        {showSrc && m.sources && (
          <div className="flex w-full flex-col gap-2">
            {m.sources.map((s, i) => (
              <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-neutral-400">
                <span className="mb-1.5 inline-block rounded-md bg-indigo-500/15 px-2 py-0.5 font-medium text-indigo-300">
                  Page {s.page}
                </span>
                <p className="max-h-32 overflow-y-auto whitespace-pre-wrap">{s.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
