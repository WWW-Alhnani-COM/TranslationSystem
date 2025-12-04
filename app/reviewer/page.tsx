"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Users, 
  BarChart3,
  ArrowRight,
  BookOpen,
  Star,
  Calendar,
  Target
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import type { 
  AssignmentResponseDto, 
  ReviewResponseDto, 
  DashboardStatsDto,
  ProjectProgressDto 
} from "@/types";

export default function ReviewerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [assignments, setAssignments] = useState<AssignmentResponseDto[]>([]);
  const [recentReviews, setRecentReviews] = useState<ReviewResponseDto[]>([]);
  const [projectsProgress, setProjectsProgress] = useState<ProjectProgressDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (user?.userId) {
        // جلب إحصائيات لوحة التحكم الخاصة بالمستخدم
        const DashboardStatsDto = await apiClient.get(`Statistics/dashboard/user/${user.userId}`);
        setStats(DashboardStatsDto);

        // جلب مهام المراجع
        const userAssignments = await apiClient.get(`Assignments/user/${user.userId}`);
        setAssignments(userAssignments || []);

        // جلب المراجعات الحديثة
        const userReviews = await apiClient.get(`Reviews/reviewer/${user.userId}`);
        setRecentReviews(userReviews?.slice(0, 5) || []);

        // جلب تقدم المشاريع
        const progressData = await apiClient.get(`Statistics/projects/progress`);
        setProjectsProgress(progressData || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "Pending":
        return <Badge variant="outline">قيد الانتظار</Badge>;
      case "In Progress":
        return <Badge variant="secondary">قيد المراجعة</Badge>;
      case "Submitted":
        return <Badge variant="default">مُقدَّمة</Badge>;
      case "Approved":
        return <Badge variant="success">معتمدة</Badge>;
      case "Rejected":
        return <Badge variant="destructive">مرفوضة</Badge>;
      case "Completed":
        return <Badge variant="success">مكتملة</Badge>;
      default:
        return <Badge>{status || "غير معروف"}</Badge>;
    }
  };

  const getPriorityBadge = (deadline: string | null) => {
    if (!deadline) return null;
    
    const today = new Date();
    const dueDate = new Date(deadline);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <Badge variant="destructive">متأخرة</Badge>;
    } else if (diffDays <= 3) {
      return <Badge variant="default">عاجلة</Badge>;
    } else if (diffDays <= 7) {
      return <Badge variant="secondary">قريبة</Badge>;
    }
    
    return null;
  };

  const calculateAssignmentProgress = (assignment: AssignmentResponseDto) => {
    const total = assignment.reviewCount || 1;
    const completed = recentReviews.filter(review => 
      review.reviewerAssignmentId === assignment.assignmentId && 
      (review.status === "Submitted" || review.status === "Approved")
    ).length;
    return (completed / total) * 100;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">لوحة تحكم المراجع</h1>
          <p className="text-muted-foreground mt-1">
            مرحباً بعودتك، {user?.firstName} {user?.lastName}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/reviewer/assignments")}>
            <BookOpen className="h-4 w-4 ml-2" />
            جميع المهام
          </Button>
          <Button onClick={() => router.push("/reviewer/reviews")}>
            <FileText className="h-4 w-4 ml-2" />
            المراجعات
          </Button>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المهام النشطة</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignments.filter(a => a.status === "In Progress" || a.status === "Pending").length}
            </div>
            <p className="text-xs text-muted-foreground">
              من أصل {assignments.length} مهمة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المراجعات المكتملة</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentReviews.filter(r => r.status === "Approved" || r.status === "Submitted").length}
            </div>
            <p className="text-xs text-muted-foreground">
              مراجعة هذا الشهر
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط الجودة</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageQualityScore ? stats.averageQualityScore.toFixed(1) : "0.0"}
            </div>
            <p className="text-xs text-muted-foreground">
              من 10 نقاط
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المشاريع النشطة</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projectsProgress.filter(p => p.status === "InProgress").length}
            </div>
            <p className="text-xs text-muted-foreground">
              مشروع قيد التنفيذ
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* المهام العاجلة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              المهام العاجلة
            </CardTitle>
            <CardDescription>
              المهام التي تتطلب اهتمامك الفوري
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignments
              .filter(assignment => 
                assignment.status !== "Completed" && 
                assignment.deadline && 
                new Date(assignment.deadline).getTime() - new Date().getTime() <= 7 * 24 * 60 * 60 * 1000
              )
              .slice(0, 5)
              .map((assignment) => (
                <div
                  key={assignment.assignmentId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/reviewer/assignments/${assignment.assignmentId}`)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-full ${
                      assignment.isOverdue ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                    }`}>
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{assignment.projectName}</h4>
                        {getPriorityBadge(assignment.deadline)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {assignment.targetLanguageName}
                        </span>
                        <span>{assignment.reviewCount} مراجعة</span>
                      </div>
                      <div className="mt-2">
                        <Progress 
                          value={calculateAssignmentProgress(assignment)} 
                          className="h-1"
                        />
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              ))}
            
            {assignments.filter(a => 
              a.status !== "Completed" && 
              a.deadline && 
              new Date(a.deadline).getTime() - new Date().getTime() <= 7 * 24 * 60 * 60 * 1000
            ).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد مهام عاجلة حالياً</p>
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => router.push("/reviewer/assignments")}
            >
              عرض جميع المهام
            </Button>
          </CardContent>
        </Card>

        {/* المراجعات الحديثة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              المراجعات الحديثة
            </CardTitle>
            <CardDescription>
              آخر المراجعات التي قمت بها
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentReviews.slice(0, 5).map((review) => (
              <div
                key={review.reviewId}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => router.push(`/reviewer/reviews/${review.reviewId}`)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-full ${
                    review.status === "Approved" ? "bg-green-100 text-green-600" :
                    review.status === "Submitted" ? "bg-blue-100 text-blue-600" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">
                        مراجعة #{review.reviewId}
                      </h4>
                      {getStatusBadge(review.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="truncate">{review.projectName}</span>
                      {review.qualityScore && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          {review.qualityScore}/10
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(review.createdAt).toLocaleDateString("ar-EG")}
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            ))}
            
            {recentReviews.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد مراجعات حديثة</p>
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => router.push("/reviewer/reviews")}
            >
              عرض جميع المراجعات
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* تقدم المشاريع */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            تقدم المشاريع
          </CardTitle>
          <CardDescription>
            نظرة عامة على تقدم المشاريع التي تعمل عليها
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectsProgress
              .filter(project => 
                assignments.some(a => a.projectName === project.projectName)
              )
              .slice(0, 5)
              .map((project) => (
                <div key={project.projectId} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{project.projectName}</span>
                      <Badge variant="outline">{project.status}</Badge>
                    </div>
                    <span className="text-sm font-medium">{project.progressPercentage}%</span>
                  </div>
                  <Progress value={project.progressPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>الموعد النهائي: {new Date(project.deadline).toLocaleDateString("ar-EG")}</span>
                    <span>{Math.round(project.progressPercentage)}% مكتمل</span>
                  </div>
                </div>
              ))}
            
            {projectsProgress.filter(project => 
              assignments.some(a => a.projectName === project.projectName)
            ).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد مشاريع نشطة حالياً</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* إحصائيات الأداء */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                النشاط الشهري
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedTranslations || 0}</div>
              <p className="text-xs text-muted-foreground">مراجعة مكتملة هذا الشهر</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                معدل الإنجاز
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalProjects ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">من المشاريع المكتملة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                المشاركة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects || 0}</div>
              <p className="text-xs text-muted-foreground">مشروع نشط حالياً</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
