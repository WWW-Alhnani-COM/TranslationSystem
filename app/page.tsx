// src/app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Languages } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Title */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Languages className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">نظام إدارة الترجمة</h1>
          <p className="text-muted-foreground">
            منصة متكاملة لإدارة مشاريع الترجمة لدار النشر
          </p>
        </div>

        {/* Welcome Card */}
        <Card className="border-border">
          <CardHeader className="text-center">
            <CardTitle>مرحباً بك!</CardTitle>
            <CardDescription>
              سجّل الدخول لبدء إدارة مشاريع الترجمة بكفاءة
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              onClick={() => router.push("/login")}
              className="w-full"
            >
              تسجيل الدخول
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/register")}
              className="w-full"
            >
              إنشاء حساب جديد
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} نظام إدارة الترجمة - جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}