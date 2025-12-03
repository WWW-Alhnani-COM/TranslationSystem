import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"

export default function QualityPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">متابعة الجودة</h1>

      <Card>
        <CardHeader>
          <CardTitle>أداء المترجمين</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المترجم</TableHead>
                <TableHead>المشاريع المنجزة</TableHead>
                <TableHead>متوسط التقييم</TableHead>
                <TableHead>معدل الالتزام</TableHead>
                <TableHead>مؤشر الأداء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4].map((i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">مترجم {i}</TableCell>
                  <TableCell>24</TableCell>
                  <TableCell>
                    <span className="font-bold text-green-600">9.{i}/10</span>
                  </TableCell>
                  <TableCell>98%</TableCell>
                  <TableCell className="w-[200px]">
                    <Progress value={90 + i} className="h-2" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
