import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAG Book Assistant",
  description: "Chat with your PDF books",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
