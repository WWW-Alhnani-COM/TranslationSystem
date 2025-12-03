"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import type { ReviewResponseDto, ApprovalInfoDto, TranslationResponseDto, Assignment } from "@/types";
import {
  Loader2,
  FileText,
  User,
  CheckCircle,
  AlertTriangle,
  Eye,
  Clock,
  MessageSquare,
  Star,
  ShieldCheck,
  ArrowLeft,
  Calendar,
  Languages,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useRouter, useParams } from "next/navigation";

export default function ReviewDetailPage() {
  const params = useParams();
  const reviewId = parseInt(params.id as string, 10);
  const router = useRouter();
  const { user } = useAuth();
  const [review, setReview] = useState<ReviewResponseDto | null>(null);
  const [translation, setTranslation] = useState<TranslationResponseDto | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [qualityScore, setQualityScore] = useState<number | "">("");
  const [comments, setComments] = useState("");
  const [reviewedText, setReviewedText] = useState("");

  useEffect(() => {
    if (reviewId) {
      fetchReviewData();
    }
  }, [reviewId]);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      
      // جلب بيانات المراجعة الأساسية
      const reviewData = await apiClient.get(`Reviews/${reviewId}`);
      setReview(reviewData);
      setQualityScore(reviewData.qualityScore ?? "");
      setComments(reviewData.comments ?? "");
      setReviewedText(reviewData.reviewedText ?? "");

      // جلب بيانات الترجمة المرتبطة
      if (reviewData.translationId) {
        await fetchTranslationData(reviewData.translationId);
      }

    } catch (error) {
      console.error("Error fetching review:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في تحميل تفاصيل المراجعة",
      });
      router.push("/reviewer/reviews");
    } finally {
      setLoading(false);
    }
  };

  const fetchTranslationData = async (translationId: number) => {
    try {
      const translationData = await apiClient.get(`Translations/${translationId}`);
      setTranslation(translationData);

      // جلب بيانات المهمة المرتبطة
      if (translationData.assignmentId) {
        await fetchAssignmentData(translationData.assignmentId);
      }
    } catch (error) {
      console.error("Error fetching translation:", error);
    }
  };

  const fetchAssignmentData = async (assignmentId: number) => {
    try {
      const assignmentData = await apiClient.get(`Assignments/${assignmentId}`);
      setAssignment(assignmentData);
    } catch (error) {
      console.error("Error fetching assignment:", error);
    }
  };

  const handleSave = async () => {
    if (!review) return;

    try {
      setSubmitting(true);
      await apiClient.put(`Reviews/${reviewId}`, {
        reviewedText: reviewedText || review.reviewedText,
        qualityScore: qualityScore || review.qualityScore,
        comments: comments || review.comments,
        status: "In Progress",
      });
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ المراجعة بنجاح",
      });
      fetchReviewData(); // تحديث البيانات
    } catch (error) {
      console.error("Error saving review:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في حفظ المراجعة",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!review) return;

    const finalScore = typeof qualityScore === "number" ? qualityScore : 0;
    if (finalScore < 1 || finalScore > 10) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "درجة الجودة يجب أن تكون بين 1 و 10",
      });
      return;
    }

    try {
      setSubmitting(true);
      // تحديث المراجعة أولًا
      await apiClient.put(`Reviews/${reviewId}`, {
        reviewedText: reviewedText || review.reviewedText,
        qualityScore: finalScore,
        comments: comments || review.comments,
        status: "Submitted",
      });
      
      // ثم تقديمها
      await apiClient.patch(`Reviews/${reviewId}/submit`);
      
      toast({
        title: "تم التقديم بنجاح",
        description: "تم تقديم المراجعة للمشرف",
      });
      fetchReviewData(); // تحديث الحالة
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        variant: "destructive",
        title: "فشل التقديم",
        description: "حدث خطأ أثناء تقديم المراجعة",
      });
    } finally {
      setSubmitting(false);
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
      default:
        return <Badge>{status || "غير معروف"}</Badge>;
    }
  };

  const getQualityStars = (score: number | null | undefined) => {
    if (!score) return null;
    return (
      <div className="flex items-center gap-1">
        {[...Array(10)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < score ? "text-yellow-500 fill-current" : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm font-medium mr-2">({score}/10)</span>
      </div>
    );
  };

  // الحصول على اسم المترجم من بيانات الترجمة أو المهمة
  const getTranslatorName = () => {
    if (translation?.translatorName) {
      return translation.translatorName;
    }
    if (assignment?.userName) {
      return assignment.userName;
    }
    return "غير محدد";
  };

  // الحصول على اللغة المستهدفة من بيانات الترجمة أو المهمة
  const getTargetLanguage = () => {
    if (translation?.targetLanguageName) {
      return translation.targetLanguageName;
    }
    if (assignment?.targetLanguageName) {
      return assignment.targetLanguageName;
    }
    return "غير محدد";
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="container mx-auto py-10 text-center">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">المراجعة غير موجودة</h2>
        <Button className="mt-4" onClick={() => router.push("/reviewer/reviews")}>
          العودة إلى المراجعات
        </Button>
      </div>
    );
  }

  const canEdit = review.status === "Pending" || review.status === "In Progress";

  return (
    <div className="container mx-auto py-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/reviewer/reviews")}>
            <ArrowLeft className="h-4 w-4 ml-2" />
            العودة
          </Button>
          <div>
            <h1 className="text-3xl font-bold">مراجعة #{review.reviewId}</h1>
            <p className="text-muted-foreground mt-1">عرض وتحرير المراجعة</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge>{review.projectName || "غير محدد"}</Badge>
          {getStatusBadge(review.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* معلومات أساسية */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              معلومات المراجعة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow 
              label="المترجم" 
              value={getTranslatorName()} 
              icon={<User className="h-4 w-4" />}
            />
            <InfoRow 
              label="المراجع" 
              value={review.reviewerName || "غير محدد"} 
              icon={<User className="h-4 w-4" />}
            />
            <InfoRow 
              label="الحالة" 
              value={getStatusBadge(review.status)} 
            />
            <InfoRow 
              label="اللغة المستهدفة" 
              value={getTargetLanguage()}
              icon={<Languages className="h-4 w-4" />}
            />
            <InfoRow 
              label="تاريخ الإنشاء" 
              value={new Date(review.createdAt).toLocaleDateString("ar-EG")}
              icon={<Calendar className="h-4 w-4" />}
            />
            {review.updatedAt && (
              <InfoRow 
                label="آخر تحديث" 
                value={new Date(review.updatedAt).toLocaleDateString("ar-EG")}
                icon={<Calendar className="h-4 w-4" />}
              />
            )}
            {review.qualityScore && (
              <InfoRow 
                label="درجة الجودة" 
                value={getQualityStars(review.qualityScore)}
                icon={<Star className="h-4 w-4 text-yellow-500" />}
              />
            )}
            {translation && (
              <InfoRow 
                label="معرف الترجمة" 
                value={translation.translationId}
                icon={<FileText className="h-4 w-4" />}
              />
            )}
            {assignment && (
              <InfoRow 
                label="معرف المهمة" 
                value={assignment.assignmentId}
                icon={<FileText className="h-4 w-4" />}
              />
            )}
          </CardContent>
        </Card>

        {/* المحتوى */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>محتوى المراجعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* النص الأصلي */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-1 mb-2">
                <FileText className="h-4 w-4" />
                النص الأصلي
              </Label>
              <Card className="p-4 bg-muted/30">
                <p className="whitespace-pre-line text-sm leading-relaxed">
                  {review.originalText || translation?.originalText || "— لا يوجد نص —"}
                </p>
              </Card>
            </div>

            {/* الترجمة الأصلية */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-1 mb-2">
                <FileText className="h-4 w-4" />
                الترجمة الأصلية
              </Label>
              <Card className="p-4 bg-muted/30">
                <p className="whitespace-pre-line text-sm leading-relaxed">
                  {review.translatedText || translation?.translatedText || "— لم تُترجم بعد —"}
                </p>
              </Card>
            </div>

            {/* النص المراجَع */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-1 mb-2">
                <Eye className="h-4 w-4" />
                النص المراجَع
                {!canEdit && <Badge variant="outline" className="mr-2">للقراءة فقط</Badge>}
              </Label>
              <Textarea
                value={reviewedText}
                onChange={(e) => setReviewedText(e.target.value)}
                readOnly={!canEdit}
                placeholder="أدخل النص المراجع هنا..."
                className="min-h-[120px] font-mono text-sm leading-relaxed"
              />
              {review.changesMade && (
                <div className="mt-2">
                  <Label className="text-sm text-muted-foreground">التغييرات المطبقة:</Label>
                  <p className="text-sm text-muted-foreground mt-1">{review.changesMade}</p>
                </div>
              )}
            </div>

            {/* تعديل التعليقات ودرجة الجودة */}
            {canEdit && (
              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label className="flex items-center gap-1 mb-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    درجة الجودة (1–10)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={qualityScore}
                      onChange={(e) => setQualityScore(e.target.valueAsNumber || "")}
                      className="w-20"
                    />
                    {qualityScore && (
                      <div className="flex items-center gap-1">
                        {[...Array(10)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < (qualityScore as number) 
                                ? "text-yellow-500 fill-current" 
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-1 mb-2">
                    <MessageSquare className="h-4 w-4" />
                    التعليقات والملاحظات
                  </Label>
                  <Textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="أضف ملاحظاتك حول الترجمة..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={handleSave} 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        جاري الحفظ...
                      </>
                    ) : (
                      "حفظ كمسودة"
                    )}
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        جاري التقديم...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 ml-2" />
                        تقديم المراجعة
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* التعليقات الحالية */}
            {review.comments && !canEdit && (
              <div className="border-t pt-4">
                <Label className="text-sm font-medium flex items-center gap-1 mb-2">
                  <MessageSquare className="h-4 w-4" />
                  التعليقات
                </Label>
                <Card className="p-4 bg-blue-50">
                  <p className="whitespace-pre-line text-sm">{review.comments}</p>
                </Card>
              </div>
            )}

            {/* الموافقات (إن وُجدت) */}
            {review.approvals && review.approvals.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3 flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  الموافقات
                </h3>
                <div className="space-y-3">
                  {review.approvals.map((approval: ApprovalInfoDto) => (
                    <Card 
                      key={approval.approvalId} 
                      className={`p-4 ${
                        approval.decision === "Approved" 
                          ? "bg-green-50 border-green-200" 
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{approval.supervisorName}</span>
                        </div>
                        <Badge variant={approval.decision === "Approved" ? "success" : "destructive"}>
                          {approval.decision === "Approved" ? "موافق" : "مرفوض"}
                        </Badge>
                      </div>
                      {approval.finalText && (
                        <div className="mb-2">
                          <Label className="text-sm text-muted-foreground">النص النهائي:</Label>
                          <p className="text-sm whitespace-pre-line mt-1 bg-white p-2 rounded">
                            {approval.finalText}
                          </p>
                        </div>
                      )}
                      {approval.comments && (
                        <div className="mb-2">
                          <Label className="text-sm text-muted-foreground">تعليقات المشرف:</Label>
                          <p className="text-sm whitespace-pre-line mt-1 bg-white p-2 rounded">
                            {approval.comments}
                          </p>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>
                          {new Date(approval.approvedAt).toLocaleDateString("ar-EG")}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// مكون مساعد لعرض المعلومات
const InfoRow = ({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: React.ReactNode; 
  icon?: React.ReactNode;
}) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-muted-foreground flex items-center gap-1">
      {icon}
      {label}:
    </span>
    <span className="font-medium text-right">{value}</span>
  </div>
);