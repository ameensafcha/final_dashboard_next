import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SidebarWrapper } from "@/components/sidebar-wrapper";
import { Providers } from "@/components/providers";
import { ToastContainer } from "@/components/toast-container";
import { NotificationCenter } from "@/components/notification-center";
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
  title: {
    template: "%s | Inventory App",
    default: "Inventory App",
  },
  description: "Raw materials inventory management system for tracking materials, production, and stock",
  keywords: ["inventory", "raw materials", "stock management", "production"],
  authors: [{ name: "Inventory Team" }],
  openGraph: {
    title: "Inventory App",
    description: "Raw materials inventory management system",
    type: "website",
    locale: "en_US",
    siteName: "Inventory App",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inventory App",
    description: "Raw materials inventory management system",
  },
  robots: {
    index: true,
    follow: true,
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
      <body className="min-h-full flex">
        <Providers>
          <SidebarWrapper />
          <main className="flex-1 flex flex-col">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-end items-center gap-4">
              <NotificationCenter />
            </header>
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}