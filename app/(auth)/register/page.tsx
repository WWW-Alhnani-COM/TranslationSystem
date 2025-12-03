'use client';

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Languages } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2 
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("محمد");
  const [lastName, setLastName] = useState("الحناني");
  const [phoneNumber, setPhoneNumber] = useState("0501234567");
  const [userType, setUserType] = useState("DataEntry");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const url = 'http://samali1-001-site1.stempurl.com/api/users/register';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password: password.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          userType: userType,
          phoneNumber: phoneNumber.trim() || null
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        let errorMessage = data.message || 'حدث خطأ أثناء التسجيل';
        
        if (errorMessage.includes('username')) {
          errorMessage = 'اسم المستخدم موجود مسبقاً';
        } else if (errorMessage.includes('email') || errorMessage.includes('Email')) {
          errorMessage = 'البريد الإلكتروني موجود مسبقاً أو غير صالح';
        } else if (errorMessage.includes('required')) {
          errorMessage = 'يرجى ملء جميع الحقول المطلوبة';
        } else if (errorMessage.includes('userType')) {
          errorMessage = 'نوع المستخدم غير صالح';
        }
        
        throw new Error(errorMessage);
      }

      setSuccess('تم إنشاء الحساب بنجاح! سيتم توجيهك لصفحة تسجيل الدخول...');
      
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 2000);
      
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'فشل في إنشاء الحساب. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-foreground">إنشاء حساب جديد</h1>
          <p className="text-muted-foreground">أنشئ حسابك للانضمام إلى نظام إدارة الترجمة</p>
        </div>

        {/* Register Card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>بيانات التسجيل</CardTitle>
            <CardDescription>املأ البيانات التالية لإنشاء حسابك</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">خطأ في التسجيل</h3>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 text-green-500 rounded-md flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">نجاح</h3>
                  <p className="text-sm">{success}</p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">الاسم الأول</Label>
                  <Input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="أدخل اسمك الأول"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">اسم العائلة</Label>
                  <Input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="أدخل اسم عائلتك"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="bg-background"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="اختر اسم مستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-background"
                  minLength={3}
                  maxLength={50}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="أدخل بريدك الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="اختر كلمة مرور قوية"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background"
                  minLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الجوال (اختياري)</Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="05XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="bg-background"
                  pattern="[0-9]{10}"
                  title="يرجى إدخال رقم جوال صحيح (10 أرقام)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="userType">نوع المستخدم</Label>
                <Select value={userType} onValueChange={setUserType}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="اختر نوع المستخدم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DataEntry">مدخل بيانات</SelectItem>
                    <SelectItem value="Translator">مترجم</SelectItem>
                    <SelectItem value="Reviewer">مراجع</SelectItem>
                    <SelectItem value="Supervisor">مشرف</SelectItem>
                    <SelectItem value="Manager">مدير</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {userType === 'DataEntry' && 'كمدخل بيانات، يمكنك إنشاء المشاريع وإدارة الفقرات.'}
                  {userType === 'Translator' && 'كـمترجم، يمكنك ترجمة الفقرات وتسليمها للمراجعة.'}
                  {userType === 'Reviewer' && 'كـمراجع، يمكنك مراجعة الترجمات واعتمادها.'}
                  {userType === 'Supervisor' && 'كـمشرف، يمكنك مراقبة أداء الفريق وإدارة المشاريع.'}
                  {userType === 'Manager' && 'كـمدير، يمكنك إدارة النظام ككل والتقارير المتقدمة.'}
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري الإنشاء...
                  </span>
                ) : "إنشاء الحساب"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          لديك حساب بالفعل؟{" "}
          <Button variant="link" className="p-0 h-auto font-medium" onClick={() => router.push("/login")}>
            سجّل الدخول
          </Button>
        </p>
      </div>
    </div>
  );
}
