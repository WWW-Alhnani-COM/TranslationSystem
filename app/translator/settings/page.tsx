import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">الإعدادات والملف الشخصي</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>الملف الشخصي</CardTitle>
            <CardDescription>إدارة معلوماتك الشخصية وتفضيلاتك</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback>TR</AvatarFallback>
              </Avatar>
              <Button variant="outline">تغيير الصورة</Button>
            </div>
            
            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input defaultValue="أحمد محمد" />
            </div>
            
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input defaultValue="ahmed@example.com" disabled />
            </div>

            <div className="space-y-2">
              <Label>اللغات المتقنة</Label>
              <div className="flex gap-2">
                <Badge>العربية (Native)</Badge>
                <Badge>الإنجليزية (Fluent)</Badge>
                <Badge variant="success">+ إضافة لغة</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>تفضيلات النظام</CardTitle>
            <CardDescription>تخصيص تجربة الاستخدام</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>الإشعارات البريدية</Label>
                <p className="text-sm text-muted-foreground">استلام تنبيهات عبر البريد الإلكتروني</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>الحفظ التلقائي</Label>
                <p className="text-sm text-muted-foreground">حفظ الترجمات تلقائياً أثناء الكتابة</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>الوضع الليلي</Label>
                <p className="text-sm text-muted-foreground">تفعيل المظهر الداكن</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
