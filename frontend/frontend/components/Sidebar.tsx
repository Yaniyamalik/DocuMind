"use client";

import { useRef, useState } from "react";
import { BookOpen, Loader2, UploadCloud, X } from "lucide-react";
import { uploadPdf, type Book } from "@/lib/api";

type Props = {
  ready: boolean;
  backendUp: boolean;
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onUploaded: (b: Book) => void;
};

const STACK = ["FastAPI", "LangChain", "ChromaDB", "MiniLM-L6-v2", "Groq · Llama 3.1", "MMR retrieval"];

export default function Sidebar({ ready, backendUp, book, open, onClose, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(f?: File | null) {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".pdf")) return setError("Only PDF files are supported.");
    setError(null);
    setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      onUploaded(await uploadPdf(file));
      setFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  const status = !backendUp
    ? { dot: "bg-red-500", text: "Backend offline" }
    : ready
    ? { dot: "bg-emerald-500", text: "Knowledge base ready" }
    : { dot: "bg-amber-500", text: "No book indexed yet" };

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-80 flex-col gap-6 overflow-y-auto border-r border-neutral-800 bg-neutral-950 p-5 transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500"><BookOpen size={18} /></span>
              DocuMind 
            </div>
            <p className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
              <span className={`h-2 w-2 rounded-full ${status.dot}`} /> {status.text}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-neutral-400 hover:bg-neutral-800 md:hidden"><X size={18} /></button>
        </div>

        {book && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">Active book</p>
            <p className="mt-1 truncate text-sm font-medium" title={book.filename}>{book.filename}</p>
            <div className="mt-2 flex gap-2 text-xs text-neutral-400">
              <span className="rounded-md bg-neutral-800 px-2 py-0.5">{book.pages} pages</span>
              <span className="rounded-md bg-neutral-800 px-2 py-0.5">{book.chunks} chunks</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">{book ? "Replace book" : "Upload a book"}</p>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed p-5 text-center text-xs transition ${
              drag ? "border-indigo-400 bg-indigo-500/10" : "border-neutral-700 hover:border-neutral-500"
            }`}
          >
            <UploadCloud size={22} className="text-neutral-400" />
            <span className="text-neutral-400">{file ? file.name : "Drag & drop a PDF, or click to browse"}</span>
            <input ref={inputRef} type="file" accept="application/pdf" hidden onChange={(e) => pick(e.target.files?.[0])} />
          </div>
          <button
            onClick={handleUpload}
            disabled={!file || loading || !backendUp}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-40"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Indexing (chunk + embed)..." : "Build knowledge base"}
          </button>
          {error && <p className="rounded-lg bg-red-950/50 p-2 text-xs text-red-300">{error}</p>}
        </div>

        <div className="mt-auto">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-neutral-500">Built with</p>
          <div className="flex flex-wrap gap-1.5">
            {STACK.map((s) => (
              <span key={s} className="rounded-full border border-neutral-800 px-2.5 py-1 text-[11px] text-neutral-400">{s}</span>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
