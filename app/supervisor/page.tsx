// C:\Users\Ahmed\Desktop\translation-system-ui\app\supervisor\page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { projectService, statisticsService } from "@/lib/api-services";
import { Project, ProjectStatsDto, DashboardStatsDto } from "@/types";
import { 
  Folder, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  FileText,
  Users,
  Target
} from "lucide-react";

export default function SupervisorDashboard() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [reviewProjects, setReviewProjects] = useState<Project[]>([]);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [urgentProjects, setUrgentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // جلب إحصائيات Dashboard
      const stats = await statisticsService.getDashboard();
      setDashboardStats(stats);

      // جلب المشاريع قيد المراجعة
      const reviewProjectsData = await projectService.getByStatus('InProgress');
      setReviewProjects(reviewProjectsData || []);

      // جلب المشاريع المنتهية (هذا الشهر)
      const allProjects = await projectService.getAll();
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyCompleted = (allProjects || []).filter((project: Project) => {
        if (project.status !== 'Completed') return false;
        const projectDate = new Date(project.updatedAt || project.createdAt);
        return projectDate.getMonth() === currentMonth && 
               projectDate.getFullYear() === currentYear;
      });
      setCompletedProjects(monthlyCompleted);

      // جلب المشاريع المستعجلة (المشاريع النشطة مع مواعيد نهائية قريبة)
      const urgent = (allProjects || []).filter((project: Project) => 
        project.status === 'Active' || project.status === 'InProgress'
      ).slice(0, 5); // أول 5 مشاريع كنمط للعرض
      setUrgentProjects(urgent);

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const getProjectStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      'Draft': { variant: 'outline', label: 'مسودة' },
      'Active': { variant: 'default', label: 'نشط' },
      'InProgress': { variant: 'secondary', label: 'قيد التنفيذ' },
      'Completed': { variant: 'default', label: 'منتهي' },
      'Cancelled': { variant: 'destructive', label: 'ملغي' }
    };

    const config = statusConfig[status] || { variant: 'outline', label: status };
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const calculateDailyProgress = () => {
    if (!dashboardStats) return 0;
    // محاكاة لمعدل الإنجاز اليومي (يمكن استبدالها ببيانات حقيقية من API)
    return Math.min(100, Math.round((dashboardStats.completedTranslations / dashboardStats.totalTranslations) * 100));
  };

  const calculateWeeklyProgress = () => {
    if (!dashboardStats) return 0;
    // محاكاة لمعدل الإنجاز الأسبوعي
    return Math.min(100, Math.round((dashboardStats.completedProjects / dashboardStats.totalProjects) * 100));
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">حدث خطأ</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchDashboardData}>إعادة المحاولة</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* عنوان الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">لوحة تحكم المشرف</h1>
          <p className="text-muted-foreground mt-2">
            نظرة عامة على أداء المشاريع والأنشطة الحالية
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={fetchDashboardData} variant="outline" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            تحديث البيانات
          </Button>
        </div>
      </div>

      {/* شبكة بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* مشاريع قيد المراجعة */}
        <StatCard
          title="مشاريع قيد المراجعة"
          value={reviewProjects.length.toString()}
          description="مشاريع تحتاج إلى مراجعة وموافقة"
          icon={<FileText className="w-4 h-4" />}
          trend={`${reviewProjects.filter((project: Project) => project.status === 'InProgress').length} نشطة`}
          trendColor="text-blue-600"
        />

        {/* مشاريع منتهية هذا الشهر */}
        <StatCard
          title="مشاريع منتهية"
          value={completedProjects.length.toString()}
          description="تم الانتهاء منها هذا الشهر"
          icon={<CheckCircle className="w-4 h-4" />}
          trend={`${Math.round((completedProjects.length / (dashboardStats?.totalProjects || 1)) * 100)}% من الإجمالي`}
          trendColor="text-green-600"
        />

        {/* معدل الإنجاز اليومي */}
        <StatCard
          title="الإنجاز اليومي"
          value={`${calculateDailyProgress()}%`}
          description="معدل إنجاز الترجمات اليوم"
          icon={<TrendingUp className="w-4 h-4" />}
          trend={`${dashboardStats?.completedTranslations || 0} من ${dashboardStats?.totalTranslations || 0}`}
          trendColor="text-orange-600"
        />

        {/* معدل الإنجاز الأسبوعي */}
        <StatCard
          title="الإنجاز الأسبوعي"
          value={`${calculateWeeklyProgress()}%`}
          description="معدل إنجاز المشاريع هذا الأسبوع"
          icon={<Calendar className="w-4 h-4" />}
          trend={`${dashboardStats?.completedProjects || 0} من ${dashboardStats?.totalProjects || 0}`}
          trendColor="text-purple-600"
        />
      </div>

      {/* قسم المشاريع */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* مشاريع قيد المراجعة - تفاصيل */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                مشاريع قيد المراجعة
              </CardTitle>
              <CardDescription>
                المشاريع التي تتطلب مراجعة وموافقة
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {reviewProjects.length}
            </Badge>
          </CardHeader>
          <CardContent>
            {reviewProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد مشاريع قيد المراجعة حالياً</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviewProjects.slice(0, 5).map((project: Project) => (
                  <div key={project.projectId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Folder className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{project.projectName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getProjectStatusBadge(project.status)}
                          <span className="text-xs text-muted-foreground">
                            {project.wordCount} كلمة
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Target className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {reviewProjects.length > 5 && (
                  <div className="text-center pt-2">
                    <Button variant="link" className="text-sm">
                      عرض جميع المشاريع ({reviewProjects.length})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* المشاريع المستعجلة */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                المشاريع المستعجلة
              </CardTitle>
              <CardDescription>
                مشاريع تحتاج إلى متابعة عاجلة
              </CardDescription>
            </div>
            <Badge variant="destructive" className="text-sm">
              {urgentProjects.length}
            </Badge>
          </CardHeader>
          <CardContent>
            {urgentProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد مشاريع مستعجلة حالياً</p>
              </div>
            ) : (
              <div className="space-y-4">
                {urgentProjects.map((project: Project) => (
                  <div key={project.projectId} className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <div>
                        <p className="font-medium text-sm">{project.projectName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getProjectStatusBadge(project.status)}
                          <span className="text-xs text-muted-foreground">
                            {project.totalParagraphs} فقرة
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-orange-300 text-orange-700">
                      متابعة
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* إحصائيات إضافية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{dashboardStats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardStats?.activeUsers || 0} مستخدم نشط
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">متوسط جودة الترجمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {dashboardStats?.averageQualityScore ? dashboardStats.averageQualityScore.toFixed(1) : '0.0'}
                </div>
                <p className="text-xs text-muted-foreground">من 10 نقاط</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">الكلمات المترجمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="w-8 h-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {(dashboardStats?.totalWordsTranslated || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">إجمالي الكلمات</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// مكون بطاقة الإحصائيات المساعد
interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend: string;
  trendColor: string;
}

function StatCard({ title, value, description, icon, trend, trendColor }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        <p className={`text-xs ${trendColor} mt-2 font-medium`}>{trend}</p>
      </CardContent>
    </Card>
  );
}

// مكون هيكل التحميل
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* عنوان الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32 mt-4 sm:mt-0" />
      </div>

      {/* شبكة بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* قسم المشاريع */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-8" />
            </CardHeader>
            <CardContent>
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between p-3 border rounded-lg mb-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
