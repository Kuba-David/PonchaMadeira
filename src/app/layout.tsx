import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Poncha Madeira",
  description: "Hodnoť ponchu po celé Madeiře",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Poncha Madeira",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className="h-full">
      <body className={`${geist.className} h-full antialiased`}>{children}</body>
    </html>
  );
}
