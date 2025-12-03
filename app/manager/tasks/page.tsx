'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, FileText, Clock, CheckCircle, Ban, Filter, Search, ChevronDown, ChevronUp, Plus } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Interfaces based on API documentation ---
// Assuming relevant DTOs from the schema

// Example DTO for Assignment (partial)
interface AssignmentResponseDto {
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
  deadline?: string;
  completedAt?: string;
  isOverdue: boolean;
  translationCount: number;
  reviewCount: number;
  // ... other fields if needed
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  timestamp?: string;
}

// --- Helper functions ---
const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return 'غير محدد';
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('ar-EG', options);
};

const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'outline';
    case 'in progress':
      return 'default';
    case 'completed':
      return 'secondary';
    case 'rejected':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return <Clock className="w-4 h-4" />;
    case 'in progress':
      return <FileText className="w-4 h-4" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4" />;
    case 'rejected':
      return <Ban className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
};

export default function ManagerTasksPage() {
  const [assignments, setAssignments] = useState<AssignmentResponseDto[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<AssignmentResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ userId: number; userType: string; firstName: string } | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'projectName' | 'deadline' | 'status'>('deadline');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // Get user info from localStorage
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } catch (e) {
          console.error('Error parsing user from localStorage:', e);
          setError('Failed to parse user information.');
        }
      } else {
        setError('User information not found. Please log in.');
      }
    }
  }, []);

  useEffect(() => {
    if (!user?.userId) return;

    const fetchData = async () => {
      try {
        // Fetch All Assignments
        const assignmentsResponse = await fetch(`http://samali1-001-site1.stempurl.com/api/Assignments`);
        if (!assignmentsResponse.ok) {
          throw new Error(`HTTP error! status: ${assignmentsResponse.status}`);
        }
        const assignmentsResult: ApiResponse<AssignmentResponseDto[]> = await assignmentsResponse.json();
        if (assignmentsResult.success && assignmentsResult.data) {
          setAssignments(assignmentsResult.data);
          setFilteredAssignments(assignmentsResult.data); // Initially show all
        } else {
          throw new Error(assignmentsResult.message || 'Failed to fetch assignments.');
        }

      } catch (err: any) {
        console.error('Error fetching manager tasks ', err);
        setError(err.message || 'An unexpected error occurred while fetching tasks data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.userId]); // Dependency on userId to refetch when user changes

  // Apply filters and sorting whenever filters or assignments change
  useEffect(() => {
    let result = [...assignments];

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(assignment => assignment.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(assignment => assignment.role === roleFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(assignment => 
        assignment.projectName.toLowerCase().includes(query) ||
        assignment.userName.toLowerCase().includes(query) ||
        assignment.targetLanguageName.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortField === 'projectName') {
        const nameA = a.projectName.toLowerCase();
        const nameB = b.projectName.toLowerCase();
        return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else if (sortField === 'deadline') {
        const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
        const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortField === 'status') {
        const statusA = a.status.toLowerCase();
        const statusB = b.status.toLowerCase();
        return sortDirection === 'asc' ? statusA.localeCompare(statusB) : statusB.localeCompare(statusA);
      }
      return 0;
    });

    setFilteredAssignments(result);
  }, [assignments, statusFilter, roleFilter, searchQuery, sortField, sortDirection]);

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4 md:px-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user) {
    return null; // Or redirect to login if no user in localStorage
  }

  // Get counts for stats
  const pendingCount = assignments.filter(a => a.status === 'Pending').length;
  const inProgressCount = assignments.filter(a => a.status === 'In Progress').length;
  const completedCount = assignments.filter(a => a.status === 'Completed').length;
  const overdueCount = assignments.filter(a => a.isOverdue).length;

  // Get unique roles for filter dropdown
  const uniqueRoles = Array.from(new Set(assignments.map(a => a.role)));

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">إدارة المهام</h1>
        <p className="text-muted-foreground">
          إدارة المهام المُسندة للمستخدمين.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>المهام المعلقة</CardDescription>
            <CardTitle className="text-2xl font-bold">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>المهام قيد التنفيذ</CardDescription>
            <CardTitle className="text-2xl font-bold">{inProgressCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>المهام المكتملة</CardDescription>
            <CardTitle className="text-2xl font-bold">{completedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>المهام المتأخرة</CardDescription>
            <CardTitle className="text-2xl font-bold">{overdueCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            تصفية وبحث
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="بحث في المشاريع أو المستخدمين..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="all">جميع الحالات</option>
              <option value="Pending">معلقة</option>
              <option value="In Progress">قيد التنفيذ</option>
              <option value="Completed">مكتملة</option>
              <option value="Rejected">مرفوضة</option>
            </select>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="all">جميع الأدوار</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>قائمة المهام</span>
            <Button asChild variant="default">
              <Link href="/dashboard/manager/tasks/new">
                <Plus className="w-4 h-4 mr-2" />
                إضافة مهمة جديدة
              </Link>
            </Button>
          </CardTitle>
          <CardDescription>
            المهام المُسندة للمستخدمين وحالتها.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, idx) => (
                <Skeleton key={idx} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-8">
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  لا توجد مهام تطابق الفلاتر المختارة.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المشروع</TableHead>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>النهاية</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.assignmentId}>
                    <TableCell className="font-medium">{assignment.projectName}</TableCell>
                    <TableCell>{assignment.userName}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(assignment.role)}>
                        {assignment.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(assignment.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(assignment.status)}
                          {assignment.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(assignment.deadline)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/manager/tasks/${assignment.assignmentId}`}>
                          عرض التفاصيل
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}