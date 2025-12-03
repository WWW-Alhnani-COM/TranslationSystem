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
  FileText
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://samali1-001-site1.stempurl.com/api';

export default function TranslatePage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const resolvedParams = use(params);
  const assignmentId = parseInt(resolvedParams.assignmentId, 10);
  const { user } = useAuth();
  const router = useRouter();
  
  const [assignment, setAssignment] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [paragraphs, setParagraphs] = useState<any[]>([]);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [deadlineWarning, setDeadlineWarning] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // جلب تفاصيل المهمة والمشروع والفقرات
  const fetchData = async () => {
    if (!assignmentId || !user?.userId) return;

    try {
      setLoading(true);
      setError(null);
      
      // جلب تفاصيل المهمة
      const assignmentResponse = await fetch(`${API_BASE_URL}/Assignments/${assignmentId}`);
      if (!assignmentResponse.ok) {
        throw new Error('فشل في تحميل تفاصيل المهمة');
      }
      const assignmentData = await assignmentResponse.json();
      if (!assignmentData.success) {
        throw new Error(assignmentData.message || 'فشل في تحميل تفاصيل المهمة');
      }
      setAssignment(assignmentData.data);
      
      // جلب تفاصيل المشروع
      const projectResponse = await fetch(`${API_BASE_URL}/Projects/${assignmentData.data.projectId}`);
      if (!projectResponse.ok) {
        throw new Error(' failure in loading project details');
      }
      const projectData = await projectResponse.json();
      if (!projectData.success) {
        throw new Error(projectData.message || ' failure in loading project details');
      }
      setProject(projectData.data);
      
      // جلب الفقرات
      const paragraphsResponse = await fetch(`${API_BASE_URL}/Paragraphs/assignment/${assignmentId}`);
      if (!paragraphsResponse.ok) {
        throw new Error(' failure in loading paragraphs');
      }
      const paragraphsData = await paragraphsResponse.json();
      if (!paragraphsData.success) {
        throw new Error(paragraphsData.message || ' failure in loading paragraphs');
      }
      setParagraphs(paragraphsData.data || []);
      
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
      setError(err.message || ' failure in loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [assignmentId, user?.userId]);

  // حفظ الترجمة تلقائيًا
  useEffect(() => {
    if (!autoSaveEnabled || currentParagraphIndex >= paragraphs.length) return;
    
    const currentParagraph = paragraphs[currentParagraphIndex];
    if (!currentParagraph || !currentParagraph.translatedText) return;
    
    const saveDraft = async () => {
      setSaving(true);
      try {
        const response = await fetch(`${API_BASE_URL}/Translations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignmentId: assignmentId,
            paragraphId: currentParagraph.paragraphId,
            translatedText: currentParagraph.translatedText,
            status: 'Draft'
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || ' failure in saving draft');
        }
      } catch (err: any) {
        console.error(' failure in saving draft:', err);
      } finally {
        setSaving(false);
      }
    };

    const interval = setInterval(saveDraft, 30000); // كل 30 ثانية
    return () => clearInterval(interval);
  }, [currentParagraphIndex, paragraphs, assignmentId, autoSaveEnabled]);

  const handleTranslationChange = (value: string) => {
    setParagraphs(prev => {
      const newParagraphs = [...prev];
      if (newParagraphs[currentParagraphIndex]) {
        newParagraphs[currentParagraphIndex].translatedText = value;
      }
      return newParagraphs;
    });
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
    if (!currentParagraph?.translatedText) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Translations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId: assignmentId,
          paragraphId: currentParagraph.paragraphId,
          translatedText: currentParagraph.translatedText,
          status: 'Draft'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || ' failure in saving draft');
      }
      
      setSuccess('تم حفظ المسودة بنجاح!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || ' failure in saving draft');
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
      
      // إرسال كل الفقرات المترجمة
      for (const paragraph of paragraphs) {
        if (paragraph.translatedText) {
          const response = await fetch(`${API_BASE_URL}/Translations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              assignmentId: assignmentId,
              paragraphId: paragraph.paragraphId,
              translatedText: paragraph.translatedText,
              status: 'Submitted'
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || ` failure in saving paragraph ${paragraph.position}`);
          }
        }
      }

      // تحديث حالة المهمة
      const updateResponse = await fetch(`${API_BASE_URL}/Assignments/${assignmentId}/status/Completed`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => null);
        throw new Error(errorData?.message || ' failure in updating assignment status');
      }

      // إرسال إشعار للمراجع
      await fetch(`${API_BASE_URL}/Notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: assignment.reviewerUserId,
          title: 'مهمة جديدة للتدقيق',
          message: `تم تسليم ترجمة مشروع "${assignment.projectName}" للتدقيق`,
          relatedType: 'Assignment',
          relatedId: assignmentId
        })
      });

      setSuccess('تم تقديم الترجمة بنجاح!');
      
      // التوجيه بعد ثانيتين
      setTimeout(() => {
        router.push('/translator/assignments');
      }, 2000);
    } catch (err: any) {
      console.error(' failure in submitting translation:', err);
      setError(err.message || ' failure in submitting translation');
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

  if (error) {
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
  const progress = ((currentParagraphIndex + 1) / paragraphs.length) * 100;

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* الهيدر */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
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
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
            {assignment.role}
          </Badge>
          <div className="text-sm text-muted-foreground">
            {currentParagraphIndex + 1} من {paragraphs.length}
          </div>
        </div>
      </div>

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
            <CardTitle>فقرة {currentParagraph?.position || currentParagraphIndex + 1} من {paragraphs.length}</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}%
              </span>
              <Progress value={progress} className="h-2 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-500" />
                  الترجمة
                </h3>
                <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                  {currentParagraph?.translatedText?.length || 0} حرف
                </Badge>
              </div>
              <Textarea
                ref={textareaRef}
                value={currentParagraph?.translatedText || ''}
                onChange={(e) => handleTranslationChange(e.target.value)}
                placeholder="اكتب الترجمة هنا..."
                className="min-h-[200px] max-h-[400px] font-sans"
                dir="rtl"
                autoFocus
              />
            </div>
          </div>
          
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
                disabled={submitting}
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
            {paragraphs.length - (currentParagraphIndex + 1)} فقرة متبقية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {paragraphs.map((para, index) => (
              <Button
                key={para.paragraphId}
                variant={index === currentParagraphIndex ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentParagraphIndex(index)}
                className="h-8"
              >
                {index + 1}
                {para.translatedText && (
                  <CheckCircle2 className="w-3 h-3 ml-1 text-green-500" />
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}