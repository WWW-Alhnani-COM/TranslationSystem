// src/app/translator/translations/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { Assignment, Project } from '@/types';
import { 
  Loader2, 
  FileText, 
  Clock, 
  CheckCircle, 
  Search, 
  Filter,
  ArrowRight,
  BarChart3,
  Globe
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

// 🔧 دالة مساعدة لتنسيق التاريخ
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'غير محدد';
  try {
    return new Date(dateString).toLocaleDateString('ar-EG');
  } catch {
    return 'تاريخ غير صالح';
  }
};

export default function TranslationsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLanguage, setFilterLanguage] = useState('all');
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

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (isOverdue) {
      return <Badge variant="destructive">متأخر</Badge>;
    }
    switch (status) {
      case "Pending":
        return <Badge variant="outline">قيد الانتظار</Badge>;
      case "In Progress":
        return <Badge variant="secondary">قيد التنفيذ</Badge>;
      case "Completed":
        return <Badge variant="success">مكتمل</Badge>;
      case "Cancelled":
        return <Badge variant="destructive">ملغى</Badge>;
      case "Submitted":
        return <Badge variant="secondary">مُرسلة للمراجعة</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusColor = (status: string, isOverdue: boolean) => {
    if (isOverdue) return 'bg-red-500';
    switch (status) {
      case "Pending": return 'bg-gray-500';
      case "In Progress": return 'bg-yellow-500';
      case "Completed": return 'bg-green-500';
      case "Cancelled": return 'bg-red-500';
      case "Submitted": return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          assignment.targetLanguageName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;
    const matchesLanguage = filterLanguage === 'all' || assignment.targetLanguageName === filterLanguage;
    return matchesSearch && matchesStatus && matchesLanguage;
  });

  // حساب الإحصائيات
  const activeTasks = assignments.filter(a => a.status === 'In Progress' || a.status === 'Pending').length;
  const completedTasks = assignments.filter(a => a.status === 'Completed').length;
  const overdueTasks = assignments.filter(a => a.isOverdue).length;

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
          <h1 className="text-3xl font-bold">ترجماتي</h1>
          <p className="text-muted-foreground mt-2">
            عرض وإدارة المهام والترجمات الحالية والمكتملة
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <span className="mr-1">المهام النشطة:</span> {activeTasks}
            </Badge>
            <Badge variant="outline">
              <span className="mr-1">المكتملة:</span> {completedTasks}
            </Badge>
            <Badge variant="outline">
              <span className="mr-1">المتأخرة:</span> {overdueTasks}
            </Badge>
          </div>
          <Button onClick={() => router.push('/translator/projects')}>
            إدارة المشاريع
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
                <SelectValue placeholder="حالة المهمة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="Pending">قيد الانتظار</SelectItem>
                <SelectItem value="In Progress">قيد التنفيذ</SelectItem>
                <SelectItem value="Submitted">مُرسلة للمراجعة</SelectItem>
                <SelectItem value="Completed">مكتمل</SelectItem>
                <SelectItem value="Cancelled">ملغى</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterLanguage} onValueChange={setFilterLanguage}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="اللغة المستهدفة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع اللغات</SelectItem>
                {Array.from(new Set(assignments.map(a => a.targetLanguageName))).map(lang => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-1">لا توجد مهام</h3>
          <p className="text-muted-foreground">
            لا توجد مهام مطابقة لبحثك أو تصفية الحالة.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => {
            // حساب التقدم (ببساطة)
            let progressPercentage = 50;
            let translatedParagraphs = 0;
            let totalWords = 0;

            return (
              <Card key={assignment.assignmentId} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate cursor-pointer" onClick={() => router.push(`/translator/projects/${assignment.projectId}`)}>
                        {assignment.projectName}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {assignment.targetLanguageName} ({assignment.targetLanguageCode})
                        </Badge>
                        {getStatusBadge(assignment.status, assignment.isOverdue)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {/* 🔧 الحل: استخدام دالة formatDate */}
                        <span>{formatDate(assignment.deadline)}</span>
                      </div>
                      {assignment.isOverdue && (
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
                        <span>{translatedParagraphs} / 10</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getStatusColor(assignment.status, assignment.isOverdue)}`} 
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* معلومات العمل */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">الكلمات:</span>
                      <span>{totalWords}</span>
                    </div>

                    {/* الأزرار */}
                    <div className="flex justify-between pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => router.push(`/translator/projects/${assignment.projectId}`)}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        التفاصيل
                      </Button>
                      <Button 
                        size="sm"
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        متابعة الترجمة
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
