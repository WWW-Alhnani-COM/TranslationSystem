'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { Project } from '@/types';
import { Plus, Loader2, FileText, Calendar, Trash2 } from 'lucide-react';

export default function ManagerProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await api.projects.getAll();
      if (response.success && response.data) {
        setProjects([]);
      }
    } catch (err: any) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      Active: { label: 'نشط', variant: 'default' },
      Completed: { label: 'مكتمل', variant: 'secondary' },
      Delayed: { label: 'متأخر', variant: 'destructive' },
      OnHold: { label: 'متوقف', variant: 'outline' },
    };
    const config = variants[status] || variants.Active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">المشاريع</h1>
            <p className="text-muted-foreground mt-1">إدارة جميع المشاريع</p>
          </div>
          <Button onClick={() => router.push('/manager/projects/new')}>
            <Plus className="h-4 w-4 ml-2" />
            مشروع جديد
          </Button>
        </div>

        <div className="grid gap-4">
          {projects.map((project) => (
            <Card key={project.projectId} className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/manager/projects/${project.projectId}`)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {project.projectName}
                    </CardTitle>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(project.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(project.createdAt).toLocaleDateString('ar')}
                  </div>
                  <div>
                    اللغة المصدر: {project.sourceLanguage?.name || 'غير محدد'}
                  </div>
                  <div>
                    اللغات المستهدفة: {project.targetLanguages?.length || 0}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {projects.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">لا توجد مشاريع بعد</p>
                <Button className="mt-4" onClick={() => router.push('/manager/projects/new')}>
                  <Plus className="h-4 w-4 ml-2" />
                  إنشاء مشروع جديد
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
