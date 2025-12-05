// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import { ForceHTTPS } from "@/components/force-https";

export const metadata: Metadata = {
  title: "نظام إدارة الترجمة",
  description: "منصة متكاملة لإدارة مشاريع الترجمة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="icon" href="./favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
        {/* 🔧 إضافة Content Security Policy لإجبار HTTPS */}
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
        {/* 🔧 إضافة قاعدة لإعادة كتابة جميع الروابط */}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body>
        <ForceHTTPS />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
