"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import type { UserPerformanceDto, ProjectProgressDto, LanguageStatsDto } from "@/types";
import {
  BarChart3,
  TrendingUp,
  Languages,
  Calendar,
  User,
  FileText,
  Loader2,
  Download,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ReviewerReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<UserPerformanceDto | null>(null);
  const [projectsProgress, setProjectsProgress] = useState<ProjectProgressDto[]>([]);
  const [languageStats, setLanguageStats] = useState<LanguageStatsDto[]>([]);

  useEffect(() => {
    if (user) {
      fetchReportsData();
    }
  }, [user]);

  const fetchReportsData = async () => {
    if (!user) return;
    try {
      setLoading(true);

      // جلب أداء المستخدم الحالي
      const perfData = await apiClient.get(
        `Statistics/users/performance`
      ).then(list => list.find((u: { userId: number; }) => u.userId === user.userId) || null);

      // جلب تقدم المشاريع الخاصة بالمستخدم
      const projectsRes = await apiClient.get(
        `Statistics/projects/progress`
      );
      const userProjects: ProjectProgressDto[] = (projectsRes as ProjectProgressDto[]).filter((p: ProjectProgressDto) =>
        // ملاحظة: API لا يُرجع userId مباشرة، لكن يمكنك ربطها عبر Assignments لاحقًا
        // هنا نعرض جميع المشاريع كمثال، أو يمكنك طلب endpoint مخصص
        true
      );

      // جلب إحصائيات اللغات
      const langStats = await apiClient.get(
        `Statistics/languages`
      );

      setPerformance(perfData);
      setProjectsProgress(userProjects);
      setLanguageStats(langStats);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في جلب تقارير الأداء",
      });
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    // يمكنك لاحقًا ربط هذا بـ endpoint لتصدير PDF أو CSV
    toast({
      title: "قيد التنفيذ",
      description: "ميزة التصدير سيتم إضافتها لاحقًا.",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">تقارير الأداء</h1>
          <p className="text-muted-foreground mt-1">
            نظرة شاملة على أدائك كمراجع
          </p>
        </div>
        <Button variant="outline" onClick={downloadReport}>
          <Download className="h-4 w-4 ml-2" />
          تصدير التقرير
        </Button>
      </div>

      {/* ملخص الأداء */}
      {performance && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              ملخص أداء {performance.userName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="المشاريع المكتملة" value={performance.completedProjects} />
              <MetricCard label="المراجعات المكتملة" value={performance.completedReviews} />
              <MetricCard label="الكلمات المراجعة" value={performance.totalWordsTranslated} />
              <MetricCard 
                label="متوسط الجودة" 
                value={`${performance.averageQualityScore.toFixed(2)}/10`} 
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* تقدم المشاريع */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            تقدم المشاريع
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projectsProgress.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projectsProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="projectName" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'التقدم']}
                    labelFormatter={(label) => `مشروع: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="progressPercentage" 
                    stroke="#3b82f6" 
                    activeDot={{ r: 8 }} 
                    name="التقدم (%)" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">لا توجد مشاريع لإظهار التقدم.</p>
          )}
        </CardContent>
      </Card>

      {/* جدول التفاصيل */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* المشاريع */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              المشاريع النشطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectsProgress.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>التقدم</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectsProgress.map((p) => (
                    <TableRow key={p.projectId}>
                      <TableCell className="font-medium">{p.projectName}</TableCell>
                      <TableCell>{p.progressPercentage.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Badge variant={p.status === 'Completed' ? 'success' : 'secondary'}>
                          {p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">لا توجد مشاريع.</p>
            )}
          </CardContent>
        </Card>

        {/* إحصائيات اللغات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              أداء حسب اللغة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {languageStats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اللغة</TableHead>
                    <TableHead>المشاريع</TableHead>
                    <TableHead>الكلمات</TableHead>
                    <TableHead>الجودة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {languageStats.map((lang, index) => (
                    <TableRow key={index}>
                      <TableCell>{lang.languageName || 'غير معروف'}</TableCell>
                      <TableCell>{lang.projectCount}</TableCell>
                      <TableCell>{lang.wordCount}</TableCell>
                      <TableCell>{lang.averageQuality.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">لا توجد إحصائيات للغات.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// مكون فرعي لعرض المقاييس
const MetricCard = ({ label, value }: { label: string; value: number | string }) => (
  <div className="border rounded-lg p-4 text-center">
    <div className="text-2xl font-bold text-primary">{value}</div>
    <div className="text-sm text-muted-foreground mt-1">{label}</div>
  </div>
);