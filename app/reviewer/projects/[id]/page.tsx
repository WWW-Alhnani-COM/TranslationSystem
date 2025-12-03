// src/app/reviewer/projects/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  Users, 
  Globe, 
  Clock, 
  BarChart3,
  AlertCircle
} from "lucide-react";
import apiServices from "@/lib/api-services";
import { Project, ProjectStatsDto } from "@/types";

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = parseInt(params.id as string);
  
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projectData, statsData] = await Promise.all([
        apiServices.projects.getById(projectId),
        apiServices.projects.getStats(projectId)
      ]);

      setProject(projectData);
      setStats(statsData);
    } catch (err: any) {
      console.error("Error fetching project data:", err);
      setError("فشل في تحميل بيانات المشروع");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "Draft": { variant: "outline" as const, label: "مسودة" },
      "Active": { variant: "secondary" as const, label: "نشط" },
      "InProgress": { variant: "default" as const, label: "قيد التنفيذ" },
      "Completed": { variant: "success" as const, label: "مكتمل" },
      "Cancelled": { variant: "destructive" as const, label: "ملغى" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>المشروع غير موجود</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project.projectName}</h1>
          <p className="text-gray-600 mt-2">{project.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(project.status)}
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الفقرات</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.totalParagraphs}</div>
            <p className="text-xs text-muted-foreground">{project.wordCount} كلمة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفقرات المترجمة</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.translatedParagraphs || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats ? Math.round((stats.translatedParagraphs / project.totalParagraphs) * 100) : 0}% من الإجمالي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفقرات المراجعة</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.reviewedParagraphs || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats ? Math.round((stats.reviewedParagraphs / project.totalParagraphs) * 100) : 0}% من الإجمالي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التقدم العام</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.progressPercentage || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.approvedParagraphs || 0} فقرة معتمدة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* المحتوى الرئيسي */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="languages">اللغات</TabsTrigger>
          <TabsTrigger value="assignments">المهام</TabsTrigger>
          <TabsTrigger value="progress">التقدم</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>معلومات المشروع</CardTitle>
              <CardDescription>تفاصيل المشروع الأساسية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">اللغة المصدر</h4>
                  <p>{project.sourceLanguageName} ({project.sourceLanguageCode})</p>
                </div>
                <div>
                  <h4 className="font-semibold">تاريخ الإنشاء</h4>
                  <p>{new Date(project.createdAt).toLocaleDateString('ar-SA')}</p>
                </div>
                <div>
                  <h4 className="font-semibold">المنشئ</h4>
                  <p>{project.creatorName}</p>
                </div>
                <div>
                  <h4 className="font-semibold">آخر تحديث</h4>
                  <p>{project.updatedAt ? new Date(project.updatedAt).toLocaleDateString('ar-SA') : 'لا يوجد'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages">
          <Card>
            <CardHeader>
              <CardTitle>اللغات المستهدفة</CardTitle>
              <CardDescription>اللغات المطلوب الترجمة إليها</CardDescription>
            </CardHeader>
            <CardContent>
              {project.targetLanguages && project.targetLanguages.length > 0 ? (
                <div className="space-y-2">
                  {project.targetLanguages.map((language) => (
                    <div key={language.languageId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Globe className="h-5 w-5 text-blue-500" />
                        <div>
                          <h4 className="font-semibold">{language.languageName}</h4>
                          <p className="text-sm text-gray-600">{language.languageCode}</p>
                        </div>
                      </div>
                      <Badge variant={language.isActive ? "default" : "outline"}>
                        {language.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>لا توجد لغات مستهدفة لهذا المشروع</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>تقدم المشروع</CardTitle>
              <CardDescription>تفاصيل تقدم العمل في المشروع</CardDescription>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>الفقرات المترجمة</span>
                    <span>{stats.translatedParagraphs} / {project.totalParagraphs}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(stats.translatedParagraphs / project.totalParagraphs) * 100}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>الفقرات المراجعة</span>
                    <span>{stats.reviewedParagraphs} / {project.totalParagraphs}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(stats.reviewedParagraphs / project.totalParagraphs) * 100}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>الفقرات المعتمدة</span>
                    <span>{stats.approvedParagraphs} / {project.totalParagraphs}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${(stats.approvedParagraphs / project.totalParagraphs) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>لا توجد بيانات تقدم متاحة</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}