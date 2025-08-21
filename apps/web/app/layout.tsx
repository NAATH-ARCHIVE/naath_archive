import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Naath Archive",
  description: "A Legacy of Culture, A Treasure for All.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="w-full border-b border-[color:var(--naath-bronze)]/40">
          <div className="mx-auto max-w-6xl px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="naath-logo text-2xl md:text-3xl font-semibold text-[color:var(--naath-blue)] tracking-wide">
                  NAATH ARCHIVE
                </h1>
                <div className="naath-underline w-40 mt-2" />
                <p className="mt-2 text-sm text-[color:var(--naath-blue)]/80">
                  A Legacy of Culture, A Treasure for All.
                </p>
              </div>
            </div>
            <NavBar />
          </div>
        </header>
        <Providers>
          {children}
        </Providers>
        <Footer />
      </body>
    </html>
  );
}
