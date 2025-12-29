import type { Metadata } from "next";
import "./globals.css";
import Layout from "@/components/shared/Layout";

export const metadata: Metadata = {
  title: "scope - Prediction Markets Intelligence Dashboard",
  description: "Real-time edge for prediction markets traders. Track new markets, whale trades, arbitrage opportunities, and get AI-powered market context.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}

