"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Chat from "@/components/Chat";
import { getStatus, type Book } from "@/lib/api";

export default function Home() {
  const [ready, setReady] = useState(false);
  const [backendUp, setBackendUp] = useState(true);
  const [book, setBook] = useState<Book | null>(null);
  const [chatKey, setChatKey] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getStatus().then(setReady).catch(() => setBackendUp(false));
    try {
      const b = localStorage.getItem("rag:book");
      if (b) setBook(JSON.parse(b));
    } catch {}
  }, []);

  function handleUploaded(b: Book) {
    try {
      localStorage.setItem("rag:book", JSON.stringify(b));
      localStorage.removeItem("rag:chat");
    } catch {}
    setBook(b);
    setReady(true);
    setChatKey((k) => k + 1);
    setOpen(false);
  }

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100">
      <Sidebar ready={ready} backendUp={backendUp} book={book} open={open} onClose={() => setOpen(false)} onUploaded={handleUploaded} />
      <Chat key={chatKey} ready={ready} book={book} onMenu={() => setOpen(true)} />
    </div>
  );
}
