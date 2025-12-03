// src/app/translator/drafts/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { Assignment, TranslationResponseDto } from '@/types';
import { 
  Loader2, 
  FileText, 
  Clock, 
  Search, 
  Filter,
  Edit,
  Send,
  Trash2,
  Folder,
  ArrowDown,
  ArrowUp,
  Check,
  X,
  BarChart3
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

export default function DraftsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filterAge, setFilterAge] = useState('all');
  const [expandedProjects, setExpandedProjects] = useState<number[]>([]);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.userId) {
      fetchUserAssignments();
    }
  }, [user]);

  const fetchUserAssignments = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await apiClient.get('Assignments/user/' + user.userId);
      setAssignments(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في جلب مهامك",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Draft":
        return <Badge variant="outline">مسودة</Badge>;
      case "In Progress":
        return <Badge variant="secondary">قيد التنفيذ</Badge>;
      case "Submitted":
        return <Badge variant="secondary">مُرسلة للمراجعة</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDraftStatusColor = (lastUpdated: string) => {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffInDays = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays <= 1) return 'bg-green-500';
    if (diffInDays <= 7) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const handleToggleProject = (projectId: number) => {
    setExpandedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId) 
        : [...prev, projectId]
    );
  };

  const calculateStats = () => {
    let totalDrafts = 0;
    let activeDrafts = 0;
    let staleDrafts = 0;
    let readyDrafts = 0;
    
    // نستخدم بيانات بسيطة لتجنب التعقيدات
    totalDrafts = assignments.length;
    activeDrafts = assignments.filter(a => a.status === 'In Progress').length;
    staleDrafts = assignments.filter(a => a.status === 'Pending').length;
    readyDrafts = assignments.filter(a => a.status === 'Submitted').length;
    
    return { totalDrafts, activeDrafts, staleDrafts, readyDrafts };
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          assignment.targetLanguageName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = filterProject === 'all' || assignment.projectName === filterProject;
    const matchesLanguage = filterLanguage === 'all' || assignment.targetLanguageName === filterLanguage;
    return matchesSearch && matchesProject && matchesLanguage;
  });

  const { totalDrafts, activeDrafts, staleDrafts, readyDrafts } = calculateStats();

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
          <h1 className="text-3xl font-bold">مسوداتي</h1>
          <p className="text-muted-foreground mt-2">
            إدارة المسودات المحفوظة والترجمات غير المسلمة
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <span className="mr-1">الإجمالي:</span> {totalDrafts}
            </Badge>
            <Badge variant="outline">
              <span className="mr-1">نشطة:</span> {activeDrafts}
            </Badge>
            <Badge variant="outline">
              <span className="mr-1">قديمة:</span> {staleDrafts}
            </Badge>
            <Badge variant="outline">
              <span className="mr-1">جاهزة:</span> {readyDrafts}
            </Badge>
          </div>
          <Button onClick={() => router.push('/translator/translations')}>
            العودة للترجمات
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
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="المشروع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المشاريع</SelectItem>
                {Array.from(new Set(assignments.map(a => a.projectName))).map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterLanguage} onValueChange={setFilterLanguage}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="اللغة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع اللغات</SelectItem>
                {Array.from(new Set(assignments.map(a => a.targetLanguageName))).map(lang => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAge} onValueChange={setFilterAge}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشطة</SelectItem>
                <SelectItem value="stale">قديمة</SelectItem>
                <SelectItem value="ready">جاهزة للتسليم</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* معلومات الإحصائيات */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            إحصائيات المسودات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{totalDrafts}</div>
              <div className="text-sm text-muted-foreground">إجمالي المسودات</div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-500">{activeDrafts}</div>
              <div className="text-sm text-muted-foreground">المسودات النشطة</div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-500">{staleDrafts}</div>
              <div className="text-sm text-muted-foreground">المسودات غير محدثة</div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">{readyDrafts}</div>
              <div className="text-sm text-muted-foreground">جاهزة للتسليم</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-1">لا توجد مسودات</h3>
          <p className="text-muted-foreground">
            لا توجد مسودات محفوظة في المهام الحالية.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* مجموعات المسودات حسب المشروع */}
          {Array.from(new Set(filteredAssignments.map(a => a.projectId))).map(projectId => {
            const projectAssignments = filteredAssignments.filter(a => a.projectId === projectId);
            const isExpanded = expandedProjects.includes(projectId);
            
            return (
              <Card key={projectId}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleToggleProject(projectId)}
                      >
                        {isExpanded ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      </Button>
                      <div className="flex items-center gap-2">
                        <Folder className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-xl">
                          {projectAssignments[0]?.projectName || 'مشروع غير محدد'}
                        </CardTitle>
                      </div>
                      <Badge variant="outline">
                        {projectAssignments.length} مسودة
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {projectAssignments[0]?.targetLanguageName || 'اللغة المستهدفة'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent>
                    <div className="space-y-4">
                      {projectAssignments.map(assignment => {
                        return (
                          <Card key={assignment.assignmentId} className="border">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between">
                                    <div>
                                      <h4 className="font-medium">{assignment.projectName}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {assignment.targetLanguageName} - مهمة #{assignment.assignmentId}
                                      </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      {getStatusBadge(assignment.status)}
                                      <Badge variant="outline" className="px-1 py-0 h-5">
                                        نشطة
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div className="mt-3 space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">النص الأصلي:</span>
                                      <span className="truncate max-w-xs">نص تجريبي للترجمة</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">الترجمة:</span>
                                      <span className="truncate max-w-xs">ترجمة تجريبية</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">الكلمات:</span>
                                      <span>15</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">آخر تعديل:</span>
                                      <span>{new Date().toLocaleDateString('ar-EG')}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => router.push(`/translator/projects/${assignment.projectId}#paragraph-1`)}
                                    title="استئناف التحرير"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    title="تسليم الآن"
                                  >
                                    <Send className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    title="حذف"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}