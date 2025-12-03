// src/components/layout/AppLayout.tsx
"use client";

import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader"; // تأكد من اسم الملف ومكانه
import { User } from "@/types"; // استيراد واجهة User من الملف الموحد

interface AppLayoutProps {
  children: React.ReactNode;
  user: User | null; // استخدام نوع User المعرف في types/index.ts
  logout: () => void;
}

export function AppLayout({ children, user, logout }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // إذا لم يكن هناك مستخدم، يمكنك اختيار عرض شيء احتياطي أو فقط المحتوى
  // في هذه الحالة، نفترض أن DataEntryLayout.tsx يتعامل مع التحقق من تسجيل الدخول
  // لذا لن نضمن شرطًا هنا يوقف العرض
  
  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* تمرير user و logout إلى AppHeader */}
        <AppHeader user={user} logout={logout} isSidebarCollapsed={sidebarCollapsed} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}