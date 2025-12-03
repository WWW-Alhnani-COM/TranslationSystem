// app/data-entry/paragraphs/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Folder, FileText, MoreHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// تعريف نوع المشروع بناءً على OpenAPI
interface Project {
  projectId: number;
  projectName: string;
  description?: string;
  sourceLanguageId: number;
  sourceLanguageName: string;
  sourceLanguageCode: string;
  createdBy: number;
  creatorName: string;
  status: string; // 'Draft' | 'Active' | 'InProgress' | 'Completed' | 'Cancelled'
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
  assignmentsCount?: number;
}

export default function AllParagraphsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get("Projects");
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في جلب المشاريع",
      });
    } finally {
      setLoading(false);
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

  const handleViewParagraphs = (projectId: number) => {
    // التنقل إلى صفحة إدارة الفقرات لهذا المشروع
    router.push(`/data-entry/paragraphs/${projectId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">جميع المشاريع</h1>
          <p className="text-muted-foreground mt-2">
            عرض جميع المشاريع وفقراتها
          </p>
        </div>
      </div>

      {/* قائمة المشاريع */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            قائمة المشاريع
            <Badge variant="secondary" className="ml-2">
              {projects.length} مشروع
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">لا توجد مشاريع</h3>
              <p className="text-muted-foreground">
                لا توجد مشاريع لعرضها.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">#</TableHead>
                    <TableHead className="text-right">اسم المشروع</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">اللغة المصدر</TableHead>
                    <TableHead className="text-right">الفقرات</TableHead>
                    <TableHead className="text-right">الكلمات</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.projectId} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{project.projectId}</TableCell>
                      <TableCell className="font-medium">{project.projectName}</TableCell>
                      <TableCell>{getStatusBadge(project.status)}</TableCell>
                      <TableCell>{project.sourceLanguageName}</TableCell>
                      <TableCell>{project.totalParagraphs}</TableCell>
                      <TableCell>{project.wordCount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewParagraphs(project.projectId)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          عرض الفقرات
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}