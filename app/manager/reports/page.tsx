import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ManagerReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">التقارير الشاملة</h1>

      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance">الأداء العام</TabsTrigger>
          <TabsTrigger value="financial">التقارير المالية</TabsTrigger>
          <TabsTrigger value="quality">تحليل الجودة</TabsTrigger>
        </TabsList>
        <TabsContent value="performance" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>نمو الإنتاجية السنوي</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center bg-muted/10 border-dashed">
              مخطط بياني للنمو
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="financial" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>التكاليف والإيرادات</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center bg-muted/10 border-dashed">
              مخطط مالي
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
