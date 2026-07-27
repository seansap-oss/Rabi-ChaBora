import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cafe Delight - Order Online",
  description: "Order your favorite coffee and food from Cafe Delight. Scan QR code to view menu and place order.",
  keywords: ["cafe", "coffee", "food", "ordering", "restaurant", "POS", "point of sale"],
  openGraph: {
    title: "Cafe Delight",
    description: "Freshly brewed happiness",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
