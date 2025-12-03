// app/data-entry/approved-projects/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { projectService } from '@/lib/api-services';
import { ProjectResponseDto, ProjectStatsDto } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EyeIcon, AlertCircleIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function DataEntryApprovedProjectsPage() {
  const [projects, setProjects] = useState<
    Array<{ project: ProjectResponseDto; stats: ProjectStatsDto }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApprovedProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const allProjects = await projectService.getAll();
        const statsPromises = allProjects.map((project: ProjectResponseDto) =>
          projectService.getStats(project.projectId).catch((err) => {
            console.warn(`فشل تحميل إحصائيات المشروع ${project.projectId}:`, err);
            return null;
          })
        );
        
        const statsList = await Promise.all(statsPromises);

        type ProjectWithStats = { project: ProjectResponseDto; stats: ProjectStatsDto | null };

        const filtered = allProjects
          .map((project: ProjectResponseDto, index: number): ProjectWithStats => ({
            project,
            stats: statsList[index],
          }))
          .filter(
            (item: { stats: { approvedParagraphs: any; } | null; }): item is { project: ProjectResponseDto; stats: ProjectStatsDto } =>
              item.stats !== null && (item.stats.approvedParagraphs || 0) > 0
          );

        setProjects(filtered);
      } catch (error) {
        console.error('فشل تحميل المشاريع المعتمدة:', error);
        setError('فشل تحميل البيانات. يرجى المحاولة لاحقًا.');
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'فشل تحميل المشاريع المعتمدة.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedProjects();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل المشاريع...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircleIcon className="h-5 w-5 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">المشاريع التي تم اعتماد فقرات منها من قِبل المشرفين</h1>
          <p className="text-muted-foreground mt-1">
            قائمة بالمشاريع التي تحتوي على فقرات معتمدة
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-muted border border-dashed rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            لا توجد مشاريع تحتوي على فقرات معتمدة حتى الآن.
          </p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-medium">اسم المشروع</TableHead>
                <TableHead className="font-medium">لغة المصدر</TableHead>
                <TableHead className="font-medium">الحالة</TableHead>
                <TableHead className="font-medium">تاريخ الإنشاء</TableHead>
                <TableHead className="font-medium text-right">الفقرات المعتمدة</TableHead>
                <TableHead className="font-medium text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map(({ project, stats }) => (
                <TableRow key={project.projectId} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium py-3">{project.projectName}</TableCell>
                  <TableCell className="py-3">{project.sourceLanguageName}</TableCell>
                  <TableCell className="py-3">
                    <Badge variant="secondary" className="px-2 py-1 text-xs">
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    {format(new Date(project.createdAt), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600 py-3">
                    {stats.approvedParagraphs}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                      <Link href={`/data-entry/approved-projects/${project.projectId}`}>
                        <EyeIcon className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                        <span className="sr-only">معاينة المشروع</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}