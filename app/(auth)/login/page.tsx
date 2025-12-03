// src/app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import apiServices from '@/lib/api-services';
import { LoginDto } from '@/types';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // ✅ استخدام apiServices بدلاً من fetch مباشرة
      const credentials: LoginDto = { username, password };
      const userData = await apiServices.users.login(credentials);

      // تخزين بيانات المستخدم في localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // تحديث حالة المستخدم في AuthContext
      setUser(userData);

      // التوجيه حسب نوع المستخدم
      const userType = userData.userType;
      switch (userType) {
        case 'Translator':
          router.push('/translator');
          break;
        case 'Reviewer':
          router.push('/reviewer');
          break;
        case 'Supervisor':
          router.push('/supervisor');
          break;
        case 'Manager':
          router.push('/manager');
          break;
        case 'DataEntry':
          router.push('/data-entry');
          break;
        default:
          router.push('/');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // معالجة أخطاء محددة
      let errorMessage = 'فشل في تسجيل الدخول';
      if (err.message.includes('اسم المستخدم أو كلمة المرور غير صحيحة')) {
        errorMessage = 'اسم المستخدم أو كلمة المرور غير صحيحة';
      } else if (err.message.includes('غير نشط')) {
        errorMessage = 'الحساب غير نشط، يرجى التواصل مع المدير';
      } else if (err.message.includes('الاتصال')) {
        errorMessage = 'تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً';
      } else {
        errorMessage = err.message || 'حدث خطأ غير متوقع';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">مرحباً بك مجدداً</CardTitle>
          <CardDescription>
            سجّل الدخول لاستكمال عملك في نظام إدارة الترجمة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          ليس لديك حساب؟{' '}
          <Button
            variant="link"
            className="px-1 h-auto font-normal"
            onClick={() => router.push('/register')}
            disabled={loading}
          >
            أنشئ حساباً
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}