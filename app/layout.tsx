import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relay — AI-first CPaaS messaging console",
  description:
    "Unified SMS, Voice & RCS console with a built-in AI agent. Real Twilio integration, safe simulator mode by default.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
