import type { Metadata, Viewport } from "next";
import { Geist, Outfit } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Best Poncha",
  description: "Rate poncha all over Madeira",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Best Poncha",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#d35400",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${outfit.variable} h-full`}>
      <body className="h-full antialiased font-sans">{children}</body>
    </html>
  );
}
