// C:\Users\Ahmed\Desktop\translation-system-ui\app\supervisor\team\page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Filter,
  Users,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Star,
  Target,
  FileText,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Shield
} from "lucide-react";
import { userService, assignmentService, statisticsService } from "@/lib/api-services";
import { User, UserPerformanceDto, Assignment } from "@/types";

export default function SupervisorTeamPage() {
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [performanceData, setPerformanceData] = useState<UserPerformanceDto[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamData();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [teamMembers, searchQuery, roleFilter, statusFilter]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      setError(null);

      // جلب جميع المستخدمين (في بيئة حقيقية، نستخدم خدمة مخصصة للفريق)
      const usersData = await userService.getAll();
      
      // تصفية المستخدمين لاستبعاد المديرين والمشرفين الآخرين إذا لزم الأمر
      const teamUsers = (usersData || []).filter((user: User) => 
        user.userType === 'Translator' || user.userType === 'Reviewer' || user.userType === 'DataEntry'
      );
      
      setTeamMembers(teamUsers);

      // جلب بيانات الأداء
      const performanceData = await statisticsService.getUsersPerformance();
      setPerformanceData(performanceData || []);

    } catch (err: any) {
      console.error('Error fetching team data:', err);
      setError(err.message || 'حدث خطأ في تحميل بيانات الفريق');
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = teamMembers;

    // تطبيق البحث
    if (searchQuery) {
      filtered = filtered.filter((user: User) =>
        user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // تطبيق فلتر الدور
    if (roleFilter !== "all") {
      filtered = filtered.filter((user: User) => user.userType === roleFilter);
    }

    // تطبيق فلتر الحالة
    if (statusFilter !== "all") {
      filtered = filtered.filter((user: User) => 
        statusFilter === "active" ? user.isActive : !user.isActive
      );
    }

    setFilteredMembers(filtered);
  };

  const getUserPerformance = (userId: number): UserPerformanceDto | undefined => {
    return performanceData.find(perf => perf.userId === userId);
  };

  const getRoleBadge = (userType: string) => {
    const roleConfig: Record<string, { variant: "default" | "secondary" | "outline", label: string, icon: React.ReactNode }> = {
      'Translator': { 
        variant: 'default', 
        label: 'مترجم',
        icon: <FileText className="w-3 h-3" />
      },
      'Reviewer': { 
        variant: 'secondary', 
        label: 'مراجع',
        icon: <CheckCircle className="w-3 h-3" />
      },
      'DataEntry': { 
        variant: 'outline', 
        label: 'مدخل بيانات',
        icon: <Target className="w-3 h-3" />
      },
      'Supervisor': { 
        variant: 'outline', 
        label: 'مشرف',
        icon: <Shield className="w-3 h-3" />
      }
    };

    const config = roleConfig[userType] || { variant: 'outline', label: userType, icon: <Users className="w-3 h-3" /> };
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 text-xs">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="flex items-center gap-1 text-xs">
        <CheckCircle className="w-3 h-3" />
        نشط
      </Badge>
    ) : (
      <Badge variant="outline" className="flex items-center gap-1 text-xs">
        <Clock className="w-3 h-3" />
        غير نشط
      </Badge>
    );
  };

  const getRoleCount = (userType: string) => {
    return teamMembers.filter((user: User) => user.userType === userType).length;
  };

  const getActiveCount = () => {
    return teamMembers.filter((user: User) => user.isActive).length;
  };

  if (loading) {
    return <TeamSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Shield className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">حدث خطأ</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchTeamData}>إعادة المحاولة</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* عنوان الصفحة والإجراءات */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الفريق</h1>
          <p className="text-muted-foreground mt-2">
            إدارة وتتبع أداء أعضاء فريق الترجمة
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" />
            إضافة عضو جديد
          </Button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الفريق"
          value={teamMembers.length.toString()}
          description={`${getActiveCount()} نشط`}
          icon={<Users className="w-4 h-4" />}
          color="blue"
        />
        <StatCard
          title="المترجمون"
          value={getRoleCount('Translator').toString()}
          description="متخصصون في الترجمة"
          icon={<FileText className="w-4 h-4" />}
          color="green"
        />
        <StatCard
          title="المراجعون"
          value={getRoleCount('Reviewer').toString()}
          description="متخصصون في المراجعة"
          icon={<CheckCircle className="w-4 h-4" />}
          color="orange"
        />
        <StatCard
          title="مدخلي البيانات"
          value={getRoleCount('DataEntry').toString()}
          description="متخصصون في إدخال البيانات"
          icon={<Target className="w-4 h-4" />}
          color="purple"
        />
      </div>

      {/* أدوات البحث والتصفية */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>أعضاء الفريق</CardTitle>
              <CardDescription>
                عرض {filteredMembers.length} من أصل {teamMembers.length} عضو
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* شريط البحث */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث في الأعضاء..."
                  className="pl-4 pr-10 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* فلتر الدور */}
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">جميع الأدوار</option>
                <option value="Translator">مترجمون</option>
                <option value="Reviewer">مراجعون</option>
                <option value="DataEntry">مدخلي بيانات</option>
              </select>

              {/* فلتر الحالة */}
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط فقط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">لا يوجد أعضاء</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                  ? "لم يتم العثور على أعضاء يطابقون معايير البحث" 
                  : "لا يوجد أعضاء في الفريق حالياً"
                }
              </p>
              <Button>
                <UserPlus className="w-4 h-4 ml-2" />
                إضافة أول عضو
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredMembers.map((user: User) => (
                <TeamMemberCard 
                  key={user.userId} 
                  user={user}
                  performance={getUserPerformance(user.userId)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// مكون بطاقة عضو الفريق
interface TeamMemberCardProps {
  user: User;
  performance?: UserPerformanceDto;
}

function TeamMemberCard({ user, performance }: TeamMemberCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* رأس البطاقة */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold text-lg">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {getRoleBadge(user.userType)}
              {getStatusBadge(user.isActive)}
            </div>
          </div>

          {/* معلومات الاتصال */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{user.email}</span>
            </div>
            {user.phoneNumber && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{user.phoneNumber}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>انضم: {new Date(user.createdAt).toLocaleDateString('ar-SA')}</span>
            </div>
          </div>

          {/* إحصائيات الأداء */}
          {performance && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">
                  {performance.completedTranslations || 0}
                </div>
                <div className="text-xs text-muted-foreground">ترجمات</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {performance.averageQualityScore ? performance.averageQualityScore.toFixed(1) : '0.0'}
                </div>
                <div className="text-xs text-muted-foreground">جودة</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">
                  {(performance.totalWordsTranslated || 0).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">كلمة</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {performance.completedReviews || 0}
                </div>
                <div className="text-xs text-muted-foreground">مراجعات</div>
              </div>
            </div>
          )}

          {/* تفاصيل إضافية */}
          {showDetails && performance && (
            <div className="space-y-2 text-sm text-muted-foreground border-t pt-3">
              <div className="flex justify-between">
                <span>المشاريع المكتملة:</span>
                <span className="font-medium">{performance.completedProjects || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>آخر نشاط:</span>
                <span className="font-medium">
                  {performance.lastActivity ? new Date(performance.lastActivity).toLocaleDateString('ar-SA') : 'لا يوجد'}
                </span>
              </div>
            </div>
          )}

          {/* أزرار الإجراءات */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 gap-2"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Eye className="w-4 h-4" />
              {showDetails ? 'إخفاء' : 'تفاصيل'}
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// مكون بطاقة الإحصائيات المساعد
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
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold mb-1">{value}</p>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs opacity-75 mt-1">{description}</p>
          </div>
          <div className="p-2 rounded-lg bg-current/20">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// دالة مساعدة لعرض دور المستخدم
function getRoleBadge(userType: string) {
  const roleConfig: Record<string, { variant: "default" | "secondary" | "outline", label: string, icon: React.ReactNode }> = {
    'Translator': { 
      variant: 'default', 
      label: 'مترجم',
      icon: <FileText className="w-3 h-3" />
    },
    'Reviewer': { 
      variant: 'secondary', 
      label: 'مراجع',
      icon: <CheckCircle className="w-3 h-3" />
    },
    'DataEntry': { 
      variant: 'outline', 
      label: 'مدخل بيانات',
      icon: <Target className="w-3 h-3" />
    },
    'Supervisor': { 
      variant: 'outline', 
      label: 'مشرف',
      icon: <Shield className="w-3 h-3" />
    }
  };

  const config = roleConfig[userType] || { variant: 'outline', label: userType, icon: <Users className="w-3 h-3" /> };
  return (
    <Badge variant={config.variant} className="flex items-center gap-1 text-xs">
      {config.icon}
      {config.label}
    </Badge>
  );
}

// دالة مساعدة لعرض حالة المستخدم
function getStatusBadge(isActive: boolean) {
  return isActive ? (
    <Badge variant="default" className="flex items-center gap-1 text-xs">
      <CheckCircle className="w-3 h-3" />
      نشط
    </Badge>
  ) : (
    <Badge variant="outline" className="flex items-center gap-1 text-xs">
      <Clock className="w-3 h-3" />
      غير نشط
    </Badge>
  );
}

// مكون هيكل التحميل
function TeamSkeleton() {
  return (
    <div className="space-y-6">
      {/* عنوان الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32 mt-4 sm:mt-0" />
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-6 w-12 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* أدوات البحث والتصفية */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div>
                          <Skeleton className="h-5 w-32 mb-1" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-12" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                    
                    <div className="flex gap-2">
                      <Skeleton className="h-9 flex-1" />
                      <Skeleton className="h-9 w-9" />
                      <Skeleton className="h-9 w-9" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}