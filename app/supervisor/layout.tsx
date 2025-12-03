// app/supervisor/layout.tsx
import type { Metadata } from "next";
// لا نحتاج إلى استيراد AuthProvider من context/AuthContext.tsx بعد الآن
import { ClientAuthProvider } from "@/components/ClientAuthProvider"; // استيراد المكون الجديد
import { SupervisorLayout } from "@/components/layout/SupervisorLayout";

export const metadata: Metadata = {
  title: "لوحة تحكم المشرف - نظام إدارة الترجمة",
  description: "لوحة تحكم المشرف لإدارة المشاريع والموافقات والجودة",
};

export default function SupervisorRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // لف الأطفال ب ClientAuthProvider
    <ClientAuthProvider>
      <SupervisorLayout>
        {children}
      </SupervisorLayout>
    </ClientAuthProvider>
  );
}