import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sentriq Protocol | Web3 Security AI Agent",
  description: "AI-Powered Smart Contract & Wallet Security on Flare Blockchain",
  icons: {
    icon: [
      { url: "/goldlogo.png", href: "/goldlogo.png" },
      { url: "/icon.png", href: "/icon.png" }
    ],
    shortcut: "/goldlogo.png",
    apple: "/goldlogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="icon" href="/goldlogo.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/goldlogo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/goldlogo.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
