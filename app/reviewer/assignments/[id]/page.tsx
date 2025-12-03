"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import type { AssignmentResponseDto, ReviewResponseDto } from "@/types";
import {
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  Languages,
  User,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Eye,
  Play,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export default function AssignmentDetailPage() {
  const params = useParams();
  const assignmentId = parseInt(params.id as string, 10);
  const router = useRouter();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<AssignmentResponseDto | null>(null);
  const [reviews, setReviews] = useState<ReviewResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment();
      fetchReviews();
    }
  }, [assignmentId]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(`Assignments/${assignmentId}`);
      setAssignment(data);
    } catch (error) {
      console.error("Error fetching assignment:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في تحميل تفاصيل المهمة",
      });
      router.push("/reviewer/assignments");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await apiClient.get(`Reviews/reviewer/${user?.userId}`);
      const assignmentReviews = data.filter(
        (review: ReviewResponseDto) => 
          review.reviewerAssignmentId === assignmentId
      );
      setReviews(assignmentReviews || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "Pending":
        return <Badge variant="outline">قيد الانتظار</Badge>;
      case "In Progress":
        return <Badge variant="secondary">قيد المراجعة</Badge>;
      case "Completed":
        return <Badge variant="success">مكتملة</Badge>;
      case "Submitted":
        return <Badge variant="default">مُقدَّمة</Badge>;
      case "Cancelled":
        return <Badge variant="destructive">ملغاة</Badge>;
      default:
        return <Badge>{status || "غير معروف"}</Badge>;
    }
  };

  const handleStartReview = () => {
    router.push(`/reviewer/assignments/${assignmentId}/review`);
  };

  const handleViewReview = (reviewId: number) => {
    router.push(`/reviewer/reviews/${reviewId}`);
  };

  const calculateProgress = () => {
    if (!assignment) return 0;
    const total = assignment.reviewCount || 1;
    const completed = reviews.filter(r => 
      r.status === "Completed" || r.status === "Submitted" || r.status === "Approved"
    ).length;
    return (completed / total) * 100;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container mx-auto py-8 text-center">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">المهمة غير موجودة</h2>
        <Button className="mt-4" onClick={() => router.push("/reviewer/assignments")}>
          العودة إلى المهام
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* رأس الصفحة */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">مهمة المراجعة #{assignment.assignmentId}</h1>
          <p className="text-muted-foreground mt-1">{assignment.projectName}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/reviewer/assignments")}>
            العودة للمهام
          </Button>
          {(assignment.status === "Pending" || assignment.status === "In Progress") && (
            <Button onClick={handleStartReview}>
              <Play className="h-4 w-4 ml-2" />
              بدء المراجعة
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* المعلومات الأساسية */}
        <div className="lg:col-span-2 space-y-6">
          {/* بطاقة معلومات المهمة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                معلومات المهمة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="المشروع" value={assignment.projectName} />
                <InfoRow label="الحالة" value={getStatusBadge(assignment.status)} />
                <InfoRow 
                  label="اللغة المستهدفة" 
                  value={assignment.targetLanguageName}
                  icon={<Languages className="h-4 w-4" />}
                />
                <InfoRow 
                  label="تاريخ التعيين" 
                  value={new Date(assignment.assignedAt).toLocaleDateString("ar-EG")}
                  icon={<Calendar className="h-4 w-4" />}
                />
                <InfoRow 
                  label="الموعد النهائي" 
                  value={
                    assignment.deadline 
                      ? new Date(assignment.deadline).toLocaleDateString("ar-EG")
                      : "غير محدد"
                  }
                  icon={<Clock className="h-4 w-4" />}
                />
                <InfoRow 
                  label="تاريخ الإكمال" 
                  value={
                    assignment.completedAt 
                      ? new Date(assignment.completedAt).toLocaleDateString("ar-EG")
                      : "غير مكتمل بعد"
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* تقدم المهمة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                تقدم المراجعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>معدل الإنجاز</span>
                  <span>{Math.round(calculateProgress())}%</span>
                </div>
                <Progress value={calculateProgress()} className="h-2" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <StatCard
                  label="إجمالي المراجعات"
                  value={assignment.reviewCount || 0}
                  icon={<FileText className="h-4 w-4" />}
                />
                <StatCard
                  label="مكتملة"
                  value={reviews.filter(r => r.status === "Completed" || r.status === "Approved").length}
                  icon={<CheckCircle className="h-4 w-4 text-green-500" />}
                />
                <StatCard
                  label="قيد المراجعة"
                  value={reviews.filter(r => r.status === "In Progress").length}
                  icon={<Clock className="h-4 w-4 text-blue-500" />}
                />
                <StatCard
                  label="معلقة"
                  value={reviews.filter(r => r.status === "Pending").length}
                  icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* اللوحة الجانبية */}
        <div className="space-y-6">
          {/* حالة المهمة */}
          <Card>
            <CardHeader>
              <CardTitle>حالة المهمة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusItem
                label="الحالة الحالية"
                value={getStatusBadge(assignment.status)}
              />
              <StatusItem
                label="التأخير"
                value={
                  assignment.isOverdue ? (
                    <Badge variant="destructive">متأخرة</Badge>
                  ) : (
                    <Badge variant="outline">ضمن الموعد</Badge>
                  )
                }
              />
              <StatusItem
                label="عدد المراجعات"
                value={assignment.reviewCount?.toString() || "0"}
              />
            </CardContent>
          </Card>

          {/* الإجراءات السريعة */}
          <Card>
            <CardHeader>
              <CardTitle>الإجراءات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => router.push(`/reviewer/assignments/${assignmentId}/review`)}
              >
                <Play className="h-4 w-4 ml-2" />
                بدء المراجعة
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => router.push("/reviewer/reviews")}
              >
                <Eye className="h-4 w-4 ml-2" />
                عرض جميع المراجعات
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* قائمة المراجعات الأخيرة */}
      {reviews.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>المراجعات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.slice(0, 5).map((review) => (
                <div
                  key={review.reviewId}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">مراجعة #{review.reviewId}</div>
                      <div className="text-sm text-muted-foreground">
                        {review.qualityScore && `درجة الجودة: ${review.qualityScore}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(review.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewReview(review.reviewId)}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// المكونات المساعدة
const InfoRow = ({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: React.ReactNode; 
  icon?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground flex items-center gap-1">
      {icon}
      {label}:
    </span>
    <span className="font-medium">{value}</span>
  </div>
);

const StatCard = ({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode;
}) => (
  <div className="text-center p-3 border rounded-lg">
    <div className="flex justify-center mb-1">{icon}</div>
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
);

const StatusItem = ({ 
  label, 
  value 
}: { 
  label: string; 
  value: React.ReactNode;
}) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-muted-foreground">{label}:</span>
    <span>{value}</span>
  </div>
);