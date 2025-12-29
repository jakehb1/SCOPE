import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "scope - Track Polymarket deals in real time",
  description: "Track newly created Polymarket deals in real time. Get needed data like end date, liquidity, volume, and links - all inside Telegram.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

