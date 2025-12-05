// src/app/layout.tsx - عدّله كالتالي:
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import { HTTPSFixer } from "@/components/https-fixer"; // 🔧 غير الاسم

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
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="icon" href="./favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
        {/* 🔧 أضف هذه الـ meta tags */}
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body suppressHydrationWarning>
        {/* 🔧 أضف HTTPSFixer هنا */}
        <HTTPSFixer />
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
