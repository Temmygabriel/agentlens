import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AgentLens — Discover BNB AI Agents",
  description: "Discover, compare, and verify AI agents on BNB Smart Chain.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
