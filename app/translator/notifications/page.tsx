import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Check, Trash2 } from 'lucide-react'

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">الإشعارات</h1>
        <Button variant="outline">تحديد الكل كمقروء</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            التنبيهات الحديثة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="flex gap-4">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                  <div className="space-y-1">
                    <p className="font-medium">تم إسناد مهمة جديدة: ترجمة وثائق قانونية</p>
                    <p className="text-sm text-muted-foreground">قام المشرف بتعيين مهمة جديدة لك. الموعد النهائي: 2024-12-01</p>
                    <p className="text-xs text-muted-foreground">منذ ساعتين</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" title="تحديد كمقروء">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-destructive" title="حذف">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
