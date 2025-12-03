import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from 'lucide-react'

export default function SupervisorReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">التقارير والتحليلات</h1>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> تصدير البيانات
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>تقرير الإنتاجية الشهري</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-muted/10 border-dashed rounded-md">
              مخطط الإنتاجية
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>توزيع المهام حسب اللغة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-muted/10 border-dashed rounded-md">
              مخطط دائري للغات
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
