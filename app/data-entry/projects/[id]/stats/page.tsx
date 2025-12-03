// src/app/data-entry/projects/[id]/stats/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { 
  BookOpen, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

export default function ProjectStatsPage() {
  const params = useParams();
  const projectId = parseInt(params.id as string);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectStats();
  }, [projectId]);

  const fetchProjectStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`Projects/${projectId}/stats`);
      
      if (response.success) {
        setStats(response.data);
      } else {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: response.message || "فشل في جلب إحصائيات المشروع",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في الاتصال بالخادم",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <div className="h-5 w-5 rounded bg-muted animate-pulse" />
                  <div className="h-5 w-24 rounded bg-muted animate-pulse" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 rounded bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto py-10 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">لا توجد إحصائيات</h2>
        <p className="text-muted-foreground">
          لا توجد إحصائيات متاحة لهذا المشروع بعد
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">إحصائيات المشروع</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="إجمالي الفقرات"
          value={stats.totalParagraphs}
          icon={BookOpen}
        />
        <StatCard
          title="الفقرات المترجمة"
          value={stats.translatedParagraphs}
          icon={CheckCircle}
          trend={{
            value: stats.totalParagraphs - stats.translatedParagraphs,
            label: "معلقة"
          }}
        />
        <StatCard
          title="عدد الكلمات"
          value={stats.totalWords}
          icon={BookOpen}
        />
        <StatCard
          title="متوسط جودة الترجمة"
          value={`${Math.round(stats.averageQualityScore * 10) / 10}/5`}
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>التقدم العام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>التقدم العام</span>
                  <span>{stats.overallProgress}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${stats.overallProgress}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>المترجمين</span>
                    <span>{stats.translatorsProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${stats.translatorsProgress}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>المراجعين</span>
                    <span>{stats.reviewersProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${stats.reviewersProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الإحصائيات حسب اللغة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.languageStats && stats.languageStats.length > 0 ? (
                stats.languageStats.map((lang: any) => (
                  <div key={lang.languageId} className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ml-3">
                      <span className="font-medium text-primary">
                        {lang.languageCode ? lang.languageCode.toUpperCase() : "N/A"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{lang.languageName}</span>
                        <span>{lang.progressPercentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${lang.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  لا توجد إحصائيات للغات
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>الإحصائيات حسب النوع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.typeStats && stats.typeStats.length > 0 ? (
                stats.typeStats.map((type: any) => (
                  <div key={type.paragraphType} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">
                        {type.paragraphType === "Normal" && "نص عادي"}
                        {type.paragraphType === "Header" && "عنوان"}
                        {type.paragraphType === "Subheader" && "عنوان فرعي"}
                        {type.paragraphType === "Quote" && "اقتباس"}
                        {type.paragraphType === "List" && "قائمة"}
                      </span>
                      <span>{type.count} فقرة ({type.progressPercentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${type.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  لا توجد إحصائيات حسب النوع
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المهام المتأخرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.overdueAssignments && stats.overdueAssignments.length > 0 ? (
                stats.overdueAssignments.map((assignment: any) => (
                  <div key={assignment.assignmentId} className="border-b pb-3 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{assignment.userName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {assignment.role === "Translator" ? "مترجم" : assignment.role === "Reviewer" ? "مراجع" : "مشرف"} - {assignment.targetLanguageName}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="bg-red-500/10 text-red-700">
                          {Math.floor((new Date().getTime() - new Date(assignment.deadline).getTime()) / (1000 * 60 * 60 * 24))} يوم
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(assignment.deadline).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  لا توجد مهام متأخرة
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}