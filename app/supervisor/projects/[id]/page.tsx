"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Button 
} from '@/components/ui/button';
import { 
  Badge 
} from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Skeleton 
} from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  FileText, 
  Clock, 
  Users, 
  CheckCircle, 
  Folder, 
  User, 
  Calendar, 
  Languages, 
  Share2, 
  Download, 
  Settings, 
  ArrowRight 
} from 'lucide-react';

// تعريف الأنواع (Types)
interface Language {
  languageId: number;
  languageName: string;
  languageCode: string;
  isActive: boolean;
}

interface Assignment {
  id: number;
  userName: string;
  userEmail: string;
  role: string;
  targetLanguageName: string;
  status: string;
  translationCount: number;
}

interface Project {
  projectId: number;
  projectName: string;
  description?: string;
  status: string;
  creatorName: string;
  createdAt: string;
  sourceLanguage: Language;
  targetLanguages: Language[];
  assignments: Assignment[];
  // إحصائيات المشروع
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  totalTranslators: number;
  totalReviewers: number;
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  
  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // استخدم الرابط الصحيح مع API الخاص بك
      const response = await fetch(`https://samali1-001-site1.stempurl.com/api/projects/${id}`);
      
      if (!response.ok) {
        throw new Error('فشل في جلب بيانات المشروع');
      }
      
      const data = await response.json();
      setProject(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const getProjectStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string, icon: React.ReactNode }> = {
      'Draft': { variant: 'outline', label: 'مسودة', icon: <FileText className="w-3 h-3" /> },
      'Active': { variant: 'default', label: 'نشط', icon: <Clock className="w-3 h-3" /> },
      'InProgress': { variant: 'secondary', label: 'قيد التنفيذ', icon: <Users className="w-3 h-3" /> },
      'Completed': { variant: 'default', label: 'منتهي', icon: <CheckCircle className="w-3 h-3" /> },
      'Cancelled': { variant: 'destructive', label: 'ملغي', icon: <AlertTriangle className="w-3 h-3" /> }
    };
    const config = statusConfig[status] || { variant: 'outline', label: status, icon: <FileText className="w-3 h-3" /> };
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 text-xs">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { variant: "default" | "secondary" | "outline", label: string }> = {
      'Translator': { variant: 'default', label: 'مترجم' },
      'Reviewer': { variant: 'secondary', label: 'مراجع' },
      'Supervisor': { variant: 'outline', label: 'مشرف' },
      'DataEntry': { variant: 'outline', label: 'مدخل بيانات' }
    };
    const config = roleConfig[role] || { variant: 'outline', label: role };
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  // ✅ الحل: وضع الـ return الشرطي بعد جميع التعريفات وقبل JSX الرئيسي
  if (loading) {
    return <ProjectDetailsSkeleton />;
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {error ? "حدث خطأ" : "المشروع غير موجود"}
        </h3>
        <p className="text-muted-foreground mb-4">
          {error || "تعذر العثور على المشروع المطلوب"}
        </p>
        <div className="flex gap-2">
          <Button onClick={fetchProjectData}>إعادة المحاولة</Button>
          <Button variant="outline" asChild>
            <Link href="/supervisor/projects">العودة إلى المشاريع</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Folder className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight truncate">
                {project.projectName}
              </h1>
              {getProjectStatusBadge(project.status)}
            </div>
            {project.description && (
              <p className="text-muted-foreground text-lg mb-3">{project.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>منشئ بواسطة: {project.creatorName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>إنشاء: {new Date(project.createdAt).toLocaleDateString('ar-SA')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Languages className="w-4 h-4" />
                <span>اللغة المصدر: {project.sourceLanguage?.languageName}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Share2 className="w-4 h-4" />
            مشاركة
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            تصدير
          </Button>
          <Button className="gap-2">
            <Settings className="w-4 h-4" />
            إدارة
          </Button>
        </div>
      </div>

      {/* إحصائيات المشروع */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="المهام الكلية"
          value={`${project.totalTasks || 0}`}
          description="إجمالي المهام"
          icon={<FileText className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="المهام المكتملة"
          value={`${project.completedTasks || 0}`}
          description="منتهية"
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="المهام قيد التنفيذ"
          value={`${project.inProgressTasks || 0}`}
          description="جاري العمل"
          icon={<Clock className="w-5 h-5" />}
          color="orange"
        />
        <StatCard
          title="المترجمين"
          value={`${project.totalTranslators || 0}`}
          description="فريق الترجمة"
          icon={<Users className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* المحتوى الرئيسي */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">تفاصيل المشروع</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* العمود الأيسر: التقدم والإحصائيات */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">تقدم المشروع</h3>
              <CardDescription>حالة المهام حسب المرحلة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProgressItem
                label="المهام المكتملة"
                value={project.completedTasks || 0}
                total={project.totalTasks || 0}
                color="green"
              />
              <ProgressItem
                label="المهام قيد التنفيذ"
                value={project.inProgressTasks || 0}
                total={project.totalTasks || 0}
                color="blue"
              />
              <ProgressItem
                label="المهام المعلقة"
                value={project.pendingTasks || 0}
                total={project.totalTasks || 0}
                color="purple"
              />
            </CardContent>
          </Card>

          {/* العمود الأيمن: المعلومات */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">معلومات المشروع</h3>
              <CardDescription>التفاصيل الأساسية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoItem 
                label="معرف المشروع" 
                value={`#${project.projectId}`} 
              />
              <InfoItem 
                label="الحالة" 
                value={getProjectStatusBadge(project.status)} 
              />
              <InfoItem 
                label="تاريخ الإنشاء" 
                value={new Date(project.createdAt).toLocaleDateString('ar-SA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })} 
              />
              <InfoItem 
                label="المترجمين" 
                value={`${project.totalTranslators || 0} مترجم`} 
              />
              <InfoItem 
                label="المراجعين" 
                value={`${project.totalReviewers || 0} مراجع`} 
              />
            </CardContent>
          </Card>
        </div>

        {/* اللغات */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">لغات المشروع</h3>
            <CardDescription>اللغات المصدر والهدف</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LanguageSection 
              title="اللغة المصدر" 
              language={project.sourceLanguage} 
            />
            <LanguageSection 
              title="اللغات الهدف" 
              languages={project.targetLanguages} 
            />
          </CardContent>
        </Card>

        {/* المهام المعينة */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">المهام المعينة</h3>
                <CardDescription>أعضاء الفريق والمسؤوليات</CardDescription>
              </div>
              <span className="text-sm text-muted-foreground">
                {project.assignments?.length || 0} مهمة
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.assignments && project.assignments.length > 0 ? (
              project.assignments.map((assignment) => (
                <AssignmentCard 
                  key={assignment.id} 
                  assignment={assignment} 
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد مهام معينة حتى الآن
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// مكونات مساعدة

interface StatCardProps { 
  title: string; 
  value: string; 
  description: string; 
  icon: React.ReactNode; 
  color: "blue" | "green" | "orange" | "purple"; 
}

function StatCard({ title, value, description, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800",
    green: "bg-green-50 text-green-600 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800",
    orange: "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-800",
    purple: "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800"
  };
  
  return (
    <Card className={`border-2 ${colorClasses[color]}`}>
      <CardContent className="p-6 flex justify-between items-center">
        <div>
          <p className="text-2xl font-bold mb-1">{value}</p>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs opacity-75 mt-1">{description}</p>
        </div>
        <div className="p-2 rounded-lg bg-current/20">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

interface ProgressItemProps { 
  label: string; 
  value: number; 
  total: number; 
  color: "blue" | "green" | "purple"; 
}

function ProgressItem({ label, value, total, color }: ProgressItemProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const colorClasses = { 
    blue: "bg-blue-500", 
    green: "bg-green-500", 
    purple: "bg-purple-500" 
  };
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span>{label}</span>
        <span>
          {value} / {total} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2">
        <div 
          className={`rounded-full h-2 transition-all duration-300 ${colorClasses[color]}`} 
          style={{ width: `${percentage}%` }} 
        />
      </div>
    </div>
  );
}

interface InfoItemProps { 
  label: string; 
  value: React.ReactNode; 
}

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-b-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function AssignmentCard({ assignment }: { assignment: Assignment }) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <User className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold truncate">{assignment.userName}</h4>
            {getRoleBadge(assignment.role)}
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {assignment.userEmail}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>اللغة: {assignment.targetLanguageName}</span>
            <span>الحالة: {assignment.status}</span>
            <span>المهام: {assignment.translationCount}</span>
          </div>
        </div>
      </div>
      <Button variant="ghost" size="icon">
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

interface LanguageSectionProps { 
  title: string; 
  language?: Language; 
  languages?: Language[]; 
}

function LanguageSection({ title, language, languages }: LanguageSectionProps) {
  return (
    <div>
      <h4 className="font-semibold mb-3">{title}</h4>
      <div className="space-y-2">
        {language ? (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Languages className="w-4 h-4 text-muted-foreground" />
              <span>{language.languageName}</span>
              <Badge variant="outline" className="text-xs">
                {language.languageCode}
              </Badge>
            </div>
          </div>
        ) : languages?.map((lang) => (
          <div key={lang.languageId} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Languages className="w-4 h-4 text-muted-foreground" />
              <span>{lang.languageName}</span>
              <Badge variant="outline" className="text-xs">
                {lang.languageCode}
              </Badge>
            </div>
            <Badge variant={lang.isActive ? "default" : "outline"} className="text-xs">
              {lang.isActive ? "نشط" : "غير نشط"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton Loader
function ProjectDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <Skeleton className="w-14 h-14 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-12 mb-2" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: i === 0 ? 3 : 6 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
