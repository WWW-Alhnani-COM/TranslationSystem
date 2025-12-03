// src/app/data-entry/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Folder, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Upload, 
  Edit,
  Bell,
  Activity,
  TrendingUp
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

// تعريف الأنواع بناءً على الواجهة المطلوبة ونماذج OpenAPI
interface QuickStats {
  totalProjects: number;
  activeProjects: number;
  pendingReviewProjects: number;
  totalParagraphs: number;
  recentUploads: number;
}

interface RecentProject {
  projectId: number;
  projectName: string;
  status: 'Draft' | 'Active' | 'Review' | 'Completed' | 'InProgress' | 'Cancelled'; // بناءً على ProjectResponseDto
  createdAt: string; // ISO date string
  paragraphCount: number;
  progress: number; // تم حسابه من الـ API أو من القيم المتوفرة
}

interface QuickAction {
  createProject: boolean;
  uploadContent: boolean;
  manageParagraphs: boolean;
}

interface Notification {
  notificationId: number;
  userId: number;
  title: string;
  message: string;
  relatedType?: string;
  relatedId?: number;
  isRead: boolean;
  createdAt: string; // ISO date string
  type: 'info' | 'warning' | 'success' | 'error'; // مخصص بناءً على الرسالة
}

interface DataEntryDashboard {
  quickStats: QuickStats;
  recentProjects: RecentProject[];
  quickActions: QuickAction;
  notifications: Notification[];
}

export default function DataEntryDashboard() {
  const [dashboardData, setDashboardData] = useState<DataEntryDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // جلب الإحصائيات العامة للمستخدم
      const statsPromise = apiClient.get(`Statistics/dashboard/user/${user.userId}`);
      // جلب المشاريع الخاصة بالمستخدم
      const projectsPromise = apiClient.get(`Projects/user/${user.userId}`);
      // جلب الإشعارات غير المقروءة للمستخدم
      const notificationsPromise = apiClient.get(`Notifications/user/${user.userId}/unread`);

      const [statsData, projectsData, notificationsData] = await Promise.all([
        statsPromise,
        projectsPromise,
        notificationsPromise
      ]);

      // حساب الإحصائيات الإضافية
      const activeProjects = projectsData.filter((p: any) => p.status === 'Active' || p.status === 'InProgress').length;
      const pendingReviewProjects = projectsData.filter((p: any) => p.status === 'Review').length;
      const totalParagraphs = projectsData.reduce((sum: number, p: any) => sum + p.totalParagraphs, 0);

      const quickStats: QuickStats = {
        totalProjects: statsData?.totalProjects || projectsData.length || 0,
        activeProjects: activeProjects,
        pendingReviewProjects: pendingReviewProjects,
        totalParagraphs: totalParagraphs,
        recentUploads: 0, // لا يوجد في API مباشرة، يمكن حسابه من نشاطات المستخدم
      };

      // تحويل بيانات المشاريع إلى الشكل المطلوب
      const recentProjects: RecentProject[] = projectsData.slice(0, 5).map((p: any) => ({
        projectId: p.projectId,
        projectName: p.projectName,
        status: p.status as 'Draft' | 'Active' | 'Review' | 'Completed' | 'InProgress' | 'Cancelled',
        createdAt: p.createdAt,
        paragraphCount: p.totalParagraphs,
        progress: p.status === 'Completed' ? 100 : (p.status === 'Draft' ? 0 : 50), // مثال بسيط، يجب حسابه من التقدم الفعلي
      }));

      // تحويل الإشعارات إلى الشكل المطلوب
      const notifications: Notification[] = notificationsData.map((n: any) => ({
        ...n,
        type: n.relatedType?.toLowerCase().includes('error') ? 'error' : 
              n.relatedType?.toLowerCase().includes('warning') ? 'warning' : 
              n.relatedType?.toLowerCase().includes('completed') ? 'success' : 'info'
      }));

      setDashboardData({
        quickStats,
        recentProjects,
        quickActions: {
          createProject: true,
          uploadContent: true,
          manageParagraphs: true,
        },
        notifications
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في جلب بيانات لوحة التحكم",
      });
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
      case "InProgress":
        return <Badge variant="secondary">نشط</Badge>;
      case "Completed":
        return <Badge variant="secondary">مكتمل</Badge>;
      case "Draft":
        return <Badge variant="outline">مسودة</Badge>;
      case "Review":
        return <Badge variant="warning">قيد المراجعة</Badge>;
      case "Cancelled":
        return <Badge variant="destructive">ملغى</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2].map((item) => (
            <Card key={item}>
              <CardHeader>
                <CardTitle className="h-6 w-32 bg-muted rounded animate-pulse"></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((subItem) => (
                    <div key={subItem} className="h-4 w-full bg-muted rounded animate-pulse"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData || !user) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-xl font-bold mb-2">خطأ في تحميل البيانات</h2>
        <p className="text-muted-foreground">
          يُرجى التأكد من تسجيل الدخول وتوفر صلاحيات الوصول.
        </p>
      </div>
    );
  }

  const { quickStats, recentProjects, notifications } = dashboardData;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">مرحباً، {user.firstName} {user.lastName}</h1>
          <p className="text-muted-foreground">لوحة تحكم مدخل البيانات - نظرة عامة على النشاطات</p>
        </div>
        <div className="text-muted-foreground">
          آخر تحديث: {new Date().toLocaleString('ar-EG')}
        </div>
      </div>

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المشاريع</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.totalProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المشاريع النشطة</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.activeProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد المراجعة</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.pendingReviewProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الفقرات</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.totalParagraphs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التحميلات الحديثة</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.recentUploads}</div>
          </CardContent>
        </Card>
      </div>

      {/* الإجراءات السريعة */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            الإجراءات السريعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => router.push('/data-entry/projects/new')}>
              <Plus className="h-4 w-4 mr-2" />
              إنشاء مشروع
            </Button>
            <Button variant="outline" onClick={() => router.push('/data-entry/paragraphs')}>
              <Upload className="h-4 w-4 mr-2" />
              رفع محتوى
            </Button>
            <Button variant="outline" onClick={() => router.push('/data-entry/paragraphs')}>
              <Edit className="h-4 w-4 mr-2" />
              إدارة الفقرات
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* المشاريع الحديثة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              المشاريع الحديثة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentProjects.length > 0 ? (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div 
                    key={project.projectId} 
                    className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="font-medium truncate cursor-pointer hover:underline text-primary"
                        onClick={() => router.push(`/data-entry/projects/${project.projectId}`)}
                      >
                        {project.projectName}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(project.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                    <div className="ml-4 text-right min-w-[100px]">
                      {getStatusBadge(project.status)}
                      <div className="text-xs text-muted-foreground mt-1">
                        {project.paragraphCount} فقرة
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">لا توجد مشاريع حديثة</p>
            )}
          </CardContent>
        </Card>

        {/* الإشعارات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              الإشعارات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.notificationId} className="flex items-start gap-3 border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{notification.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleString('ar-EG')}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <Badge variant="outline" className="ml-2">جديد</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">لا توجد إشعارات جديدة</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}