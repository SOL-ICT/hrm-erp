// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/sol-components.css";
import "../styles/route-cache.css";

// Only import Providers - it already includes AuthProvider
import Providers from "@/components/Providers";
import ErrorBoundary from "@/components/ErrorBoundary";

// Import chunk error handler for development
import "@/utils/chunkErrorHandler";

// Initialize performance optimization system
import "@/utils/performanceBootstrap";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HRM ERP - Strategic Outsourcing Limited",
  description: "Human Resource Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <ErrorBoundary>
          {/* Providers already includes AuthProvider - no double wrapping needed */}
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
