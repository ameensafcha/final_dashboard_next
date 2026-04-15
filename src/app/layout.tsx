import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import { SidebarWrapper } from "@/components/sidebar-wrapper";
import { Providers } from "@/components/providers";
import { ToastContainer } from "@/components/toast-container";
import { GlobalAuthWrapper } from "@/components/global-auth-wrapper";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: false,
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
      className={`${manrope.variable} ${inter.variable} h-full antialiased`}
    >
      <body className={`${manrope.variable} ${inter.variable} min-h-full flex font-sans antialiased`}>
        <Providers>
          <SidebarWrapper />
          <main className="flex-1 overflow-auto">
            <GlobalAuthWrapper>
              {children}
            </GlobalAuthWrapper>
          </main>
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
