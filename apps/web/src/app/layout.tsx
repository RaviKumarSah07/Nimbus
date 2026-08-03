import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "../store/StoreProvider";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { ServerWakeNotice } from "../components/system/ServerWakeNotice";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Nimbus — Everyday essentials, thoughtfully sourced",
    template: "%s | Nimbus",
  },
  description:
    "A portfolio e-commerce storefront: browse electronics, fashion, and home goods with real search, filters, and checkout.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <StoreProvider>
          <ServerWakeNotice />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
