// src/app/translator/assignments/[id]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  FileText, 
  Languages, 
  Clock, 
  Users, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Loader2,
  FolderOpen,
  Target,
  BarChart3,
  Eye,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5296/api';

interface Assignment {
  assignmentId: number;
  projectId: number;
  projectName: string;
  userId: number;
  userName: string;
  userEmail: string;
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
  paragraphCount: number;
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
  assignments: Assignment[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  errors: string[] | null;
  timestamp: string;
}

export default function AssignmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const assignmentId = parseInt(resolvedParams.id, 10);
  const { user } = useAuth();
  const router = useRouter();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // جلب تفاصيل المهمة
  const fetchAssignmentDetails = async () => {
    // التحقق من صحة المعرف
    if (isNaN(assignmentId) || assignmentId <= 0) {
      setError('معرف المهمة غير صالح');
      setLoading(false);
      return;
    }
    
    // التحقق من تسجيل الدخول
    if (!user?.userId) {
      setError('يجب تسجيل الدخول لعرض البيانات');
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);
      setError(null);
      
      // جلب تفاصيل المهمة
      const assignmentResponse = await fetch(`${API_BASE_URL}/Assignments/${assignmentId}`, {
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      
      // التعامل مع حالة 401 (غير مصرح)
      if (assignmentResponse.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        router.push('/login?session_expired=true');
        return;
      }
      
      // التعامل مع حالة 404 (لم يتم العثور على المهمة)
      if (assignmentResponse.status === 404) {
        setError(`لم يتم العثور على مهمة بالمعرف ${assignmentId}`);
        setLoading(false);
        return;
      }
      
      // التحقق من استجابة الـ API
      if (!assignmentResponse.ok) {
        const errorText = await assignmentResponse.text();
        throw new Error(`فشل في تحميل تفاصيل المهمة: ${assignmentResponse.status} ${errorText}`);
      }
      
      const assignmentData: ApiResponse<Assignment> = await assignmentResponse.json();
      
      if (!assignmentData?.success) {
        throw new Error(assignmentData?.message || 'فشل في تحميل تفاصيل المهمة');
      }
      
      setAssignment(assignmentData.data);
      
      // جلب تفاصيل المشروع
      const projectResponse = await fetch(`${API_BASE_URL}/Projects/${assignmentData.data.projectId}`, {
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      
      // التحقق من استجابة الـ API
      if (!projectResponse.ok) {
        const errorText = await projectResponse.text();
        throw new Error(`فشل في تحميل تفاصيل المشروع: ${projectResponse.status} ${errorText}`);
      }
      
      const projectData: ApiResponse<Project> = await projectResponse.json();
      
      if (!projectData?.success) {
        throw new Error(projectData?.message || 'فشل في تحميل تفاصيل المشروع');
      }
      
      setProject(projectData.data);
      
    } catch (err: any) {
      console.error('Error fetching assignment details:', err);
      
      // تحديد رسالة خطأ أكثر تفصيلًا
      let errorMessage = 'فشل في تحميل تفاصيل المهمة';
      if (err.message.includes('Failed to fetch')) {
        errorMessage = 'تعذر الاتصال بالخادم. تأكد من تشغيل الخدمة الخلفية.';
      } else if (err.message.includes('404')) {
        errorMessage = 'لم يتم العثور على المهمة المطلوبة';
      } else if (err.message.includes('401')) {
        errorMessage = 'انتهت جلسة تسجيل الدخول. الرجاء تسجيل الدخول مرة أخرى.';
      } else if (err.message.includes('403')) {
        errorMessage = 'ليس لديك صلاحية للوصول إلى هذه البيانات';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignmentDetails();
  }, [assignmentId, user?.userId]);

  // دالة لحساب لون الحالة
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      'Pending': { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', text: 'في الانتظار' },
      'InProgress': { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', text: 'قيد العمل' },
      'Completed': { color: 'bg-green-500/10 text-green-500 border-green-500/20', text: 'مكتمل' },
      'Cancelled': { color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', text: 'ملغي' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', text: status };
    return <Badge variant="secondary" className={config.color}>{config.text}</Badge>;
  };

  // دالة لحساب لون الموعد النهائي
  const getDeadlineColor = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'text-red-500 font-medium';
    } else if (diffDays <= 3) {
      return 'text-orange-500 font-medium';
    } else {
      return 'text-muted-foreground';
    }
  };

  // حساب نسبة الإنجاز
  const getCompletionPercentage = () => {
    if (!assignment || !project) return 0;
    
    // إذا كانت جميع الفقرات مترجمة
    if (assignment.translationCount >= (project.totalParagraphs || 0)) {
      return 100;
    }
    
    // حساب النسبة المئوية
    return Math.min(100, Math.round((assignment.translationCount / (project.totalParagraphs || 1)) * 100));
  };

  if (loading && !assignment) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">جاري تحميل تفاصيل المهمة...</p>
      </div>
    );
  }

  if (error && !loading) {
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
              <Button onClick={fetchAssignmentDetails}>
                <RefreshCw className="w-4 h-4 mr-2" />
                إعادة المحاولة
              </Button>
              <Button variant="outline" onClick={() => router.push('/translator/assignments')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                العودة إلى المهام
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>مهمة غير موجودة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">لم يتم العثور على المهمة المطلوبة.</p>
            <Button onClick={() => router.push('/translator/assignments')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              العودة إلى قائمة المهام
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();
  const isDeadlineNear = assignment.isOverdue || (new Date(assignment.deadline) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));

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
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">تفاصيل المهمة</h1>
          <p className="text-muted-foreground mt-1">
            {project?.projectName} - {assignment.targetLanguageName}
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={fetchAssignmentDetails} 
            disabled={refreshing}
            className="gap-2"
          >
            {refreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            تحديث
          </Button>
          <Button 
            asChild 
            className="gap-2"
            disabled={assignment.status === 'Completed'}
          >
            <a href={`/translator/translate/${assignment.assignmentId}`}>
              <Play className="w-4 h-4" />
              {assignment.translationCount > 0 ? 'متابعة الترجمة' : 'بدء الترجمة'}
            </a>
          </Button>
        </div>
      </div>

      {/* التنبيهات */}
      {isDeadlineNear && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="py-3 flex items-center gap-2 text-yellow-500">
            <Clock className="w-5 h-5" />
            <p>
              <strong>تنبيه:</strong> {assignment.isOverdue ? 'المهمة متأخرة' : 'المهمة تنتهي قريبًا'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* المعلومات الأساسية */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-500" />
              معلومات المهمة
            </CardTitle>
            <CardDescription>
              تفاصيل المهمة والمشروع
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">المشروع</h3>
                <p className="font-medium">{project?.projectName || 'جارٍ التحميل...'}</p>
                {project?.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {project.description}
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">الدور</h3>
                <p className="font-medium capitalize">{assignment.role}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">اللغة المستهدفة</h3>
                <p className="font-medium flex items-center gap-2">
                  <Languages className="w-4 h-4 text-primary" />
                  {assignment.targetLanguageName}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">الحالة</h3>
                <div className="flex items-center gap-2">
                  {getStatusBadge(assignment.status)}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">عدد الفقرات</h3>
                <p className="font-medium">{project?.totalParagraphs || 0}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">الكلمات</h3>
                <p className="font-medium">{project?.wordCount || 0}</p>
              </div>
            </div>
            
            {/* التقدم */}
            <div className="pt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>نسبة الإنجاز</span>
                <span className="font-medium">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              الجدول الزمني
            </CardTitle>
            <CardDescription>
              معلومات الموعد النهائي
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">الموعد النهائي</h4>
              <p className={`font-medium text-lg ${getDeadlineColor(assignment.deadline)}`}>
                {new Date(assignment.deadline).toLocaleDateString('ar-SA')}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(assignment.deadline).toLocaleTimeString('ar-SA')}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">الحالة</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>الإنجاز</span>
                  <span>{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
            </div>
            
            {assignment.assignedAt && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">تم التعيين في</h4>
                <p className="text-sm">
                  {new Date(assignment.assignedAt).toLocaleDateString('ar-SA')}
                </p>
              </div>
            )}
            
            {assignment.completedAt && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">اكتمل في</h4>
                <p className="text-sm">
                  {new Date(assignment.completedAt).toLocaleDateString('ar-SA')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* فريق المشروع */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            فريق المشروع
          </CardTitle>
          <CardDescription>
            أعضاء الفريق في هذا المشروع
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project?.assignments?.map((member: Assignment) => (
              <div key={member.assignmentId} className="border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {member.userName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{member.userName}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {member.targetLanguageName}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {member.translationCount || 0} فقرة
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* الإجراءات السريعة */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>الإجراءات السريعة</CardTitle>
          <CardDescription>
            قم بالإجراءات المطلوبة من هنا
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              asChild 
              disabled={assignment.status === 'Completed'}
              className="gap-2"
            >
              <a href={`/translator/translate/${assignment.assignmentId}`}>
                <Play className="w-4 h-4" />
                {assignment.translationCount > 0 ? 'متابعة الترجمة' : 'بدء الترجمة'}
              </a>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/translator/assignments')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة إلى المهام
            </Button>
            <Button 
              variant="outline" 
              onClick={fetchAssignmentDetails}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث البيانات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* تفاصيل الفقرات */}
      {project?.totalParagraphs && project.totalParagraphs > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-500" />
              تفاصيل الفقرات
            </CardTitle>
            <CardDescription>
              حالة الفقرات المطلوب ترجمتها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(project.totalParagraphs)].map((_, index) => (
                <div key={index} className="border rounded-lg p-4 bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">فقرة {index + 1}</span>
                    {index < assignment.translationCount && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                        مترجمة
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    مثال على نص الفقرة...
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}