// src/app/data-entry/projects/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Folder, 
  FileText, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Eye,
  Download,
  Upload,
  MoreHorizontal
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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
  status: 'Draft' | 'Active' | 'InProgress' | 'Review' | 'Completed' | 'Cancelled';
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  totalParagraphs: number;
  wordCount: number;
  targetLanguages?: Array<{
    languageId: number;
    languageName: string;
    languageCode: string;
    textDirection: string;
  }>;
  assignmentsCount?: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredProjects(
        projects.filter(project => 
          project.projectName.toLowerCase().includes(term) ||
          project.description?.toLowerCase().includes(term) ||
          project.creatorName.toLowerCase().includes(term) ||
          project.sourceLanguageName.toLowerCase().includes(term) ||
          (project.targetLanguages && project.targetLanguages.some(lang => 
            lang.languageName.toLowerCase().includes(term) || 
            lang.languageCode.toLowerCase().includes(term)
          ))
        )
      );
    }
  }, [searchTerm, projects]);

  const fetchProjects = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // نستخدم GET /api/Projects/user/{userId} للحصول على مشاريع المستخدم فقط
      const data = await apiClient.get(`Projects/user/${user.userId}`);
      setProjects(data || []);
      setFilteredProjects(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في جلب المشاريع",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المشروع؟")) return;
    setDeletingId(id);
    try {
      await apiClient.delete(`Projects/${id}`);
      toast({
        title: "نجاح",
        description: "تم حذف المشروع بنجاح",
      });
      fetchProjects(); // تحديث القائمة
    } catch (error) {
      // تم التعامل مع الخطأ داخل apiClient
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
      case "InProgress":
        return <Badge variant="success">نشط</Badge>;
      case "Completed":
        return <Badge variant="secondary">مكتمل</Badge>;
      case "Draft":
        return <Badge variant="outline">مسودة</Badge>;
      case "Review":
        return <Badge variant="warning">قيد المراجعة</Badge>;
      case "Cancelled":
        return <Badge variant="destructive">ملغى</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">المشاريع</h1>
          <Button onClick={() => router.push('/data-entry/projects/new')}>
            <Plus className="h-4 w-4 mr-2" />
            مشروع جديد
          </Button>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="p-4">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="bg-muted rounded-lg p-3">
                  <Folder className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">المشاريع</h1>
          <p className="text-muted-foreground mt-2">
            إدارة مشاريع الترجمة ({projects.length} مشروع)
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن مشروع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => router.push('/data-entry/projects/new')}>
            <Plus className="h-4 w-4 mr-2" />
            مشروع جديد
          </Button>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-1">لا توجد مشاريع</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "لم يتم العثور على مشاريع مطابقة للبحث" : "ابدأ بإنشاء مشروع جديد"}
          </p>
          <Button onClick={() => router.push('/data-entry/projects/new')}>
            <Plus className="h-4 w-4 mr-2" />
            إنشاء مشروع أول
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <Card key={project.projectId} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Folder className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg truncate max-w-[70%]">{project.projectName}</CardTitle>
                  </div>
                  {getStatusBadge(project.status)}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description || "لا يوجد وصف"}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>{project.totalParagraphs} فقرة</span>
                    <span className="mx-2">•</span>
                    <span>{project.wordCount} كلمة</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>المصدر: {project.sourceLanguageName}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    <span>اللغات: {project.targetLanguages?.map(l => l.languageCode).join(', ') || 'لا توجد'}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>المنشئ: {project.creatorName}</span>
                  </div>
                  <div className="pt-3 flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => router.push(`/data-entry/projects/${project.projectId}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      عرض
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => router.push(`/data-entry/projects/${project.projectId}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(project.projectId)}
                        disabled={deletingId === project.projectId}
                      >
                        {deletingId === project.projectId ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}