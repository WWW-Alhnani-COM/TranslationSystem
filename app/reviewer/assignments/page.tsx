"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import type { AssignmentResponseDto } from "@/types";
import {
  MoreHorizontal,
  Search,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Languages,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export default function ReviewerAssignmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user?.userId) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(`Assignments/user/${user?.userId}`);
      setAssignments(data || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في تحميل المهام",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = assignments.filter(
    (assignment) =>
      assignment.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.targetLanguageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "Pending":
        return <Badge variant="outline">قيد الانتظار</Badge>;
      case "In Progress":
        return <Badge variant="secondary">قيد المراجعة</Badge>;
      case "Completed":
        return <Badge variant="success">مكتملة</Badge>;
      case "Submitted":
        return <Badge variant="default">مُقدَّمة</Badge>;
      case "Cancelled":
        return <Badge variant="destructive">ملغاة</Badge>;
      default:
        return <Badge>{status || "غير معروف"}</Badge>;
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "In Progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "Pending":
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleViewDetails = (assignmentId: number) => {
    router.push(`/reviewer/assignments/${assignmentId}`);
  };

  const handleStartReview = (assignmentId: number) => {
    router.push(`/reviewer/assignments/${assignmentId}/review`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">مهام المراجعة</h1>
          <p className="text-muted-foreground mt-1">إدارة وتتبع مهام مراجعة الترجمات</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>قائمة المهام</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="بحث في المهام..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">لا توجد مهام</h3>
              <p className="text-muted-foreground mt-1">
                {searchTerm ? "لم يتم العثور على مهام تطابق البحث" : "لا توجد مهام مراجعة مخصصة لك حالياً"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المشروع</TableHead>
                  <TableHead>اللغة المستهدفة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ التعيين</TableHead>
                  <TableHead>الموعد النهائي</TableHead>
                  <TableHead>الإحصائيات</TableHead>
                  <TableHead className="w-[80px]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.assignmentId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(assignment.status)}
                        <div>
                          <div className="font-medium">{assignment.projectName}</div>
                          <div className="text-sm text-muted-foreground">
                            #{assignment.assignmentId}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Languages className="h-4 w-4 text-muted-foreground" />
                        <span>{assignment.targetLanguageName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(assignment.assignedAt).toLocaleDateString("ar-EG")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {assignment.deadline
                          ? new Date(assignment.deadline).toLocaleDateString("ar-EG")
                          : "غير محدد"}
                        {assignment.isOverdue && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-semibold">{assignment.reviewCount}</div>
                          <div className="text-muted-foreground">مراجعات</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(assignment.assignmentId)}>
                            <FileText className="h-4 w-4 ml-2" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          {(assignment.status === "Pending" || assignment.status === "In Progress") && (
                            <DropdownMenuItem onClick={() => handleStartReview(assignment.assignmentId)}>
                              <CheckCircle className="h-4 w-4 ml-2" />
                              بدء المراجعة
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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