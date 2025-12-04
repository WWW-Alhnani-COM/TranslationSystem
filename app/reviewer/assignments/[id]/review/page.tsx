// app/reviewer/assignments/[id]/review/page.tsx
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

import {
  AssignmentResponseDto,
  ProjectResponseDto,
  ParagraphResponseDto,
  TranslationResponseDto,
  CreateReviewDto,
  ReviewResponseDto,
  CreateNotificationDto, // تأكد من تعريف هذا النوع
} from "@/types";

// --- تعريف النوع ---
interface ReviewPageState {
  assignment: AssignmentResponseDto | null;
  project: ProjectResponseDto | null;
  paragraphs: ParagraphResponseDto[];
  translations: TranslationResponseDto[];
  loading: boolean;
  submitting: boolean;
  formData: {
    reviewedText: string;
    changesMade: string;
    qualityScore: number | null;
    comments: string;
  };
  selectedTranslationId: number | null;
}

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const assignmentId = parseInt(id, 10);
  const router = useRouter();

  const [state, setState] = useState<ReviewPageState>({
    assignment: null,
    project: null,
    paragraphs: [],
    translations: [],
    loading: true,
    submitting: false,
    formData: {
      reviewedText: "",
      changesMade: "",
      qualityScore: 5,
      comments: "",
    },
    selectedTranslationId: null,
  });

  useEffect(() => {
    if (isNaN(assignmentId)) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "معرف المهمة غير صحيح.",
      });
      router.push("/reviewer/assignments");
      return;
    }

    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true }));

        const assignment: AssignmentResponseDto = await apiClient.get(`Assignments/${assignmentId}`);
        if (!assignment || assignment.role !== 'Reviewer') {
          throw new Error("المهمة غير موجودة أو ليست لمراجع.");
        }

        const project: ProjectResponseDto = await apiClient.get(`Projects/${assignment.projectId}`);

        const paragraphs: ParagraphResponseDto[] = await apiClient.get(`Paragraphs/project/${assignment.projectId}`);

        let translatorAssignmentId: number | null = null;
        const projectAssignments: AssignmentResponseDto[] = await apiClient.get(`Assignments/project/${assignment.projectId}`);
        const translatorAssignment = projectAssignments.find(
          a => a.targetLanguageId === assignment.targetLanguageId && a.role === 'Translator'
        );

        if (translatorAssignment) {
          translatorAssignmentId = translatorAssignment.assignmentId;
        } else {
          console.warn("لا توجد مهمة مترجم مرتبطة بهذا المشروع واللغة.");
        }

        let translations: TranslationResponseDto[] = [];
        if (translatorAssignmentId) {
          translations = await apiClient.get(`Translations/assignment/${translatorAssignmentId}`);
        }

        setState(prev => ({
          ...prev,
          assignment,
          project,
          paragraphs,
          translations,
          loading: false,
        }));

      if (translations.length > 0 && !state.selectedTranslationId) {
          const firstTranslation = translations[0];
          setState(prevState => ({
            ...prevState,
            selectedTranslationId: firstTranslation.translationId,
            formData: {
              ...prevState.formData,
              reviewedText: firstTranslation.translatedText,
            },
          }));
        }
      } catch (error: any) {
        console.error("Error fetching data for review:", error);
        toast({
          variant: "destructive",
          title: "خطأ",
          description: error.message || "فشل في جلب البيانات.",
        });
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, [assignmentId, router]);

  const handleTranslationSelect = (translationId: number) => {
    const translation = state.translations.find(t => t.translationId === translationId);
    if (translation) {
      setState(prevState => ({
        ...prevState,
        selectedTranslationId: translationId,
        formData: {
          ...prevState.formData,
          reviewedText: translation.translatedText,
        },
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        [name]: value,
      },
    }));
  };

  const handleSelectChange = (value: string) => {
    setState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        qualityScore: parseInt(value, 10),
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.selectedTranslationId) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى تحديد ترجمة للمراجعة.",
      });
      return;
    }

    if (!state.formData.reviewedText.trim()) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى إدخال النص المُراجَع.",
      });
      return;
    }

    const reviewData: CreateReviewDto = {
      translationId: state.selectedTranslationId,
      reviewerAssignmentId: assignmentId,
      reviewedText: state.formData.reviewedText,
      changesMade: state.formData.changesMade || undefined,
      qualityScore: state.formData.qualityScore || undefined,
      comments: state.formData.comments || undefined,
      status: "Completed",
    };

    try {
      setState(prev => ({ ...prev, submitting: true }));
      const createdReview: ReviewResponseDto = await apiClient.post("Reviews", reviewData);

      // --- إرسال الإشعارات ---
      // 1. جلب مهمة المشرف
      let supervisorUserId: number | null = null;
      if (state.assignment) {
        const projectAssignments: AssignmentResponseDto[] = await apiClient.get(`Assignments/project/${state.assignment.projectId}`);
        const supervisorAssignment = projectAssignments.find(
          a => a.targetLanguageId === state.assignment!.targetLanguageId && a.role === 'Supervisor'
        );
        if (supervisorAssignment) {
          supervisorUserId = supervisorAssignment.userId; // معرف المستخدم من المهمة
        }
      }

      // 2. جلب معرف مدخل البيانات (منشئ المشروع)
      const dataEntryUserId = state.project?.createdBy || null;

      // 3. إنشاء إشعارات
      if (dataEntryUserId) {
        const dataEntryNotification: CreateNotificationDto = {
          userId: dataEntryUserId,
          title: "تمت مراجعة فقرة",
          message: `تمت مراجعة فقرة في مشروع "${state.project?.projectName || 'Project'}". التقييم: ${state.formData.qualityScore || 'N/A'}. التعليق: ${state.formData.comments || 'N/A'}.`,
          relatedType: "Review",
          relatedId: createdReview.reviewId,
        };
        await apiClient.post("Notifications", dataEntryNotification);
      }

      if (supervisorUserId) {
        const supervisorNotification: CreateNotificationDto = {
          userId: supervisorUserId,
          title: "مهمة مراجعة مكتملة",
          message: `تمت مراجعة فقرة من قبل مراجع في مشروع "${state.project?.projectName || 'Project'}". التقييم: ${state.formData.qualityScore || 'N/A'}. التعليق: ${state.formData.comments || 'N/A'}.`,
          relatedType: "Review",
          relatedId: createdReview.reviewId,
        };
        await apiClient.post("Notifications", supervisorNotification);
      }

      toast({
        title: "نجاح",
        description: "تم إرسال المراجعة وإشعارات المتابعة بنجاح.",
      });

      setState(prev => ({
        ...prev,
        submitting: false,
        translations: prev.translations.map(t =>
          t.translationId === state.selectedTranslationId
            ? { ...t, status: createdReview.status }
            : t
        ),
      }));
    } catch (error: any) {
      console.error("Error submitting review or notifications:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "فشل في إرسال المراجعة أو الإشعارات.",
      });
      setState(prev => ({ ...prev, submitting: false }));
    }
  };

  if (state.loading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!state.assignment || !state.project) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-2xl font-bold">المهمة غير موجودة</h2>
        <p className="text-muted-foreground mt-2">المهمة المطلوبة غير موجودة أو أنك لا تملك صلاحيات الوصول.</p>
        <Button className="mt-4" onClick={() => router.push("/reviewer/assignments")}>
          العودة إلى المهام
        </Button>
      </div>
    );
  }

  const selectedTranslation = state.translations.find(t => t.translationId === state.selectedTranslationId);
  const selectedParagraph = selectedTranslation
    ? state.paragraphs.find(p => p.paragraphId === selectedTranslation.paragraphId)
    : null;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">مراجعة المهمة</h1>
          <p className="text-muted-foreground">
            مشروع: <span className="font-medium">{state.project.projectName}</span> | لغة الهدف: <span className="font-medium">{state.assignment.targetLanguageName}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            مُعيّن لك بتاريخ: {new Date(state.assignment.assignedAt).toLocaleDateString('ar-EG')}
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {state.assignment.role}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>قائمة الترجمات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {state.translations.length === 0 ? (
                <p className="text-muted-foreground text-sm">لا توجد ترجمات لReviewer لمراجعتها.</p>
              ) : (
                state.translations.map((translation) => {
                  const paragraph = state.paragraphs.find(p => p.paragraphId === translation.paragraphId);
                  return (
                    <div
                      key={translation.translationId}
                      className={`p-3 rounded-md border cursor-pointer transition-colors ${
                        state.selectedTranslationId === translation.translationId
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => handleTranslationSelect(translation.translationId)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">فقرة #{paragraph?.position || 'N/A'}</span>
                        <Badge variant="outline" className="text-xs">
                          {translation.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {translation.translatedText.substring(0, 50)}...
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>نموذج المراجعة</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTranslation && selectedParagraph ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="originalText">النص الأصلي (فقرة #{selectedParagraph.position})</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md border">
                    <p className="whitespace-pre-line">{selectedParagraph.originalText}</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="translatedText">الترجمة الحالية</Label>
                  <div className="mt-1 p-3 bg-muted/50 rounded-md border">
                    <p className="whitespace-pre-line">{selectedTranslation.translatedText}</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="reviewedText">النص المُراجَع *</Label>
                  <Textarea
                    id="reviewedText"
                    name="reviewedText"
                    value={state.formData.reviewedText}
                    onChange={handleInputChange}
                    placeholder="أدخل النص المُراجَع هنا..."
                    rows={6}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="changesMade">التغييرات المُدخلة</Label>
                  <Input
                    id="changesMade"
                    name="changesMade"
                    value={state.formData.changesMade}
                    onChange={handleInputChange}
                    placeholder="وصف التغييرات (اختياري)"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="qualityScore">تقييم الجودة</Label>
                  <Select
                    value={state.formData.qualityScore?.toString() || "5"}
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="اختر تقييمًا" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <SelectItem key={score} value={score.toString()}>
                          {score}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="comments">التعليقات</Label>
                  <Textarea
                    id="comments"
                    name="comments"
                    value={state.formData.comments}
                    onChange={handleInputChange}
                    placeholder="أضف تعليقاتك (اختياري)"
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <Button type="submit" disabled={state.submitting} className="w-full">
                  {state.submitting ? "جاري الإرسال..." : "إرسال المراجعة"}
                </Button>
              </form>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {state.translations.length === 0 ? "لا توجد ترجمات لReviewer لمراجعتها." : "يرجى تحديد ترجمة للمراجعة."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
