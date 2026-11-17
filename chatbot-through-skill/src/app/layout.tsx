import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import HelloChat from "@/components/HelloChat";
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
  title: "Stockwise — Inventory made simple",
  description: "Demo site with a live MSG91 Hello chat widget.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <HelloChat />
      </body>
    </html>
  );
}
