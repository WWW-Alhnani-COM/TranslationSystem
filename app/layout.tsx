// src/app/layout.tsx
import type { Metadata } from "next";
// حذف استيراد next/font/google
// import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";


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
  </head>
      <body>
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
