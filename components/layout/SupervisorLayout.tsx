// C:\Users\Ahmed\Desktop\translation-system-ui\components\layout\SupervisorLayout.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { AppLayout } from "./AppLayout";
import { useAuth } from "@/context/AuthContext";
import { LoadingScreen } from "@/components/ui/loading-screen";

interface SupervisorLayoutProps {
  children: React.ReactNode;
}

export function SupervisorLayout({ children }: SupervisorLayoutProps) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // التحقق من صلاحية المستخدم بعد انتهاء التحميل
    if (!isLoading) {
      if (!user) {
        // إذا لم يكن المستخدم مسجل الدخول، توجيه إلى صفحة تسجيل الدخول
        router.push('/login?redirect=/supervisor');
        return;
      }

      if (user.userType !== 'Supervisor' && user.userType !== 'Manager') {
        // إذا لم يكن المستخدم مشرفًا أو مديرًا، توجيه إلى الصفحة المناسبة لدوره
        switch (user.userType) {
          case 'DataEntry':
            router.push('/data-entry');
            break;
          case 'Translator':
            router.push('/translator');
            break;
          case 'Reviewer':
            router.push('/reviewer');
            break;
          default:
            router.push('/login');
        }
        return;
      }

      setIsChecking(false);
    }
  }, [user, isLoading, router]);

  // عرض شاشة التحميل أثناء التحقق
  if (isLoading || isChecking) {
    return <LoadingScreen message="جاري التحقق من الصلاحيات..." />;
  }

  // إذا لم يكن هناك مستخدم (سيتم التوجيه في useEffect)
  if (!user) {
    return null;
  }

  return (
    <AppLayout user={user} logout={logout}>
      {children}
    </AppLayout>
  );
}