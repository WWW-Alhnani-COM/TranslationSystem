// src/app/reviewer/projects/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { Project, Assignment, ApiResponse } from "@/types";
import { 
  Loader2, 
  FileText, 
  Clock, 
  CheckCircle, 
  Search, 
  Filter,
  ArrowRight,
  Eye,
  BarChart3,
  Globe,
  User,
  AlertTriangle,
  Check,
  X
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export default function ReviewerProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userAssignments, setUserAssignments] = useState<Record<number, Assignment[]>>({}); // Cache لتخزين المهام لكل مشروع
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({}); // استخدام string كمفتاح
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSourceLanguage, setFilterSourceLanguage] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.userId) {
      fetchUserProjectsAndAssignments();
    }
  }, [user]);

  const fetchUserProjectsAndAssignments = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // جلب المهام أولاً
      const assignmentsData = await apiClient.get('Assignments/user/' + user.userId);
      const userAssignmentsList = assignmentsData || [];

      // استخلاص معرفات المشاريع من المهام
      const projectIds = [...new Set(userAssignmentsList.map((a: { projectId: any; }) => a.projectId))];

      // جلب معلومات المشاريع
      const projectPromises = projectIds.map(id => apiClient.get('Projects/' + id));
      const projectsData = await Promise.all(projectPromises);
      const projectsList = projectsData.filter(Boolean) as Project[]; // تصفية القيم الفارغة

      setProjects(projectsList);

      // تجميع المهام حسب معرف المشروع
      const groupedAssignments: Record<number, Assignment[]> = {};
      userAssignmentsList.forEach((assignment: Assignment) => {
        if (!groupedAssignments[assignment.projectId]) {
          groupedAssignments[assignment.projectId] = [];
        }
        groupedAssignments[assignment.projectId].push(assignment);
      });
      setUserAssignments(groupedAssignments);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في جلب مشاريعك",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Draft":
        return <Badge variant="outline">مسودة</Badge>;
      case "Active":
        return <Badge variant="secondary">نشط</Badge>;
      case "InProgress":
        return <Badge variant="secondary">قيد التنفيذ</Badge>;
      case "Completed":
        return <Badge variant="success">مكتمل</Badge>;
      case "Cancelled":
        return <Badge variant="destructive">ملغى</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft": return 'bg-gray-500';
      case "Active": return 'bg-blue-500';
      case "InProgress": return 'bg-yellow-500';
      case "Completed": return 'bg-green-500';
      case "Cancelled": return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.sourceLanguageName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    const matchesSourceLanguage = filterSourceLanguage === 'all' || project.sourceLanguageName === filterSourceLanguage;
    // Filter by date is more complex and might require additional logic
    const matchesDate = filterDate === 'all'; // Placeholder
    return matchesSearch && matchesStatus && matchesSourceLanguage && matchesDate;
  });

  // حساب الإحصائيات
  const activeProjects = projects.filter(p => p.status === 'Active' || p.status === 'InProgress').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const cancelledProjects = projects.filter(p => p.status === 'Cancelled').length;
  let totalWords = 0;
  projects.forEach(p => totalWords += p.wordCount);

  if (loading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">مشاريعي</h1>
          <p className="text-muted-foreground mt-2">
            عرض وإدارة المشاريع المخصصة لي كمراجع
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <span className="mr-1">الإجمالي:</span> {projects.length}
            </Badge>
            <Badge variant="outline">
              <span className="mr-1">النشطة:</span> {activeProjects}
            </Badge>
            <Badge variant="outline">
              <span className="mr-1">المكتملة:</span> {completedProjects}
            </Badge>
            <Badge variant="outline">
              <span className="mr-1">الكلمات:</span> {totalWords}
            </Badge>
          </div>
          <Button onClick={() => router.push('/reviewer')}>
            العودة للرئيسية
          </Button>
        </div>
      </div>

      {/* أدوات البحث والتصفية */}
      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في المشاريع أو اللغات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="حالة المشروع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="Draft">مسودة</SelectItem>
                <SelectItem value="Active">نشط</SelectItem>
                <SelectItem value="InProgress">قيد التنفيذ</SelectItem>
                <SelectItem value="Completed">مكتمل</SelectItem>
                <SelectItem value="Cancelled">ملغى</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSourceLanguage} onValueChange={setFilterSourceLanguage}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="اللغة المصدر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع اللغات</SelectItem>
                {Array.from(new Set(projects.map(p => p.sourceLanguageName))).map(lang => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDate} onValueChange={setFilterDate}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="التاريخ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأوقات</SelectItem>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="week">هذا الأسبوع</SelectItem>
                <SelectItem value="month">هذا الشهر</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-1">لا توجد مشاريع</h3>
          <p className="text-muted-foreground">
            لا توجد مشاريع مطابقة لبحثك أو تصفية الحالة.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const projectAssignments = userAssignments[project.projectId] || [];
            const myAssignment = projectAssignments.find(a => a.userId === user?.userId); // مهمتي في هذا المشروع

            // حساب التقدم (ببساطة)
            let progressPercentage = 0;
            let reviewedParagraphs = 0;
            let totalWords = 0;
            // نحتاج إلى جلب الترجمات لحساب التقدم، نستخدم عدد المهام المكتملة كمثال
            const completedAssignments = projectAssignments.filter(a => a.status === 'Completed').length;
            reviewedParagraphs = completedAssignments;
            progressPercentage = projectAssignments.length > 0 ? (completedAssignments / projectAssignments.length) * 100 : 0;
            // حساب الكلمات من الترجمات المكتملة (نحتاج إلى جلب الترجمات من كل مهمة)
            // لتبسيط الكود، نستخدم القيمة من project.translatedWordCount
            totalWords = project.wordCount| 0;

            return (
              <Card key={project.projectId} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate cursor-pointer" onClick={() => router.push(`/reviewer/projects/${project.projectId}`)}>
                        {project.projectName}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {project.sourceLanguageName} ({project.sourceLanguageCode})
                        </Badge>
                        {getStatusBadge(project.status)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{new Date(project.createdAt).toLocaleDateString('ar-EG')}</span>
                      </div>
                      {myAssignment?.isOverdue && (
                        <Badge variant="destructive" className="mt-1">متأخر</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* شريط التقدم */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>التقدم</span>
                        <span>{reviewedParagraphs} / {projectAssignments.length}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getStatusColor(project.status)}`} 
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* معلومات العمل */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">عدد الفقرات:</span>
                      <span>{project.totalParagraphs}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">عدد الكلمات:</span>
                      <span>{totalWords}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">عدد المهام:</span>
                      <span>{projectAssignments.length}</span>
                    </div>

                    {/* الأزرار */}
                    <div className="flex justify-between pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => router.push(`/reviewer/projects/${project.projectId}`)}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        التفاصيل
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => router.push(`/reviewer/projects/${project.projectId}`)}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        متابعة المراجعة
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
