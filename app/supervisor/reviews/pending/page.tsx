// app/supervisor/reviews/pending/page.tsx - التصحيح الكامل
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";
import { ReviewResponseDto, AssignmentResponseDto, CreateApprovalDto } from "@/types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";

export default function SupervisorPendingReviewsPage() {
  const [reviews, setReviews] = useState<ReviewResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingIds, setSubmittingIds] = useState<number[]>([]);

  const { user, isLoading: authLoading } = useAuth(); // ✅ هنا تغيير مهم: isLoading وليس loading
  const router = useRouter();

  useEffect(() => {
    const fetchPendingReviews = async () => {
      if (authLoading) return;
      if (!user || user.userType !== "Supervisor") {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        const data: any[] = await apiClient.get("Reviews/pending");

        const pendingOnly = data.filter(
          (review) => !review.approvals || review.approvals.length === 0
        );

        setReviews(pendingOnly);
      } catch (err) {
        console.error("فشل جلب المراجعات المعلقة:", err);
        setError((err as Error).message || "فشل في جلب المراجعات");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingReviews();
  }, [user, authLoading, router]);

  // دالة مساعدة لجلب معرف المشروع واللغة
  const getReviewIds = (review: ReviewResponseDto): { projectId?: number; languageId?: number } => {
    // 🔧 استخدام any مؤقتاً لتفادي أخطاء TypeScript
    const anyReview = review as any;
    
    const projectId = 
      anyReview.projectId ||
      anyReview.project?.projectId ||
      anyReview.projectDetails?.id ||
      anyReview.translation?.projectId ||
      anyReview.translation?.project?.projectId;

    const languageId = 
      anyReview.targetLanguageId ||
      anyReview.languageId ||
      anyReview.targetLanguage?.languageId ||
      anyReview.language?.languageId ||
      anyReview.translation?.targetLanguageId ||
      anyReview.translation?.targetLanguage?.languageId;

    return { projectId, languageId };
  };

  const getSupervisorAssignmentId = async (
    projectId: number,
    targetLanguageId: number,
    userId: number
  ): Promise<number | null> => {
    try {
      const assignments: AssignmentResponseDto[] = await apiClient.get(
        `Assignments/user/${userId}`
      );

      const assignment = assignments.find(
        (a) =>
          a.projectId === projectId &&
          a.targetLanguageId === targetLanguageId &&
          a.role === "Supervisor" &&
          a.status !== "Cancelled"
      );

      return assignment?.assignmentId || null;
    } catch (err) {
      console.error("فشل في جلب مهمة المشرف:", err);
      return null;
    }
  };

  const handleApprove = async (review: ReviewResponseDto) => {
    if (!user) return;
    setSubmittingIds((prev) => [...prev, review.reviewId]);

    try {
      const { projectId, languageId } = getReviewIds(review);

      if (!projectId || !languageId) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "بيانات المشروع أو اللغة غير مكتملة.",
        });
        return;
      }

      const assignmentId = await getSupervisorAssignmentId(
        projectId,
        languageId,
        user.userId
      );

      if (!assignmentId) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "لا توجد مهمة مشرف نشطة لهذا المشروع واللغة.",
        });
        return;
      }

      const approvalData: CreateApprovalDto = {
        reviewId: review.reviewId,
        supervisorAssignmentId: assignmentId,
        finalText: review.reviewedText || "",
        selectedVersion: "Reviewed",
        decision: "Accepted",
      };

      await apiClient.post("Approvals", approvalData);

      toast({
        title: "تمت الموافقة",
        description: `تمت الموافقة على المراجعة #${review.reviewId}`,
      });

      setReviews((prev) => prev.filter((r) => r.reviewId !== review.reviewId));
    } catch (err) {
      toast({
        variant: "destructive",
        title: "فشل الموافقة",
        description: (err as Error).message || "يرجى المحاولة لاحقًا",
      });
    } finally {
      setSubmittingIds((prev) => prev.filter((id) => id !== review.reviewId));
    }
  };

  const handleReject = async (review: ReviewResponseDto) => {
    if (!user) return;
    setSubmittingIds((prev) => [...prev, review.reviewId]);

    try {
      const { projectId, languageId } = getReviewIds(review);

      if (!projectId || !languageId) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "بيانات المشروع أو اللغة غير مكتملة.",
        });
        return;
      }

      const assignmentId = await getSupervisorAssignmentId(
        projectId,
        languageId,
        user.userId
      );

      if (!assignmentId) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "لا توجد مهمة مشرف نشطة لهذا المشروع واللغة.",
        });
        return;
      }

      const approvalData: CreateApprovalDto = {
        reviewId: review.reviewId,
        supervisorAssignmentId: assignmentId,
        finalText: review.reviewedText || "",
        selectedVersion: "Original",
        decision: "Rejected",
        comments: "مرفوض من قبل المشرف",
      };

      await apiClient.post("Approvals", approvalData);

      toast({
        title: "تم الرفض",
        description: `تم رفض المراجعة #${review.reviewId}`,
      });

      setReviews((prev) => prev.filter((r) => r.reviewId !== review.reviewId));
    } catch (err) {
      toast({
        variant: "destructive",
        title: "فشل الرفض",
        description: (err as Error).message || "يرجى المحاولة لاحقًا",
      });
    } finally {
      setSubmittingIds((prev) => prev.filter((id) => id !== review.reviewId));
    }
  };

  // حالات التحميل
  if (authLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.userType !== "Supervisor") {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-2xl font-bold text-destructive">غير مصرح</h2>
        <p className="text-muted-foreground mt-2">
          يجب أن تكون مشرفاً للوصول إلى هذه الصفحة
        </p>
        <Button className="mt-4" onClick={() => router.push("/login")}>
          العودة إلى تسجيل الدخول
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-2xl font-bold text-destructive">خطأ</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  // وظائف مساعدة لعرض البيانات
  const getProjectName = (review: ReviewResponseDto): string => {
    const anyReview = review as any;
    return (
      anyReview.projectName ||
      anyReview.project?.projectName ||
      anyReview.projectDetails?.name ||
      anyReview.translation?.projectName ||
      "–"
    );
  };

  const getLanguageName = (review: ReviewResponseDto): string => {
    const anyReview = review as any;
    return (
      anyReview.targetLanguageName ||
      anyReview.languageName ||
      anyReview.targetLanguage?.languageName ||
      anyReview.language?.languageName ||
      anyReview.translation?.targetLanguageName ||
      "–"
    );
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">المراجعات بانتظار الموافقة</h1>
          <p className="text-muted-foreground mt-1">
            راجع واعتمد الترجمات التي أكملها المراجعون
          </p>
        </div>
        <div className="space-x-2 flex">
          <Button
            variant="outline"
            onClick={() => router.push("/supervisor/reviews/pending")}
            className="bg-muted"
          >
            المراجعات المعلقة
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/supervisor/approvals")}
          >
            الموافقات السابقة
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المراجعات</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">يتم التحميل...</p>
          ) : reviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              لا توجد مراجعات بانتظار الموافقة.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المشروع</TableHead>
                    <TableHead className="text-right">اللغة</TableHead>
                    <TableHead className="text-right">النص الأصلي</TableHead>
                    <TableHead className="text-right">النص المراجَع</TableHead>
                    <TableHead className="text-right">المراجع</TableHead>
                    <TableHead className="text-right">التقييم</TableHead>
                    <TableHead className="text-right">تاريخ المراجعة</TableHead>
                    <TableHead className="text-center w-32">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.reviewId}>
                      <TableCell className="font-medium">
                        {getProjectName(review)}
                      </TableCell>
                      <TableCell>{getLanguageName(review)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {review.originalText?.substring(0, 50) || "–"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {review.reviewedText?.substring(0, 50) || "–"}
                      </TableCell>
                      <TableCell>{review.reviewerName || "–"}</TableCell>
                      <TableCell>
                        {review.qualityScore ? (
                          <Badge variant="secondary">{review.qualityScore}/10</Badge>
                        ) : (
                          "–"
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(review.createdAt), "dd/MM/yyyy HH:mm", { locale: ar })}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                         <Button
  size="sm"
  variant="default"
  className="bg-green-600 hover:bg-green-700 text-white"
  onClick={() => handleApprove(review)}
  disabled={submittingIds.includes(review.reviewId)}
>
  ✅
</Button>

<Button
  size="sm"
  variant="destructive"
  onClick={() => handleReject(review)}
  disabled={submittingIds.includes(review.reviewId)}
>
  ❌
</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
