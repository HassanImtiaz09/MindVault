import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "DocVault — AI-Powered Medical Memory Assistant",
    template: "%s | DocVault",
  },
  description:
    "Capture, organise, and recall medical knowledge effortlessly. AI-powered memory assistant for healthcare professionals and medical students.",
  metadataBase: new URL("https://docvault.uk"),
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "DocVault",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans bg-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
