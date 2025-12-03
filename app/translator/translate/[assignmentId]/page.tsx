// src/app/translator/translate/[assignmentId]/page.tsx
'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  AlertCircle, 
  Loader2,
  Languages,
  Clock,
  FileText,
  User,
  Target,
  Eye
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5296/api';

// أنواع البيانات
interface Assignment {
  assignmentId: number;
  projectId: number;
  projectName: string;
  userId: number;
  userName: string;
  role: string;
  targetLanguageId: number;
  targetLanguageName: string;
  targetLanguageCode: string;
  status: string;
  assignedAt: string;
  deadline: string;
  completedAt: string | null;
  isOverdue: boolean;
  translationCount: number;
  reviewCount: number;
}

interface Project {
  projectId: number;
  projectName: string;
  description: string;
  sourceLanguageId: number;
  sourceLanguageName: string;
  sourceLanguageCode: string;
  createdBy: number;
  creatorName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  totalParagraphs: number;
  wordCount: number;
  targetLanguages: {
    languageId: number;
    languageName: string;
    languageCode: string;
  }[];
}

interface Paragraph {
  paragraphId: number;
  projectId: number;
  projectName: string;
  originalText: string;
  paragraphType: string;
  position: number;
  wordCount: number;
  createdAt: string;
  translatedText?: string;
  translationId?: number;
  status?: string;
}

interface Translation {
  translationId: number;
  paragraphId: number;
  assignmentId: number;
  translatedText: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  finalWordCount: number;
}

export default function TranslatePage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const resolvedParams = use(params);
  const assignmentId = parseInt(resolvedParams.assignmentId, 10);
  const { user } = useAuth();
  const router = useRouter();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [deadlineWarning, setDeadlineWarning] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // جلب تفاصيل المهمة والمشروع والفقرات والترجمات
  const fetchData = async () => {
    if (!assignmentId || !user?.userId) {
      setError('معرف المهمة أو المستخدم غير صالح');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('جاري تحميل البيانات للمهمة:', assignmentId);

      // 1. جلب تفاصيل المهمة
      const assignmentResponse = await fetch(`${API_BASE_URL}/Assignments/${assignmentId}`);
      if (!assignmentResponse.ok) {
        throw new Error('فشل في تحميل تفاصيل المهمة');
      }
      const assignmentData = await assignmentResponse.json();
      if (!assignmentData.success) {
        throw new Error(assignmentData.message || 'فشل في تحميل تفاصيل المهمة');
      }
      setAssignment(assignmentData.data);
      console.log('تم تحميل المهمة:', assignmentData.data);

      // 2. جلب تفاصيل المشروع
      const projectResponse = await fetch(`${API_BASE_URL}/Projects/${assignmentData.data.projectId}`);
      if (!projectResponse.ok) {
        throw new Error('فشل في تحميل تفاصيل المشروع');
      }
      const projectData = await projectResponse.json();
      if (!projectData.success) {
        throw new Error(projectData.message || 'فشل في تحميل تفاصيل المشروع');
      }
      setProject(projectData.data);
      console.log('تم تحميل المشروع:', projectData.data);

      // 3. جلب فقرات المشروع - استخدام endpoint الصحيح
      const paragraphsResponse = await fetch(`${API_BASE_URL}/Paragraphs/project/${assignmentData.data.projectId}`);
      if (!paragraphsResponse.ok) {
        throw new Error('فشل في تحميل الفقرات');
      }
      const paragraphsData = await paragraphsResponse.json();
      if (!paragraphsData.success) {
        throw new Error(paragraphsData.message || 'فشل في تحميل الفقرات');
      }
      
      const projectParagraphs = paragraphsData.data || [];
      console.log('تم تحميل الفقرات:', projectParagraphs.length);

      if (projectParagraphs.length === 0) {
        throw new Error('لا توجد فقرات في هذا المشروع');
      }

      // 4. جلب الترجمات الحالية لهذه المهمة
      const translationsResponse = await fetch(`${API_BASE_URL}/Translations/assignment/${assignmentId}`);
      let existingTranslations: Translation[] = [];
      
      if (translationsResponse.ok) {
        const translationsData = await translationsResponse.json();
        if (translationsData.success) {
          existingTranslations = translationsData.data || [];
          console.log('تم تحميل الترجمات:', existingTranslations.length);
        }
      }

      // 5. دمج الفقرات مع الترجمات
      const paragraphsWithTranslations = projectParagraphs.map((paragraph: Paragraph) => {
        const translation = existingTranslations.find(t => t.paragraphId === paragraph.paragraphId);
        return {
          ...paragraph,
          translatedText: translation?.translatedText || '',
          translationId: translation?.translationId,
          status: translation?.status || 'Draft'
        };
      });

      setParagraphs(paragraphsWithTranslations);
      setTranslations(existingTranslations);
      
      // التحقق من اقتراب الموعد النهائي
      const deadlineDate = new Date(assignmentData.data.deadline);
      const now = new Date();
      const diffTime = deadlineDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 3 && diffDays >= 0) {
        setDeadlineWarning(true);
      }
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [assignmentId, user?.userId]);

  // الحصول على الترجمة الحالية للفقرة
  const getCurrentTranslation = (paragraphId: number): Translation | undefined => {
    return translations.find(t => t.paragraphId === paragraphId);
  };

  // حفظ أو تحديث الترجمة
  const saveTranslation = async (paragraphId: number, translatedText: string, status: string = 'Draft') => {
    const existingTranslation = getCurrentTranslation(paragraphId);
    
    try {
      // التحقق من وجود النص المترجم
      if (!translatedText.trim()) {
        throw new Error('نص الترجمة فارغ');
      }

      if (existingTranslation && existingTranslation.translationId > 0) {
        // تحديث الترجمة الموجودة
        const response = await fetch(`${API_BASE_URL}/Translations/${existingTranslation.translationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            translatedText: translatedText,
            status: status,
            finalWordCount: translatedText.split(/\s+/).filter(word => word.length > 0).length
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || 'فشل في تحديث الترجمة');
        }
        
        const updatedTranslation = await response.json();
        if (updatedTranslation.success) {
          // تحديث حالة الترجمات المحلية
          setTranslations(prev => 
            prev.map(t => 
              t.translationId === existingTranslation.translationId 
                ? { ...t, ...updatedTranslation.data, translatedText, status }
                : t
            )
          );
          return updatedTranslation.data;
        }
      } else {
        // إنشاء ترجمة جديدة
        const response = await fetch(`${API_BASE_URL}/Translations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paragraphId: paragraphId,
            assignmentId: assignmentId,
            translatedText: translatedText,
            status: status,
            finalWordCount: translatedText.split(/\s+/).filter(word => word.length > 0).length
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || 'فشل في حفظ الترجمة');
        }
        
        const newTranslation = await response.json();
        if (newTranslation.success) {
          // إضافة الترجمة الجديدة للحالة المحلية
          setTranslations(prev => [...prev, newTranslation.data]);
          
          // تحديث حالة الفقرة
          setParagraphs(prev => 
            prev.map(p => 
              p.paragraphId === paragraphId 
                ? { ...p, translationId: newTranslation.data.translationId, status: status }
                : p
            )
          );
          
          return newTranslation.data;
        }
      }
      
      return null;
    } catch (err: any) {
      console.error('Error saving translation:', err);
      throw err;
    }
  };

  // حفظ الترجمة تلقائيًا
  useEffect(() => {
    if (!autoSaveEnabled || currentParagraphIndex >= paragraphs.length) return;
    
    const currentParagraph = paragraphs[currentParagraphIndex];
    if (!currentParagraph) return;
    
    const currentTranslationText = currentParagraph.translatedText || '';
    if (!currentTranslationText.trim()) return;
    
    const saveDraft = async () => {
      setSaving(true);
      try {
        await saveTranslation(currentParagraph.paragraphId, currentTranslationText, 'Draft');
        console.log('تم الحفظ التلقائي للفقرة:', currentParagraph.paragraphId);
      } catch (err: any) {
        console.error('فشل في الحفظ التلقائي:', err);
      } finally {
        setSaving(false);
      }
    };

    const interval = setInterval(saveDraft, 30000); // كل 30 ثانية
    return () => clearInterval(interval);
  }, [currentParagraphIndex, paragraphs, assignmentId, autoSaveEnabled]);

  const handleTranslationChange = (value: string) => {
    const currentParagraph = paragraphs[currentParagraphIndex];
    if (!currentParagraph) return;

    // تحديث النص في الحالة المحلية للفقرة
    setParagraphs(prev => 
      prev.map((p, index) => 
        index === currentParagraphIndex 
          ? { ...p, translatedText: value, status: 'Draft' }
          : p
      )
    );
  };

  const handleNextParagraph = () => {
    if (currentParagraphIndex < paragraphs.length - 1) {
      setCurrentParagraphIndex(prev => prev + 1);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handlePrevParagraph = () => {
    if (currentParagraphIndex > 0) {
      setCurrentParagraphIndex(prev => prev - 1);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const saveCurrentDraft = async () => {
    if (currentParagraphIndex >= paragraphs.length) return;
    
    const currentParagraph = paragraphs[currentParagraphIndex];
    if (!currentParagraph) return;

    const currentTranslationText = currentParagraph.translatedText || '';
    if (!currentTranslationText.trim()) {
      setError('يرجى إدخال نص الترجمة أولاً');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSaving(true);
    try {
      await saveTranslation(currentParagraph.paragraphId, currentTranslationText, 'Draft');
      setSuccess('تم حفظ المسودة بنجاح!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'فشل في حفظ المسودة');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!assignment || paragraphs.length === 0) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      
      // التحقق من اكتمال جميع الترجمات
      const incompleteParagraphs = paragraphs.filter(paragraph => {
        const translationText = paragraph.translatedText || '';
        return !translationText.trim();
      });

      if (incompleteParagraphs.length > 0) {
        setError(`يوجد ${incompleteParagraphs.length} فقرة لم يتم ترجمتها بعد`);
        setTimeout(() => setError(null), 5000);
        setSubmitting(false);
        return;
      }

      // حفظ جميع الترجمات بحالة Submitted
      const savePromises = paragraphs.map(async (paragraph) => {
        const translationText = paragraph.translatedText || '';
        if (translationText.trim()) {
          return await saveTranslation(paragraph.paragraphId, translationText, 'Submitted');
        }
        return null;
      });

      await Promise.all(savePromises);

      // تحديث حالة المهمة إلى مكتملة
      const updateResponse = await fetch(`${API_BASE_URL}/Assignments/${assignmentId}/status/Completed`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => null);
        throw new Error(errorData?.message || 'فشل في تحديث حالة المهمة');
      }

      // إرسال إشعار للمشرفين
      try {
        await fetch(`${API_BASE_URL}/Notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: project?.createdBy || 1,
            title: 'تم الانتهاء من الترجمة',
            message: `تم الانتهاء من ترجمة المشروع "${project?.projectName}" للغة ${assignment?.targetLanguageName}`,
            relatedType: 'Assignment',
            relatedId: assignmentId
          })
        });
      } catch (notificationError) {
        console.error('فشل في إرسال الإشعار:', notificationError);
      }

      setSuccess('تم تقديم الترجمة بنجاح! سيتم مراجعتها قريباً.');
      
      // التوجيه بعد 3 ثوان
      setTimeout(() => {
        router.push('/translator/assignments');
      }, 3000);
    } catch (err: any) {
      console.error('فشل في تقديم الترجمة:', err);
      setError(err.message || 'فشل في تقديم الترجمة');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">جاري تحميل المهمة...</p>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              خطأ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
            <div className="flex gap-3 mt-4">
              <Button onClick={fetchData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                إعادة المحاولة
              </Button>
              <Button variant="outline" onClick={() => router.push('/translator/assignments')}>
                العودة إلى المهام
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assignment || paragraphs.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>مهمة غير موجودة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">لم يتم العثور على مهمة أو فقرات.</p>
            <Button onClick={() => router.push('/translator/assignments')} className="mt-4">
              العودة إلى قائمة المهام
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentParagraph = paragraphs[currentParagraphIndex];
  const currentTranslationText = currentParagraph.translatedText || '';
  const progress = ((currentParagraphIndex + 1) / paragraphs.length) * 100;
  const translatedCount = paragraphs.filter(p => (p.translatedText && p.translatedText.trim().length > 0)).length;

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* الهيدر */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => router.push('/translator/assignments')}
            className="mb-2 gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            العودة إلى المهام
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">ترجمة المشروع</h1>
          <p className="text-muted-foreground mt-1">
            {project?.projectName} - {assignment.targetLanguageName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={assignment.status === 'Completed' ? "default" : "outline"} 
                 className={assignment.status === 'Completed' ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"}>
            {assignment.status === 'Completed' ? 'مكتملة' : 'قيد التنفيذ'}
          </Badge>
          <div className="text-sm text-muted-foreground">
            {currentParagraphIndex + 1} من {paragraphs.length}
          </div>
        </div>
      </div>

      {/* معلومات المشروع */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              <span>منشئ المشروع: {project?.creatorName}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-500" />
              <span>إجمالي الفقرات: {paragraphs.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-purple-500" />
              <span>اللغة الهدف: {assignment.targetLanguageName}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تنبيه الموعد النهائي */}
      {deadlineWarning && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-yellow-500">
              <Clock className="w-5 h-5" />
              <p>
                <strong>تنبيه:</strong> المهمة تنتهي في {new Date(assignment.deadline).toLocaleDateString('ar-SA')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* رسالة النجاح أو الخطأ */}
      {success && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="w-5 h-5" />
              <p>{success}</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* التقدم العام */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>فقرة {currentParagraph?.position || currentParagraphIndex + 1}</CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {translatedCount} / {paragraphs.length} مكتملة
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}%
                </span>
                <Progress value={progress} className="h-2 w-32" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* النص الأصلي */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium flex items-center gap-2">
                  <Languages className="w-4 h-4 text-blue-500" />
                  النص الأصلي
                </h3>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                  {currentParagraph?.wordCount || 0} كلمة
                </Badge>
              </div>
              <div className="border rounded-lg p-4 bg-muted/30 min-h-[200px] max-h-[400px] overflow-y-auto">
                <p className="whitespace-pre-line leading-relaxed">
                  {currentParagraph?.originalText}
                </p>
              </div>
            </div>
            
            {/* الترجمة */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-500" />
                  الترجمة
                </h3>
                <div className="flex items-center gap-2">
                  {saving && (
                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      جاري الحفظ...
                    </Badge>
                  )}
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                    {currentTranslationText.length} حرف
                  </Badge>
                </div>
              </div>
              <Textarea
                ref={textareaRef}
                value={currentTranslationText}
                onChange={(e) => handleTranslationChange(e.target.value)}
                placeholder="اكتب الترجمة هنا..."
                className="min-h-[200px] max-h-[400px] font-sans"
                dir="rtl"
                autoFocus
              />
            </div>
          </div>
          
          {/* أزرار التحكم */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handlePrevParagraph} 
                disabled={currentParagraphIndex === 0}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                الفقرة السابقة
              </Button>
              <Button 
                variant="outline" 
                onClick={handleNextParagraph} 
                disabled={currentParagraphIndex === paragraphs.length - 1}
                className="gap-2"
              >
                الفقرة التالية
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex gap-2 flex-wrap justify-center">
              <Button 
                variant="outline" 
                onClick={() => router.push('/translator/assignments')}
                className="gap-2"
              >
                <Pause className="w-4 h-4" />
                حفظ وخروج
              </Button>
              <Button 
                variant="outline" 
                onClick={saveCurrentDraft} 
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    حفظ المسودة
                  </>
                )}
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || assignment.status === 'Completed'}
                className="gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري التقديم...
                  </>
                ) : (
                  <>
                    تقديم الترجمة
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* فقرات متبقية */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>الفقرات المتبقية</CardTitle>
          <CardDescription>
            {paragraphs.length - translatedCount} فقرة متبقية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {paragraphs.map((para, index) => {
              const isTranslated = Boolean(para.translatedText && para.translatedText.trim().length > 0);
              return (
                <Button
                  key={para.paragraphId}
                  variant={index === currentParagraphIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentParagraphIndex(index)}
                  className={`h-8 ${isTranslated ? 'border-green-500' : ''}`}
                >
                  {index + 1}
                  {isTranslated && (
                    <CheckCircle2 className="w-3 h-3 ml-1 text-green-500" />
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
