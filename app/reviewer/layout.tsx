// src/app/reviewer/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";

export default function ReviewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        toast({
          title: "الرجاء تسجيل الدخول",
          description: "يجب تسجيل الدخول لعرض هذه الصفحة",
          variant: "destructive",
        });
        router.push("/login");
        return;
      }

      if (user.userType !== "Reviewer") {
        toast({
          title: "غير مصرح",
          description: "هذه الصفحة متاحة فقط للمراجعين",
          variant: "destructive",
        });
        // توجيه المستخدم إلى الصفحة المناسبة بناءً على نوعه
        switch (user.userType) {
          case "Translator":
            router.push("/translator");
            break;
          case "DataEntry":
            router.push("/data-entry");
            break;
          case "Supervisor":
            router.push("/supervisor");
            break;
          case "Manager":
            router.push("/manager");
            break;
          default:
            router.push("/");
        }
        return;
      }
    }
  }, [user, isLoading, router]);

  // عرض مؤشر التحميل أثناء التحقق من حالة المستخدم
  if (isLoading || (user && user.userType !== "Reviewer")) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // عرض التخطيط فقط إذا كان المستخدم مسجل دخوله وله نوع Reviewer
  return (
    <AppLayout user={user} logout={logout}>
      {children}
    </AppLayout>
  );
}