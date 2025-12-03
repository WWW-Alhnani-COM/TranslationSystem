// src/app/translator/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Users,
  Languages,
  Calendar,
  BarChart3,
  FolderOpen,
  RefreshCw,
  Play,
  Eye,
  ArrowRight,
  Award,
  Target
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5296/api';

// أنواع البيانات
interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalUsers: number;
  activeUsers: number;
  totalTranslations: number;
  pendingTranslations: number;
  completedTranslations: number;
  totalWordsTranslated: number;
  averageQualityScore: number;
  recentProjects: ProjectProgress[];
  languageStats: LanguageStat[];
}

interface ProjectProgress {
  projectId: number;
  projectName: string;
  progressPercentage: number;
  status: string;
  deadline: string;
}

interface LanguageStat {
  languageName: string;
  projectCount: number;
  wordCount: number;
  averageQuality: number;
}

interface Assignment {
  assignmentId: number;
  projectId: number;
  projectName: string;
  targetLanguageName: string;
  status: string;
  deadline: string;
  isOverdue: boolean;
  translationCount: number;
}

interface UserPerformance {
  userId: number;
  userName: string;
  userType: string;
  completedProjects: number;
  completedTranslations: number;
  completedReviews: number;
  averageQualityScore: number;
  totalWordsTranslated: number;
  lastActivity: string;
}

export default function TranslatorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [userPerformance, setUserPerformance] = useState<UserPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // جلب جميع بيانات Dashboard
  const fetchDashboardData = async () => {
    if (!user?.userId) return;

    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);

      // جلب البيانات بالتوازي
      const [
        dashboardResponse,
        assignmentsResponse,
        performanceResponse
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/Statistics/dashboard/user/${user.userId}`),
        fetch(`${API_BASE_URL}/Assignments/user/${user.userId}`),
        fetch(`${API_BASE_URL}/Statistics/users/performance`)
      ]);

      // معالجة إحصائيات Dashboard
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        if (dashboardData.success) {
          setDashboardStats(dashboardData.data);
        }
      }

      // معالجة المهام
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        if (assignmentsData.success) {
          setAssignments(assignmentsData.data || []);
        } else {
          // إذا لم تكن هناك مهام مباشرة، نجلب المهام حسب الدور
          const roleAssignmentsResponse = await fetch(`${API_BASE_URL}/Assignments/role/Translator`);
          if (roleAssignmentsResponse.ok) {
            const roleData = await roleAssignmentsResponse.json();
            if (roleData.success) {
              setAssignments(roleData.data || []);
            }
          }
        }
      }

      // معالجة أداء المستخدم
      if (performanceResponse.ok) {
        const performanceData = await performanceResponse.json();
        if (performanceData.success && performanceData.data) {
          const currentUserPerformance = performanceData.data.find(
            (perf: UserPerformance) => perf.userId === user.userId
          );
          setUserPerformance(currentUserPerformance || null);
        }
      }

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'فشل في تحميل بيانات Dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.userId]);

  // حساب الإحصائيات من البيانات المتاحة
  const calculateStats = () => {
    const pendingAssignments = assignments.filter(a => a.status === 'Pending').length;
    const inProgressAssignments = assignments.filter(a => a.status === 'InProgress').length;
    const completedAssignments = assignments.filter(a => a.status === 'Completed').length;
    const overdueAssignments = assignments.filter(a => a.isOverdue).length;

    return {
      pendingAssignments,
      inProgressAssignments,
      completedAssignments,
      overdueAssignments,
      totalAssignments: assignments.length
    };
  };

  const stats = calculateStats();
  const recentAssignments = assignments.slice(0, 5);
  const urgentAssignments = assignments
    .filter(a => !a.isOverdue && new Date(a.deadline).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000)
    .slice(0, 3);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <h1 className="text-2xl md:text-3xl font-bold h-8 w-64 bg-muted rounded mb-2"></h1>
          <p className="text-muted-foreground h-5 w-80 bg-muted rounded"></p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
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
            <Button onClick={fetchDashboardData} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* الهيدر */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">لوحة تحكم المترجم</h1>
          <p className="text-muted-foreground mt-1">
            مرحباً بعودتك، {user?.username}!
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchDashboardData} disabled={refreshing} className="gap-2">
            {refreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            تحديث
          </Button>
          <Button onClick={() => router.push('/translator/assignments')} className="gap-2">
            عرض جميع المهام
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="المهام المعلقة" 
          value={stats.pendingAssignments} 
          icon={<FileText className="w-5 h-5 text-blue-500" />}
          description="في انتظار البدء"
          trend="neutral"
        />
        <StatCard 
          title="قيد التنفيذ" 
          value={stats.inProgressAssignments} 
          icon={<Clock className="w-5 h-5 text-purple-500" />}
          description="جاري العمل عليها"
          trend="up"
        />
        <StatCard 
          title="مكتملة" 
          value={stats.completedAssignments} 
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          description="تم الانتهاء"
          trend="up"
        />
        <StatCard 
          title="متأخرة" 
          value={stats.overdueAssignments} 
          icon={<AlertCircle className="w-5 h-5 text-red-500" />}
          description="تجاوزت الموعد"
          trend="down"
        />
      </div>

      {/* الشبكة الرئيسية */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* العمود الأيسر */}
        <div className="lg:col-span-2 space-y-6">
          {/* المهام العاجلة */}
          {urgentAssignments.length > 0 && (
            <Card className="border-orange-500/20 bg-orange-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-500">
                  <AlertCircle className="w-5 h-5" />
                  مهام عاجلة
                </CardTitle>
                <CardDescription>
                  مهام تقترب من موعدها النهائي
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {urgentAssignments.map((assignment) => (
                    <div key={assignment.assignmentId} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium">{assignment.projectName}</p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.targetLanguageName}
                        </p>
                        <p className="text-xs text-orange-500 mt-1">
                          ينتهي في {new Date(assignment.deadline).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => router.push(`/translator/translate/${assignment.assignmentId}`)}
                        className="gap-2"
                      >
                        <Play className="w-4 h-4" />
                        بدء
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* المهام الأخيرة */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-500" />
                المهام الأخيرة
              </CardTitle>
              <CardDescription>
                أحدث المهام المخصصة لك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAssignments.map((assignment) => (
                  <div 
                    key={assignment.assignmentId} 
                    className="flex items-center justify-between p-3 bg-card rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/translator/assignments/${assignment.assignmentId}`)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-3 h-3 rounded-full ${
                        assignment.status === 'Completed' ? 'bg-green-500' :
                        assignment.status === 'InProgress' ? 'bg-blue-500' :
                        assignment.isOverdue ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium">{assignment.projectName}</p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.targetLanguageName} • {assignment.translationCount} ترجمة
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        assignment.status === 'Completed' ? 'default' :
                        assignment.isOverdue ? 'destructive' : 'secondary'
                      }>
                        {assignment.status === 'Completed' ? 'مكتمل' :
                         assignment.isOverdue ? 'متأخر' :
                         assignment.status === 'InProgress' ? 'قيد العمل' : 'معلق'}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/translator/translate/${assignment.assignmentId}`);
                        }}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {recentAssignments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد مهام حالياً</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* العمود الأيمن */}
        <div className="space-y-6">
          {/* أداء المترجم */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                أدائك
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatItem 
                icon={<Target className="w-4 h-4" />}
                label="إجمالي الكلمات"
                value={(userPerformance?.totalWordsTranslated || 0).toLocaleString()}
                description="كلمة مترجمة"
              />
              <StatItem 
                icon={<CheckCircle2 className="w-4 h-4" />}
                label="المشاريع المكتملة"
                value={userPerformance?.completedProjects || 0}
                description="مشروع"
              />
              <StatItem 
                icon={<FileText className="w-4 h-4" />}
                label="الترجمات المكتملة"
                value={userPerformance?.completedTranslations || 0}
                description="ترجمة"
              />
              <StatItem 
                icon={<TrendingUp className="w-4 h-4" />}
                label="معدل الجودة"
                value={`${userPerformance?.averageQualityScore?.toFixed(1) || '0.0'}/5`}
                description="نقاط"
              />
            </CardContent>
          </Card>

          {/* الإجراءات السريعة */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => router.push('/translator/assignments')}
                variant="default"
                className="w-full gap-2 justify-start"
              >
                <FolderOpen className="w-4 h-4" />
                عرض جميع المهام
              </Button>
              <Button 
                onClick={() => router.push('/translator/reports')}
                variant="outline"
                className="w-full gap-2 justify-start"
              >
                <BarChart3 className="w-4 h-4" />
                تقارير الأداء
              </Button>
              <Button 
                onClick={() => router.push('/translator/projects')}
                variant="outline"
                className="w-full gap-2 justify-start"
              >
                <FileText className="w-4 h-4" />
                المشاريع
              </Button>
            </CardContent>
          </Card>

          {/* إحصائيات النظام */}
          {dashboardStats && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  إحصائيات النظام
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المشاريع النشطة:</span>
                  <span className="font-medium">{dashboardStats.activeProjects}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">إجمالي المترجمين:</span>
                  <span className="font-medium">{dashboardStats.activeUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الترجمات المكتملة:</span>
                  <span className="font-medium">{dashboardStats.completedTranslations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">متوسط الجودة:</span>
                  <span className="font-medium">{dashboardStats.averageQualityScore.toFixed(1)}/5</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* اللغات الأكثر استخداماً */}
      {dashboardStats?.languageStats && dashboardStats.languageStats.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-green-500" />
              اللغات الأكثر استخداماً
            </CardTitle>
            <CardDescription>
              توزيع العمل حسب اللغات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardStats.languageStats.slice(0, 4).map((language, index) => (
                <div key={index} className="text-center p-4 bg-card rounded-lg border">
                  <div className="text-2xl font-bold text-primary">{language.projectCount}</div>
                  <div className="text-sm font-medium mt-1">{language.languageName}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {language.wordCount.toLocaleString()} كلمة
                  </div>
                  <div className="text-xs text-green-500 mt-1">
                    {language.averageQuality.toFixed(1)}/5 جودة
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

// مكون البطاقة الإحصائية
function StatCard({ title, value, icon, description, trend }: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  description: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500'
  };

  const trendIcons = {
    up: <TrendingUp className="w-4 h-4" />,
    down: <TrendingUp className="w-4 h-4 rotate-180" />,
    neutral: <TrendingUp className="w-4 h-4 text-gray-400" />
  };

  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <div className={trendColors[trend]}>
              {trendIcons[trend]}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

// مكون عنصر الإحصائية
function StatItem({ icon, label, value, description }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between p-2">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      <span className="font-bold text-lg">{value}</span>
    </div>
  );
}