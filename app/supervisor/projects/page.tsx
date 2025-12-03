// C:\Users\Ahmed\Desktop\translation-system-ui\app\supervisor\projects\page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Folder, 
  Search, 
  Filter, 
  Plus,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  MoreHorizontal,
  Eye
} from "lucide-react";
import { projectService } from "@/lib/api-services";
import { Project, ProjectStatsDto } from "@/types";
import Link from "next/link";

export default function SupervisorProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchQuery, statusFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectsData = await projectService.getAll();
      setProjects(projectsData || []);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.message || 'حدث خطأ في تحميل المشاريع');
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    // تطبيق البحث
    if (searchQuery) {
      filtered = filtered.filter((project: Project) =>
        project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // تطبيق فلتر الحالة
    if (statusFilter !== "all") {
      filtered = filtered.filter((project: Project) => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  };

  const getProjectStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string, icon: React.ReactNode }> = {
      'Draft': { 
        variant: 'outline', 
        label: 'مسودة',
        icon: <FileText className="w-3 h-3" />
      },
      'Active': { 
        variant: 'default', 
        label: 'نشط',
        icon: <Clock className="w-3 h-3" />
      },
      'InProgress': { 
        variant: 'secondary', 
        label: 'قيد التنفيذ',
        icon: <Users className="w-3 h-3" />
      },
      'Completed': { 
        variant: 'default', 
        label: 'منتهي',
        icon: <CheckCircle className="w-3 h-3" />
      },
      'Cancelled': { 
        variant: 'destructive', 
        label: 'ملغي',
        icon: <AlertTriangle className="w-3 h-3" />
      }
    };

    const config = statusConfig[status] || { variant: 'outline', label: status, icon: <FileText className="w-3 h-3" /> };
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 text-xs">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getStatusCount = (status: string) => {
    return projects.filter((project: Project) => project.status === status).length;
  };

  if (loading) {
    return <ProjectsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">حدث خطأ</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchProjects}>إعادة المحاولة</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* عنوان الصفحة والإجراءات */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة المشاريع</h1>
          <p className="text-muted-foreground mt-2">
            عرض وإدارة جميع مشاريع الترجمة تحت إشرافك
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button asChild className="gap-2">
            <Link href="/supervisor/projects/create">
              <Plus className="w-4 h-4" />
              مشروع جديد
            </Link>
          </Button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المشاريع"
          value={projects.length.toString()}
          icon={<Folder className="w-4 h-4" />}
          color="blue"
        />
        <StatCard
          title="قيد التنفيذ"
          value={getStatusCount('InProgress').toString()}
          icon={<Clock className="w-4 h-4" />}
          color="orange"
        />
        <StatCard
          title="منتهية"
          value={getStatusCount('Completed').toString()}
          icon={<CheckCircle className="w-4 h-4" />}
          color="green"
        />
        <StatCard
          title="نشطة"
          value={getStatusCount('Active').toString()}
          icon={<Users className="w-4 h-4" />}
          color="purple"
        />
      </div>

      {/* أدوات البحث والتصفية */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>المشاريع</CardTitle>
              <CardDescription>
                عرض {filteredProjects.length} من أصل {projects.length} مشروع
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* شريط البحث */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث في المشاريع..."
                  className="pl-4 pr-10 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* فلتر الحالة */}
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">جميع الحالات</option>
                <option value="Draft">مسودة</option>
                <option value="Active">نشط</option>
                <option value="InProgress">قيد التنفيذ</option>
                <option value="Completed">منتهي</option>
                <option value="Cancelled">ملغي</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">لا توجد مشاريع</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || statusFilter !== "all" 
                  ? "لم يتم العثور على مشاريع تطابق معايير البحث" 
                  : "لا توجد مشاريع تحت إشرافك حالياً"
                }
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button asChild>
                  <Link href="/supervisor/projects/create">
                    <Plus className="w-4 h-4 ml-2" />
                    إنشاء مشروع جديد
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project: Project) => (
                <ProjectCard key={project.projectId} project={project} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// مكون بطاقة المشروع
interface ProjectCardProps {
  project: Project;
}

function ProjectCard({ project }: ProjectCardProps) {
  const progress = Math.round((project.totalParagraphs > 0 ? (project.assignmentsCount || 0) / project.totalParagraphs : 0) * 100);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-4 flex-1">
        <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
          <Folder className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg truncate">{project.projectName}</h3>
            {getProjectStatusBadge(project.status)}
          </div>
          
          {project.description && (
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
              {project.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>{project.totalParagraphs} فقرة</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{project.assignmentsCount || 0} مهمة</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span>{project.wordCount} كلمة</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span>إنشاء: {new Date(project.createdAt).toLocaleDateString('ar-SA')}</span>
            </div>
          </div>
          
          {/* شريط التقدم */}
          {project.status === 'InProgress' && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>التقدم</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary rounded-full h-2 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:pl-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/supervisor/projects/${project.projectId}`}>
            <Eye className="w-4 h-4 ml-2" />
            عرض التفاصيل
          </Link>
        </Button>
        
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// مكون بطاقة الإحصائيات المساعد
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "orange" | "purple";
}

function StatCard({ title, value, icon, color }: StatCardProps) {
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
            <p className="text-sm font-medium mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="p-2 rounded-lg bg-current/20">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// مكون هيكل التحميل
function ProjectsSkeleton() {
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
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-12" />
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg mb-4">
              <div className="flex items-start gap-4 flex-1">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 sm:mt-0">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// دالة مساعدة لعرض حالة المشروع
function getProjectStatusBadge(status: string) {
  const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string, icon: React.ReactNode }> = {
    'Draft': { 
      variant: 'outline', 
      label: 'مسودة',
      icon: <FileText className="w-3 h-3" />
    },
    'Active': { 
      variant: 'default', 
      label: 'نشط',
      icon: <Clock className="w-3 h-3" />
    },
    'InProgress': { 
      variant: 'secondary', 
      label: 'قيد التنفيذ',
      icon: <Users className="w-3 h-3" />
    },
    'Completed': { 
      variant: 'default', 
      label: 'منتهي',
      icon: <CheckCircle className="w-3 h-3" />
    },
    'Cancelled': { 
      variant: 'destructive', 
      label: 'ملغي',
      icon: <AlertTriangle className="w-3 h-3" />
    }
  };

  const config = statusConfig[status] || { variant: 'outline', label: status, icon: <FileText className="w-3 h-3" /> };
  return (
    <Badge variant={config.variant} className="flex items-center gap-1 text-xs">
      {config.icon}
      {config.label}
    </Badge>
  );
}