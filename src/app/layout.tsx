import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roto",
  description: "Roto AI Research Mentor for International School Research",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
