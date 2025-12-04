// src/app/translator/projects/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle, AlertTriangle, Clock, BookOpen, Edit, Save } from "lucide-react";
import { Project, Assignment, ParagraphResponseDto } from "@/types";

interface CreateTranslationDto {
  paragraphId: number;
  assignmentId: number;
  translatedText: string;
}

interface UpdateTranslationDto {
  translatedText: string;
}

export default function TranslatorProjectDetailsPage() {
  const params = useParams();
  const projectId = parseInt(params.id as string, 10);
  const router = useRouter();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [paragraphs, setParagraphs] = useState<ParagraphResponseDto[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTranslation, setEditingTranslation] = useState<{ [key: number]: string }>({});
  const [saving, setSaving] = useState<{ [key: number]: boolean }>({});

  // 🔧 دالة مساعدة لتنسيق التاريخ
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'غير محدد';
    try {
      return new Date(dateString).toLocaleDateString('ar-EG');
    } catch {
      return 'تاريخ غير صالح';
    }
  };

  useEffect(() => {
    if (user?.userId && projectId) {
      setLoading(true);
      Promise.all([
        fetchProjectDetails(),
        fetchProjectParagraphs(),
        fetchUserAssignment()
      ]).finally(() => setLoading(false));
    }
  }, [user, projectId]);

  const fetchProjectDetails = async () => {
    try {
      const data = await apiClient.get(`Projects/${projectId}`);
      setProject(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في جلب تفاصيل المشروع",
      });
      router.push('/translator/projects');
    }
  };

  const fetchProjectParagraphs = async () => {
    try {
      const data = await apiClient.get(`Paragraphs/project/${projectId}`);
      setParagraphs(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في جلب فقرات المشروع",
      });
    }
  };

  const fetchUserAssignment = async () => {
    if (!user) return;
    try {
      const userAssignmentsData = await apiClient.get(`Assignments/user/${user.userId}`);
      const userAssignment = userAssignmentsData?.find((a: Assignment) => a.projectId === projectId && a.role === 'Translator');
      setAssignment(userAssignment || null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في جلب معلومات المهمة",
      });
    }
  };

  const getStatusBadge = (translations: ParagraphResponseDto['translations']) => {
    if (!translations || translations.length === 0) {
      return <Badge variant="outline">غير مترجمة</Badge>;
    }
    const lastTranslation = translations[translations.length - 1];
    switch (lastTranslation.status) {
      case "Draft":
        return <Badge variant="outline">مسودة</Badge>;
      case "Completed":
        return <Badge variant="success">مكتملة</Badge>;
      case "In Review":
        return <Badge variant="warning">قيد المراجعة</Badge>;
      case "Approved":
        return <Badge variant="secondary">تمت الموافقة</Badge>;
      case "Rejected":
        return <Badge variant="destructive">مرفوضة</Badge>;
      default:
        return <Badge>{lastTranslation.status}</Badge>;
    }
  };

  const handleTranslate = async (paragraphId: number) => {
    if (!assignment || !editingTranslation[paragraphId]) return;

    const translationText = editingTranslation[paragraphId].trim();
    if (!translationText) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى إدخال الترجمة",
      });
      return;
    }

    setSaving(prev => ({ ...prev, [paragraphId]: true }));

    try {
      const existingTranslation = paragraphs.find(p => p.paragraphId === paragraphId)?.translations?.[0];
      if (existingTranslation) {
        await apiClient.put(`Translations/${existingTranslation.translationId}`, {
          translatedText: translationText
        } as UpdateTranslationDto);
        toast({
          title: "نجاح",
          description: "تم تحديث الترجمة بنجاح",
        });
      } else {
        await apiClient.post("Translations", {
          paragraphId,
          assignmentId: assignment.assignmentId,
          translatedText: translationText
        } as CreateTranslationDto);
        toast({
          title: "نجاح",
          description: "تم إنشاء الترجمة بنجاح",
        });
      }
      fetchProjectParagraphs();
    } catch (error) {
      // تم التعامل مع الخطأ داخل apiClient
    } finally {
      setSaving(prev => ({ ...prev, [paragraphId]: false }));
    }
  };

  const handleInputChange = (paragraphId: number, value: string) => {
    setEditingTranslation(prev => ({ ...prev, [paragraphId]: value }));
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project || !assignment) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold mb-2">المشروع غير متوفر</h1>
        <p className="text-muted-foreground">لا يمكن الوصول إلى تفاصيل هذا المشروع أو المهمة.</p>
        <Button className="mt-4" onClick={() => router.push('/translator/projects')}>
          العودة إلى المشاريع
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{project.projectName}</h1>
        <div className="flex items-center gap-4">
          {getStatusBadge(assignment ? assignment.status === 'Completed' ? [{ translationId: 0, status: 'Completed', translatedText: '', translatorName: '', createdAt: '', targetLanguageName: '' }] : [] : [])}
          <Badge variant="outline">
            {assignment.targetLanguageName} ({assignment.targetLanguageCode})
          </Badge>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>معلومات المشروع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>اللغة المصدر</Label>
              <p>{project.sourceLanguageName} ({project.sourceLanguageCode})</p>
            </div>
            <div>
              <Label>عدد الفقرات</Label>
              <p>{project.totalParagraphs}</p>
            </div>
            <div>
              <Label>عدد الكلمات</Label>
              <p>{project.wordCount}</p>
            </div>
            <div>
              <Label>الحالة</Label>
              <p>{project.status}</p>
            </div>
            {/* 🔧 الحل: استخدام دالة formatDate */}
            <div>
              <Label>الموعد النهائي</Label>
              <p>{formatDate(assignment.deadline)}</p>
            </div>
          </div>
          {project.description && (
            <div className="mt-4">
              <Label>الوصف</Label>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>فقرات المشروع</CardTitle>
        </CardHeader>
        <CardContent>
          {paragraphs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">لا توجد فقرات في هذا المشروع.</p>
          ) : (
            <div className="space-y-6">
              {paragraphs.map(paragraph => {
                const lastTranslation = paragraph.translations?.[0];
                const currentText = editingTranslation[paragraph.paragraphId] ?? lastTranslation?.translatedText ?? '';
                const isSaving = saving[paragraph.paragraphId] ?? false;

                return (
                  <Card key={paragraph.paragraphId} className="border">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">الفقرة #{paragraph.position}</CardTitle>
                        {getStatusBadge(paragraph.translations)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {paragraph.originalText}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`translation-${paragraph.paragraphId}`}>الترجمة</Label>
                          <Textarea
                            id={`translation-${paragraph.paragraphId}`}
                            value={currentText}
                            onChange={(e) => handleInputChange(paragraph.paragraphId, e.target.value)}
                            placeholder="اكتب الترجمة هنا..."
                            rows={4}
                            disabled={isSaving}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleInputChange(paragraph.paragraphId, lastTranslation?.translatedText ?? '')}
                            disabled={isSaving}
                          >
                            تراجع
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleTranslate(paragraph.paragraphId)}
                            disabled={isSaving || !currentText.trim()}
                          >
                            {isSaving ? (
                              <>
                                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                جاري الحفظ...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                حفظ الترجمة
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
      }
