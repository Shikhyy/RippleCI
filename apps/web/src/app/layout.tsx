import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RippleCI — Graph-Native Release Intelligence",
  description: "Understand the blast radius of code changes, prioritize regression tests, and verify releases with FalkorDB.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090D16] text-[#F3F4F6] antialiased selection:bg-blue-600/30 selection:text-blue-200">
        {children}
      </body>
    </html>
  );
}
