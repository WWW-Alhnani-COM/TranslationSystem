'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Users, FileText, BarChart3, TrendingUp, User, FolderOpen, ArrowRight, CheckCircle, Clock, ClockIcon } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";

// --- Interfaces based on API documentation ---
// Assuming relevant DTOs from the schema

// Example DTO for User (partial)
interface UserResponseDto {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  // ... other fields if needed
}

// Example DTO for Project (partial)
interface ProjectResponseDto {
  projectId: number;
  projectName: string;
  description?: string;
  status: string;
  deadline?: string;
  createdAt: string;
  totalParagraphs: number;
  completedParagraphs: number;
  progressPercentage: number;
  // ... other fields if needed
}

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

// Example DTO for Dashboard Statistics (partial)
interface DashboardStatsDto {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  pendingProjects: number;
  totalUsers: number;
  activeUsers: number;
  totalParagraphs: number;
  translatedParagraphs: number;
  pendingReviews: number;
  pendingApprovals: number;
  totalTranslations: number;
  pendingTranslations: number;
  completedTranslations: number;
  totalWordsTranslated: number;
  averageQualityScore: number;
  recentProjects: ProjectProgressDto[];
  languageStats: any[];
}

// Example DTO for ProjectProgressDto (from Pasted_Text_1763508275090.txt)
interface ProjectProgressDto {
  projectId: number;
  projectName: string;
  progressPercentage: number;
  status: string;
  deadline: string; // ISO date string
}

// Example DTO for UserPerformanceDto (from Pasted_Text_1763508275090.txt)
interface UserPerformanceDto {
  userId: number;
  userName: string;
  userType: string;
  completedProjects: number;
  completedTranslations: number;
  completedReviews: number;
  averageQualityScore: number;
  totalWordsTranslated: number;
  lastActivity: string;
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

const getUserTypeBadgeVariant = (userType: string) => {
  switch (userType.toLowerCase()) {
    case 'manager':
      return 'secondary';
    case 'supervisor':
      return 'default';
    case 'translator':
      return 'outline';
    case 'reviewer':
      return 'outline';
    case 'dataentry':
      return 'outline';
    default:
      return 'outline';
  }
};

export default function ManagerDashboardPage() {
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [users, setUsers] = useState<UserResponseDto[]>([]);
  const [projects, setProjects] = useState<ProjectResponseDto[]>([]);
  const [assignments, setAssignments] = useState<AssignmentResponseDto[]>([]);
  const [userPerformance, setUserPerformance] = useState<UserPerformanceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ userId: number; userType: string; firstName: string } | null>(null);

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
        // Fetch Dashboard Stats
        const statsResponse = await fetch(`http://localhost:5296/api/Statistics/dashboard`);
        if (!statsResponse.ok) {
          throw new Error(`HTTP error! status: ${statsResponse.status}`);
        }
        const statsResult: ApiResponse<DashboardStatsDto> = await statsResponse.json();
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data);
        } else {
          throw new Error(statsResult.message || 'Failed to fetch dashboard statistics.');
        }

        // Fetch All Users
        const usersResponse = await fetch(`http://localhost:5296/api/Users`);
        if (!usersResponse.ok) {
          throw new Error(`HTTP error! status: ${usersResponse.status}`);
        }
        const usersResult: ApiResponse<UserResponseDto[]> = await usersResponse.json();
        if (usersResult.success && usersResult.data) {
          setUsers(usersResult.data);
        } else {
          throw new Error(usersResult.message || 'Failed to fetch users.');
        }

        // Fetch All Projects
        const projectsResponse = await fetch(`http://localhost:5296/api/Projects`);
        if (!projectsResponse.ok) {
          throw new Error(`HTTP error! status: ${projectsResponse.status}`);
        }
        const projectsResult: ApiResponse<ProjectResponseDto[]> = await projectsResponse.json();
        if (projectsResult.success && projectsResult.data) {
          setProjects(projectsResult.data);
        } else {
          throw new Error(projectsResult.message || 'Failed to fetch projects.');
        }

        // Fetch Assignments for Manager (optional)
        const assignmentsResponse = await fetch(`http://localhost:5296/api/Assignments`);
        if (!assignmentsResponse.ok) {
          console.warn(`Failed to fetch assignments: ${assignmentsResponse.status}`);
        } else {
          const assignmentsResult: ApiResponse<AssignmentResponseDto[]> = await assignmentsResponse.json();
          if (assignmentsResult.success && assignmentsResult.data) {
            setAssignments(assignmentsResult.data);
          } else {
            console.warn('Failed to fetch assignments ', assignmentsResult.message);
          }
        }

        // Fetch User Performance (if available)
        const performanceResponse = await fetch(`http://localhost:5296/api/Statistics/users/performance`);
        if (!performanceResponse.ok) {
          console.warn(`Failed to fetch user performance: ${performanceResponse.status}`);
          // Don't throw error, continue without performance data
        } else {
          const performanceResult: ApiResponse<UserPerformanceDto[]> = await performanceResponse.json();
          if (performanceResult.success && performanceResult.data) {
            setUserPerformance(performanceResult.data);
          } else {
            console.warn('Failed to fetch user performance ', performanceResult.message);
          }
        }

      } catch (err: any) {
        console.error('Error fetching manager dashboard ', err);
        setError(err.message || 'An unexpected error occurred while fetching dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.userId]); // Dependency on userId to refetch when user changes

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

  // Calculate derived stats from the full stats object if available
  const totalProjects = stats?.totalProjects || 0;
  const activeProjects = stats?.activeProjects || 0;
  const completedProjects = stats?.completedProjects || 0;
  const totalUsers = stats?.totalUsers || 0;
  const activeUsers = stats?.activeUsers || 0;
  const totalTranslations = stats?.totalTranslations || 0;
  const pendingTranslations = stats?.pendingTranslations || 0;
  const totalWordsTranslated = stats?.totalWordsTranslated || 0;
  const averageQualityScore = stats?.averageQualityScore || 0;

  // Filter data for display
  const displayedUsers = users.slice(0, 5); // Limit to 5 for brevity
  const displayedProjects = projects.slice(0, 5); // Limit to 5 for brevity
  const displayedAssignments = assignments.slice(0, 5); // Limit to 5 for brevity

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">مرحباً، {user.firstName || 'مدير'}</h1>
        <p className="text-muted-foreground">
          لوحة تحكم المدير. تحقق من الأداء العام والمستخدمين والمشاريع.
        </p>
      </div>

      {/* Quick Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  <Skeleton className="h-4 w-3/4" />
                </CardTitle>
                <CardDescription>
                  <Skeleton className="h-4 w-1/2" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Skeleton className="h-8 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>إجمالي المشاريع</CardDescription>
              <CardTitle className="text-2xl font-bold">{totalProjects}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                <TrendingUp className="inline w-3 h-3 mr-1" />
                {activeProjects} نشطة
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>المشاريع المكتملة</CardDescription>
              <CardTitle className="text-2xl font-bold">{completedProjects}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                <CheckCircle className="inline w-3 h-3 mr-1" />
                {totalTranslations} ترجمات
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>عدد المستخدمين</CardDescription>
              <CardTitle className="text-2xl font-bold">{totalUsers}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                <Users className="inline w-3 h-3 mr-1" />
                {activeUsers} نشط
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>كلمات مترجمة</CardDescription>
              <CardTitle className="text-2xl font-bold">{totalWordsTranslated}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                <BarChart3 className="inline w-3 h-3 mr-1" />
                متوسط الجودة: {averageQualityScore.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            المستخدمون
          </CardTitle>
          <CardDescription>
            قائمة المستخدمين في النظام.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, idx) => (
                <Skeleton key={idx} className="h-16 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">لا توجد مستخدمين في النظام.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedUsers.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getUserTypeBadgeVariant(user.userType)}>
                        {user.userType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'destructive'}>
                        {user.isActive ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/manager/users/${user.userId}`}>
                          عرض التفاصيل
                          <ArrowRight className="w-4 h-4 ml-1" />
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

      {/* Projects Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            المشاريع
          </CardTitle>
          <CardDescription>
            المشاريع في النظام وحالتها.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, idx) => (
                <Skeleton key={idx} className="h-16 w-full" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">لا توجد مشاريع في النظام.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المشروع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التقدم</TableHead>
                  <TableHead>النهاية</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {displayedProjects.map((project) => (
                  <TableRow key={project.projectId}>
                    <TableCell className="font-medium">{project.projectName}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(project.status)}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* --- تعديل هنا --- */}
                        <span>{project.progressPercentage !== undefined ? project.progressPercentage.toFixed(2) : '0.00'}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(project.deadline)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/manager/projects/${project.projectId}`}>
                          عرض التفاصيل
                          <ArrowRight className="w-4 h-4 ml-1" />
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

      {/* Assignments Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            المهام
          </CardTitle>
          <CardDescription>
            المهام في النظام وحالتها.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, idx) => (
                <Skeleton key={idx} className="h-16 w-full" />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">لا توجد مهام في النظام.</p>
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
                {displayedAssignments.map((assignment) => (
                  <TableRow key={assignment.assignmentId}>
                    <TableCell className="font-medium">{assignment.projectName}</TableCell>
                    <TableCell>{assignment.userName}</TableCell>
                    <TableCell>
                      <Badge variant={getUserTypeBadgeVariant(assignment.role)}>
                        {assignment.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(assignment.status)}>
                        <div className="flex items-center gap-1">
                          {assignment.status === 'Pending' && <ClockIcon className="w-4 h-4" />}
                          {assignment.status === 'In Progress' && <FileText className="w-4 h-4" />}
                          {assignment.status === 'Completed' && <CheckCircle className="w-4 h-4" />}
                          {assignment.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(assignment.deadline)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/manager/assignments/${assignment.assignmentId}`}>
                          عرض التفاصيل
                          <ArrowRight className="w-4 h-4 ml-1" />
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

      {/* Team Performance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            أداء الفريق
          </CardTitle>
          <CardDescription>
            إحصائيات أداء المستخدمين.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, idx) => (
                <Skeleton key={idx} className="h-16 w-full" />
              ))}
            </div>
          ) : userPerformance.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">لا توجد بيانات أداء الفريق.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>المشاريع المكتملة</TableHead>
                  <TableHead>الترجمات المكتملة</TableHead>
                  <TableHead>متوسط الجودة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userPerformance.map((userPerf) => (
                  <TableRow key={userPerf.userId}>
                    <TableCell className="font-medium">{userPerf.userName}</TableCell>
                    <TableCell>
                      <Badge variant={getUserTypeBadgeVariant(userPerf.userType)}>
                        {userPerf.userType}
                      </Badge>
                    </TableCell>
                    <TableCell>{userPerf.completedProjects}</TableCell>
                    <TableCell>{userPerf.completedTranslations}</TableCell>
                    <TableCell>{userPerf.averageQualityScore.toFixed(2)}</TableCell>
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