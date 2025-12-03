// src/app/data-entry/projects/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Folder, 
  FileText, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Eye,
  Edit,
  Download,
  Upload,
  TrendingUp,
  BarChart3,
  PieChart,
  User,
  MessageSquare,
  Shield,
  Loader2,
  Plus, // <-- تم إضافتها
  RefreshCw // <-- تم إضافتها
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// استيراد المكونات الجديدة
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// تعريف الأنواع بناءً على OpenAPI
interface Project {
  projectId: number;
  projectName: string;
  description?: string;
  sourceLanguageId: number;
  sourceLanguageName: string;
  sourceLanguageCode: string;
  createdBy: number;
  creatorName: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  totalParagraphs: number;
  wordCount: number;
  targetLanguages?: Array<{
    languageId: number;
    languageName: string;
    languageCode: string;
    textDirection: string;
  }>;
}

interface ProjectStats {
  projectId: number;
  projectName: string;
  totalParagraphs: number;
  translatedParagraphs: number;
  reviewedParagraphs: number;
  approvedParagraphs: number;
  pendingAssignments: number;
  completedAssignments: number;
  progressPercentage: number;
}

interface Paragraph {
  paragraphId: number;
  projectId: number;
  projectName: string;
  originalText: string;
  paragraphType?: string;
  position: number;
  wordCount: number;
  createdAt: string;
  translations?: Array<{
    translationId: number;
    translatedText: string;
    status: string;
    translatorName: string;
    createdAt: string;
    targetLanguageName: string;
  }>;
}

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
}

// تعريف النوع للفقرة الجديدة
interface CreateParagraphDto {
  projectId: number;
  originalText: string;
  paragraphType?: string;
  position?: number;
  wordCount?: number;
}

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const projectId = parseInt(id, 10);
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingParagraphs, setLoadingParagraphs] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  // --- حالة ووظائف إضافة الفقرة ---
  const [isAddParagraphModalOpen, setIsAddParagraphModalOpen] = useState(false);
  const [newParagraphText, setNewParagraphText] = useState("");
  const [newParagraphType, setNewParagraphType] = useState("");
  const [isAddingParagraph, setIsAddingParagraph] = useState(false);

  const handleAddParagraph = async () => {
    if (!newParagraphText.trim()) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "الرجاء إدخال نص الفقرة.",
      });
      return;
    }

    const newParagraphData: CreateParagraphDto = {
      projectId,
      originalText: newParagraphText,
      paragraphType: newParagraphType || undefined,
    };

    setIsAddingParagraph(true);
    try {
      const createdParagraph: Paragraph = await apiClient.post("Paragraphs", newParagraphData);
      setParagraphs(prev => [...prev, createdParagraph]);
      setNewParagraphText("");
      setNewParagraphType("");
      setIsAddParagraphModalOpen(false);
      toast({
        title: "تمت الإضافة",
        description: "تمت إضافة الفقرة بنجاح.",
      });
      fetchProjectStats(); // تحديث الإحصائيات
    } catch (error) {
      console.error("Error adding paragraph:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في إضافة الفقرة.",
      });
    } finally {
      setIsAddingParagraph(false);
    }
  };
  // --- النهاية ---

  useEffect(() => {
    if (user && projectId && !isNaN(projectId)) {
      Promise.allSettled([
        fetchProjectDetails(),
        fetchProjectStats(),
        fetchProjectParagraphs(),
        fetchProjectAssignments()
      ]).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user, projectId]);

  const fetchProjectDetails = async () => {
    try {
      const data: Project = await apiClient.get(`Projects/${projectId}`);
      setProject(data);
    } catch (error) {
      console.error("Error fetching project details:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في جلب تفاصيل المشروع",
      });
    }
  };

  const fetchProjectStats = async () => {
    try {
      setLoadingStats(true);
      const data: ProjectStats = await apiClient.get(`Projects/${projectId}/stats`);
      setStats(data);
    } catch (error) {
      console.error("Error fetching project stats:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في جلب إحصائيات المشروع",
      });
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchProjectParagraphs = async () => {
    try {
      setLoadingParagraphs(true);
      const data: Paragraph[] = await apiClient.get(`Paragraphs/project/${projectId}`);
      setParagraphs(data);
    } catch (error) {
      console.error("Error fetching project paragraphs:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في جلب فقرات المشروع",
      });
      setParagraphs([]);
    } finally {
      setLoadingParagraphs(false);
    }
  };

  const fetchProjectAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const data: Assignment[] = await apiClient.get(`Assignments/project/${projectId}`);
      setAssignments(data);
    } catch (error) {
      console.error("Error fetching project assignments:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في جلب مهام المشروع",
      });
      setAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline" | "success", label: string, class?: string } } = {
      "Active": { variant: "success", label: "نشط", class: "bg-green-500" },
      "InProgress": { variant: "success", label: "قيد التنفيذ", class: "bg-blue-500" },
      "Completed": { variant: "secondary", label: "مكتمل" },
      "Draft": { variant: "outline", label: "مسودة" },
      "Review": { variant: "default", label: "قيد المراجعة", class: "bg-yellow-500" },
      "Cancelled": { variant: "destructive", label: "ملغى" },
      "Pending": { variant: "outline", label: "معلق" },
      "Submitted": { variant: "default", label: "مقدم", class: "bg-blue-500" },
      "Approved": { variant: "success", label: "معتمد", class: "bg-green-500" },
      "Rejected": { variant: "destructive", label: "مرفوض" }
    };

    const statusConfig = statusMap[status] || { variant: "outline" as const, label: status };
    
    return (
      <Badge variant={statusConfig.variant} className={statusConfig.class}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getAssignmentStatus = (assignment: Assignment) => {
    if (assignment.completedAt) {
      return "Completed";
    }
    
    const now = new Date();
    const deadline = new Date(assignment.deadline);
    
    if (now > deadline && !assignment.completedAt) {
      return "Overdue";
    }
    
    return assignment.status || "Pending";
  };

  const getParagraphStatus = (paragraph: Paragraph) => {
    if (!paragraph.translations || paragraph.translations.length === 0) {
      return "NotTranslated";
    }

    const hasApproved = paragraph.translations.some(t => t.status === "Approved");
    const hasSubmitted = paragraph.translations.some(t => t.status === "Submitted");
    const hasInProgress = paragraph.translations.some(t => t.status === "InProgress");

    if (hasApproved) return "Approved";
    if (hasSubmitted) return "Submitted";
    if (hasInProgress) return "InProgress";
    
    return "Translated";
  };

  const getParagraphStatusBadge = (paragraph: Paragraph) => {
    const status = getParagraphStatus(paragraph);
    
    const statusMap = {
      "NotTranslated": { label: "غير مترجمة", variant: "outline" as const, class: "" },
      "InProgress": { label: "قيد الترجمة", variant: "default" as const, class: "bg-yellow-500" },
      "Translated": { label: "مترجمة", variant: "default" as const, class: "bg-blue-500" },
      "Submitted": { label: "مقدمة", variant: "default" as const, class: "bg-orange-500" },
      "Approved": { label: "معتمدة", variant: "success" as const, class: "bg-green-500" }
    };

    const config = statusMap[status] || statusMap["NotTranslated"];
    
    return (
      <Badge variant={config.variant} className={config.class}>
        {config.label}
      </Badge>
    );
  };

  const handleRefreshData = () => {
    setLoadingStats(true);
    setLoadingParagraphs(true);
    setLoadingAssignments(true);
    
    Promise.allSettled([
      fetchProjectStats(),
      fetchProjectParagraphs(),
      fetchProjectAssignments()
    ]);
  };

  if (loading && !user) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>جاري التحميل...</span>
      </div>
    );
  }

  if (isNaN(projectId)) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-xl font-bold mb-2">معرف المشروع غير صالح</h2>
        <p className="text-muted-foreground">
          رقم المشروع غير صحيح.
        </p>
        <Button 
          onClick={() => router.push('/data-entry/projects')}
          className="mt-4"
        >
          العودة إلى قائمة المشاريع
        </Button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-xl font-bold mb-2">لم يتم العثور على المشروع</h2>
        <p className="text-muted-foreground">
          قد يكون المشروع قد تم حذفه أو أنك لا تملك صلاحيات الوصول.
        </p>
        <Button 
          onClick={() => router.push('/data-entry/projects')}
          className="mt-4"
        >
          العودة إلى قائمة المشاريع
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Folder className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{project.projectName}</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            {project.description || "لا يوجد وصف لهذا المشروع."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefreshData}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث البيانات
          </Button>
          <Button
            onClick={() => router.push(`/data-entry/projects/${projectId}/edit`)}
            variant="outline"
            size="sm"
          >
            <Edit className="h-4 w-4 ml-2" />
            تعديل المشروع
          </Button>
        </div>
      </div>

      {/* الإحصائيات الأساسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحالة</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="mb-1">{getStatusBadge(project.status)}</div>
            <p className="text-xs text-muted-foreground">
              {new Date(project.createdAt).toLocaleDateString('ar-EG')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفقرات</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.totalParagraphs}</div>
            <p className="text-xs text-muted-foreground">إجمالي عدد الفقرات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الكلمات</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.wordCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">إجمالي عدد الكلمات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">اللغات</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.targetLanguages?.length || 0}</div>
            <p className="text-xs text-muted-foreground">اللغات المستهدفة</p>
          </CardContent>
        </Card>
      </div>

      {/* علامات التبويب */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="paragraphs">الفقرات</TabsTrigger>
          <TabsTrigger value="assignments">المهام</TabsTrigger>
          <TabsTrigger value="progress">التقدم</TabsTrigger>
          <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">اللغة المصدر:</span>
                  <span className="font-medium">{project.sourceLanguageName} ({project.sourceLanguageCode})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المنشئ:</span>
                  <span className="font-medium">{project.creatorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                  <span className="font-medium">{new Date(project.createdAt).toLocaleString('ar-EG')}</span>
                </div>
                {project.updatedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">آخر تحديث:</span>
                    <span className="font-medium">{new Date(project.updatedAt).toLocaleString('ar-EG')}</span>
                  </div>
                )}
              </div>
              
              {project.targetLanguages && project.targetLanguages.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">اللغات المستهدفة:</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.targetLanguages.map((language) => (
                      <Badge key={language.languageId} variant="outline">
                        {language.languageName} ({language.languageCode})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paragraphs" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>فقرات المشروع</CardTitle>
              <div className="flex items-center gap-2"> {/* --- تعديل --- */}
                <Badge variant="outline">
                  {paragraphs.length} فقرة
                </Badge>
                <Button
                  size="sm"
                  onClick={() => setIsAddParagraphModalOpen(true)} // --- تعديل ---
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة فقرة
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingParagraphs ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>جاري تحميل الفقرات...</span>
                </div>
              ) : paragraphs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">لا توجد فقرات</h3>
                  <p className="text-muted-foreground mt-1">
                    لم يتم إضافة أي فقرات إلى هذا المشروع بعد.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">#</TableHead>
                        <TableHead className="text-right">النوع</TableHead>
                        <TableHead className="text-right">النص الأصلي</TableHead>
                        <TableHead className="text-right">الكلمات</TableHead>
                        <TableHead className="text-right">الترجمات</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paragraphs.map((paragraph) => (
                        <TableRow key={paragraph.paragraphId} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{paragraph.position}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {paragraph.paragraphType || 'عادي'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[300px]">
                              <p className="text-sm line-clamp-2 text-right">
                                {paragraph.originalText}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{paragraph.wordCount}</TableCell>
                          <TableCell>
                            {paragraph.translations && paragraph.translations.length > 0 ? (
                              <Badge variant="outline">
                                {paragraph.translations.length} ترجمة
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">لا يوجد</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getParagraphStatusBadge(paragraph)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>مهام المشروع</CardTitle>
              <Badge variant="outline">
                {assignments.length} مهمة
              </Badge>
            </CardHeader>
            <CardContent>
              {loadingAssignments ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>جاري تحميل المهام...</span>
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">لا توجد مهام</h3>
                  <p className="text-muted-foreground mt-1">
                    لم يتم تعيين أي مهام لهذا المشروع بعد.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المستخدم</TableHead>
                        <TableHead className="text-right">الدور</TableHead>
                        <TableHead className="text-right">اللغة</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الموعد النهائي</TableHead>
                        <TableHead className="text-right">الإنجاز</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => {
                        const status = getAssignmentStatus(assignment);
                        return (
                          <TableRow key={assignment.assignmentId} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{assignment.userName}</p>
                                  <p className="text-sm text-muted-foreground">{assignment.userEmail}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {assignment.role === 'Translator' ? 'مترجم' :
                                 assignment.role === 'Reviewer' ? 'مراجع' :
                                 assignment.role === 'Supervisor' ? 'مشرف' : assignment.role}
                              </Badge>
                            </TableCell>
                            <TableCell>{assignment.targetLanguageName}</TableCell>
                            <TableCell>
                              {getStatusBadge(status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {new Date(assignment.deadline).toLocaleDateString('ar-EG')}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(assignment.deadline).toLocaleTimeString('ar-EG')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {assignment.completedAt ? (
                                <div className="flex flex-col">
                                  <span className="font-medium text-green-600">
                                    {new Date(assignment.completedAt).toLocaleDateString('ar-EG')}
                                  </span>
                                  <span className="text-xs text-muted-foreground">مكتمل</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">قيد التنفيذ</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>معدل التقدم</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>جاري تحميل إحصائيات التقدم...</span>
                </div>
              ) : stats ? (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">التقدم العام</span>
                      <span className="font-bold">{stats.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className="bg-primary h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${stats.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.translatedParagraphs}</div>
                        <div className="text-sm text-muted-foreground">فقرات مترجمة</div>
                        <div className="text-xs text-blue-600 mt-1">
                          {Math.round((stats.translatedParagraphs / stats.totalParagraphs) * 100)}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">{stats.reviewedParagraphs}</div>
                        <div className="text-sm text-muted-foreground">فقرات مراجعة</div>
                        <div className="text-xs text-orange-600 mt-1">
                          {Math.round((stats.reviewedParagraphs / stats.totalParagraphs) * 100)}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.approvedParagraphs}</div>
                        <div className="text-sm text-muted-foreground">فقرات معتمدة</div>
                        <div className="text-xs text-green-600 mt-1">
                          {Math.round((stats.approvedParagraphs / stats.totalParagraphs) * 100)}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">لا توجد بيانات تقدم</h3>
                  <p className="text-muted-foreground mt-1">
                    لا توجد بيانات تقدم متاحة لهذا المشروع.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>الإحصائيات التفصيلية</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>جاري تحميل الإحصائيات...</span>
                </div>
              ) : stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">الإحصائيات العامة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">الفقرات الإجمالية:</span>
                        <span className="font-bold">{stats.totalParagraphs}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">المهام المعلقة:</span>
                        <Badge variant="outline">{stats.pendingAssignments}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">المهام المكتملة:</span>
                        <Badge variant="success">{stats.completedAssignments}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">نسبة الإنجاز:</span>
                        <span className="font-bold text-green-600">{stats.progressPercentage}%</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">معدلات الإنجاز</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">نسبة الترجمة:</span>
                        <span className="font-bold text-blue-600">
                          {stats.totalParagraphs > 0 ? Math.round((stats.translatedParagraphs / stats.totalParagraphs) * 100) : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">نسبة المراجعة:</span>
                        <span className="font-bold text-orange-600">
                          {stats.totalParagraphs > 0 ? Math.round((stats.reviewedParagraphs / stats.totalParagraphs) * 100) : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">نسبة الاعتماد:</span>
                        <span className="font-bold text-green-600">
                          {stats.totalParagraphs > 0 ? Math.round((stats.approvedParagraphs / stats.totalParagraphs) * 100) : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">الفقرات المتبقية:</span>
                        <span className="font-bold">
                          {stats.totalParagraphs - stats.approvedParagraphs}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <PieChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">لا توجد بيانات إحصائية</h3>
                  <p className="text-muted-foreground mt-1">
                    لا توجد بيانات إحصائية متاحة لهذا المشروع.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- نموذج إضافة فقرة --- */}
      <Dialog open={isAddParagraphModalOpen} onOpenChange={setIsAddParagraphModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة فقرة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="paragraphType" className="text-sm font-medium mb-2 block">
                نوع الفقرة (اختياري)
              </label>
              <Input
                id="paragraphType"
                value={newParagraphType}
                onChange={(e) => setNewParagraphType(e.target.value)}
                placeholder="مثلاً: عنوان، نص عادي، ملاحظة..."
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="paragraphText" className="text-sm font-medium mb-2 block">
                النص الأصلي
              </label>
              <Textarea
                id="paragraphText"
                value={newParagraphText}
                onChange={(e) => setNewParagraphText(e.target.value)}
                placeholder="أدخل نص الفقرة هنا..."
                rows={4}
                className="mt-1"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddParagraphModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handleAddParagraph}
              disabled={isAddingParagraph}
            >
              {isAddingParagraph ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الإضافة...
                </>
              ) : (
                "إضافة"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* --- النهاية --- */}
    </div>
  );
}