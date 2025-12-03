'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Users, User, Edit3, Trash2, Search, Filter, ChevronDown, ChevronUp, Plus } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

const getUserStatusBadgeVariant = (isActive: boolean) => {
  return isActive ? 'default' : 'destructive';
};

export default function ManagerUsersPage() {
  const [users, setUsers] = useState<UserResponseDto[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ userId: number; userType: string; firstName: string } | null>(null);
  
  // Filters
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'firstName' | 'email' | 'userType' | 'createdAt'>('createdAt');
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
        // Fetch All Users
        const usersResponse = await fetch(`http://localhost:5296/api/Users`);
        if (!usersResponse.ok) {
          throw new Error(`HTTP error! status: ${usersResponse.status}`);
        }
        const usersResult: ApiResponse<UserResponseDto[]> = await usersResponse.json();
        if (usersResult.success && usersResult.data) {
          setUsers(usersResult.data);
          setFilteredUsers(usersResult.data); // Initially show all
        } else {
          throw new Error(usersResult.message || 'Failed to fetch users.');
        }

      } catch (err: any) {
        console.error('Error fetching manager users ', err);
        setError(err.message || 'An unexpected error occurred while fetching users data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.userId]); // Dependency on userId to refetch when user changes

  // Apply filters and sorting whenever filters or users change
  useEffect(() => {
    let result = [...users];

    // Apply user type filter
    if (userTypeFilter !== 'all') {
      result = result.filter(user => user.userType === userTypeFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      result = result.filter(user => user.isActive === isActive);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortField === 'firstName') {
        const nameA = a.firstName.toLowerCase();
        const nameB = b.firstName.toLowerCase();
        return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else if (sortField === 'email') {
        const emailA = a.email.toLowerCase();
        const emailB = b.email.toLowerCase();
        return sortDirection === 'asc' ? emailA.localeCompare(emailB) : emailB.localeCompare(emailA);
      } else if (sortField === 'userType') {
        const typeA = a.userType.toLowerCase();
        const typeB = b.userType.toLowerCase();
        return sortDirection === 'asc' ? typeA.localeCompare(typeB) : typeB.localeCompare(typeA);
      } else if (sortField === 'createdAt') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });

    setFilteredUsers(result);
  }, [users, userTypeFilter, statusFilter, searchQuery, sortField, sortDirection]);

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
  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = users.filter(u => !u.isActive).length;
  const totalUsers = users.length;

  // Get unique user types for filter dropdown
  const uniqueUserTypes = Array.from(new Set(users.map(u => u.userType)));

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">إدارة المستخدمين</h1>
        <p className="text-muted-foreground">
          إدارة حسابات المستخدمين في النظام.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>المستخدمون النشطون</CardDescription>
            <CardTitle className="text-2xl font-bold">{activeUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>المستخدمون غير النشطون</CardDescription>
            <CardTitle className="text-2xl font-bold">{inactiveUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>إجمالي المستخدمين</CardDescription>
            <CardTitle className="text-2xl font-bold">{totalUsers}</CardTitle>
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
              placeholder="بحث في الأسماء أو البريد الإلكتروني..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="all">جميع الأدوار</option>
              {uniqueUserTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>قائمة المستخدمين</span>
            <Button asChild variant="default">
              <Link href="/dashboard/manager/users/new">
                <Plus className="w-4 h-4 mr-2" />
                إضافة مستخدم جديد
              </Link>
            </Button>
          </CardTitle>
          <CardDescription>
            إدارة حسابات المستخدمين في النظام.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, idx) => (
                <Skeleton key={idx} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  لا توجد مستخدمين يطابقون الفلاتر المختارة.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التسجيل</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getUserTypeBadgeVariant(user.userType)}>
                        {user.userType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getUserStatusBadgeVariant(user.isActive)}>
                        {user.isActive ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/manager/users/${user.userId}/edit`}>
                            <Edit3 className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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