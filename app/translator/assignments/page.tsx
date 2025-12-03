// src/app/translator/assignments/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  ArrowUpDown, 
  Search, 
  Filter, 
  Play, 
  Eye, 
  Clock, 
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FolderOpen,
  FileText,
  Languages,
  Calendar,
  User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5296/api';

// أنواع البيانات
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

export default function AssignmentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('deadline');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [refreshing, setRefreshing] = useState(false);

  // جلب المهام
  const fetchAssignments = async () => {
    if (!user?.userId) return;

    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);
      
      let assignmentsData: Assignment[] = [];
      
      // المحاولة الأولى: جلب مهام المستخدم المباشرة
      const userAssignmentsResponse = await fetch(`${API_BASE_URL}/Assignments/user/${user.userId}`);
      
      if (userAssignmentsResponse.ok) {
        const userData = await userAssignmentsResponse.json();
        if (userData.success && userData.data) {
          assignmentsData = userData.data;
        }
      }
      
      // إذا لم تكن هناك مهام مباشرة، نجلب المهام حسب الدور
      if (assignmentsData.length === 0) {
        const roleAssignmentsResponse = await fetch(`${API_BASE_URL}/Assignments/role/Translator`);
        
        if (roleAssignmentsResponse.ok) {
          const roleData = await roleAssignmentsResponse.json();
          if (roleData.success && roleData.data) {
            assignmentsData = roleData.data;
          }
        }
      }
      
      // إذا لم تنجح أي من المحاولات، نرمي خطأ
      if (assignmentsData.length === 0) {
        throw new Error('لا توجد مهام متاحة حالياً');
      }

      setAssignments(assignmentsData);
      
    } catch (err: any) {
      console.error('Error fetching assignments:', err);
      setError(err.message || 'فشل في تحميل المهام');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [user?.userId]);

  // فلترة وفرز المهام
  const filteredAndSortedAssignments = assignments
    .filter(assignment => {
      const matchesSearch = 
        assignment.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.targetLanguageName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.role?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'projectName':
          comparison = (a.projectName || '').localeCompare(b.projectName || '');
          break;
        case 'targetLanguageName':
          comparison = (a.targetLanguageName || '').localeCompare(b.targetLanguageName || '');
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        case 'deadline':
          comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          break;
        case 'assignedAt':
          comparison = new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime();
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // تحديد لون الحالة
  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (isOverdue) {
      return (
        <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">
          متأخر
        </Badge>
      );
    }

    const statusConfig: Record<string, { color: string; text: string }> = {
      'Pending': { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', text: 'في الانتظار' },
      'InProgress': { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', text: 'قيد العمل' },
      'Completed': { color: 'bg-green-500/10 text-green-500 border-green-500/20', text: 'مكتمل' },
      'Cancelled': { color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', text: 'ملغي' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', text: status };
    return <Badge variant="secondary" className={config.color}>{config.text}</Badge>;
  };

  // حساب المهام في الصفحة الحالية
  const paginatedAssignments = filteredAndSortedAssignments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAndSortedAssignments.length / itemsPerPage);

  // دالة لتحديد لون الموعد النهائي
  const getDeadlineColor = (deadline: string, isOverdue: boolean) => {
    if (isOverdue) {
      return 'text-red-500 font-medium';
    }
    
    try {
      const deadlineDate = new Date(deadline);
      const today = new Date();
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 3 && diffDays >= 0) {
        return 'text-orange-500 font-medium';
      } else {
        return 'text-muted-foreground';
      }
    } catch {
      return 'text-muted-foreground';
    }
  };

  // معالجة النقر على الصف
  const handleRowClick = (assignmentId: number) => {
    router.push(`/translator/assignments/${assignmentId}`);
  };

  // معالجة النقر على زر البدء
  const handleStartTranslation = (assignmentId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/translator/translate/${assignmentId}`);
  };

  // معالجة النقر على زر التفاصيل
  const handleViewDetails = (assignmentId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/translator/assignments/${assignmentId}`);
  };

  // دالة لفرز الجدول
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // حساب الإحصائيات
  const calculateStats = () => {
    const totalAssignments = assignments.length;
    const activeAssignments = assignments.filter(a => a.status === 'InProgress').length;
    const completedAssignments = assignments.filter(a => a.status === 'Completed').length;
    const overdueAssignments = assignments.filter(a => a.isOverdue).length;

    return {
      totalAssignments,
      activeAssignments,
      completedAssignments,
      overdueAssignments
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* الهيدر */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">إدارة المهام</h1>
          <p className="text-muted-foreground mt-1">
            عرض وبدء مهام الترجمة المتاحة لك
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchAssignments} disabled={refreshing} className="gap-2">
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            تحديث
          </Button>
        </div>
      </div>

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="إجمالي المهام" 
          value={stats.totalAssignments} 
          icon={<FolderOpen className="w-5 h-5 text-blue-500" />}
          description="إجمالي المهام المتاحة"
        />
        <StatCard 
          title="المهام النشطة" 
          value={stats.activeAssignments} 
          icon={<FileText className="w-5 h-5 text-purple-500" />}
          description="المهام قيد العمل"
        />
        <StatCard 
          title="المهام المكتملة" 
          value={stats.completedAssignments} 
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          description="المهام المكتملة"
        />
        <StatCard 
          title="المهام المتأخرة" 
          value={stats.overdueAssignments} 
          icon={<AlertCircle className="w-5 h-5 text-red-500" />}
          description="المهام التي تجاوزت الموعد"
        />
      </div>

      {/* عناصر التحكم في الجدول */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>قائمة المهام المتاحة</CardTitle>
          <CardDescription>
            المهام المتاحة للمترجمين في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="ابحث في المهام..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="Pending">في الانتظار</SelectItem>
                  <SelectItem value="InProgress">قيد العمل</SelectItem>
                  <SelectItem value="Completed">مكتمل</SelectItem>
                  <SelectItem value="Overdue">متأخر</SelectItem>
                </SelectContent>
              </Select>
              
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded-lg px-2 py-1 text-sm"
              >
                <option value={5}>5 عناصر</option>
                <option value={10}>10 عناصر</option>
                <option value={20}>20 عنصر</option>
                <option value={50}>50 عنصر</option>
              </select>
            </div>
          </div>

          {/* جدول المهام */}
          {loading ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {['المشروع', 'اللغة', 'الحالة', 'الموعد النهائي', 'المترجم', 'الإجراءات'].map((header, i) => (
                      <TableHead key={i} className="animate-pulse bg-muted/30">
                        <div className="h-4 bg-muted rounded w-2/3 mx-auto"></div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(6)].map((_, j) => (
                        <TableCell key={j} className="animate-pulse bg-muted/30">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <AlertCircle className="w-10 h-10 mb-2 text-yellow-500" />
              <p className="text-lg font-medium mb-2">خطأ في تحميل البيانات</p>
              <p className="mb-4">{error}</p>
              <Button variant="outline" className="mt-4" onClick={fetchAssignments}>
                إعادة المحاولة
              </Button>
            </div>
          ) : paginatedAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <FolderOpen className="w-16 h-16 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1 text-foreground">لا توجد مهام متاحة</h3>
              <p className="mb-4">لا توجد مهام متاحة حالياً. يرجى التحقق لاحقاً.</p>
              <Button onClick={fetchAssignments} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                تحديث القائمة
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSort('projectName')}
                        className="flex items-center gap-1 hover:bg-transparent p-0"
                      >
                        المشروع
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSort('targetLanguageName')}
                        className="flex items-center gap-1 hover:bg-transparent p-0"
                      >
                        اللغة
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1 hover:bg-transparent p-0"
                      >
                        الحالة
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSort('deadline')}
                        className="flex items-center gap-1 hover:bg-transparent p-0"
                      >
                        الموعد النهائي
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </Button>
                    </TableHead>
                    <TableHead>المترجم</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAssignments.map((assignment) => (
                    <TableRow 
                      key={assignment.assignmentId} 
                      className="hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(assignment.assignmentId)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <div>
                            <span className="font-medium">{assignment.projectName}</span>
                            <p className="text-sm text-muted-foreground">
                              {assignment.role}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Languages className="w-4 h-4 text-green-500" />
                          <Badge variant="outline" className="text-xs">
                            {assignment.targetLanguageName}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(assignment.status, assignment.isOverdue)}
                      </TableCell>
                      <TableCell className={getDeadlineColor(assignment.deadline, assignment.isOverdue)}>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <div>
                            <div>{new Date(assignment.deadline).toLocaleDateString('ar-SA')}</div>
                            {assignment.isOverdue && (
                              <div className="text-xs text-red-500">متأخرة</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {assignment.userName}
                          </div>
                          <div className="text-muted-foreground text-xs">{assignment.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => handleViewDetails(assignment.assignmentId, e)}
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={(e) => handleStartTranslation(assignment.assignmentId, e)}
                            disabled={assignment.status === 'Completed'}
                            title={assignment.status === 'Completed' ? 'المهمة مكتملة' : 'بدء الترجمة'}
                          >
                            <div className="flex items-center gap-1">
                              <Play className="w-4 h-4" />
                              <span>ابدأ</span>
                            </div>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* التنقل بين الصفحات */}
          {paginatedAssignments.length > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center mt-6">
              <div className="text-sm text-muted-foreground mb-4 md:mb-0">
                عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, filteredAndSortedAssignments.length)} من {filteredAndSortedAssignments.length} مهمة
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={currentPage === pageNum ? "bg-primary text-primary-foreground" : ""}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// مكون البطاقة الإحصائية
function StatCard({ title, value, icon, description }: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  description: string 
}) {
  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}