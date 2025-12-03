// src/app/translator/projects/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle, AlertTriangle, User, Folder } from "lucide-react";

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
  status: string; // 'Pending', 'In Progress', 'Completed', 'Cancelled'
  assignedAt: string; // ISO date string
  deadline: string; // ISO date string
  completedAt: string | null; // ISO date string
  isOverdue: boolean;
  translationCount: number;
  reviewCount: number;
}

export default function TranslatorProjectsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
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
      // نستخدم GET /api/Assignments/user/{userId} للحصول على مهام المستخدم
      const data = await apiClient.get(`Assignments/user/${user.userId}`);
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
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">مشاريعي</h1>
        <p className="text-muted-foreground">
          عرض المهام المخصصة لك كمترجم
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-1">لا توجد مهام</h3>
          <p className="text-muted-foreground">
            لا توجد مهام مخصصة لك في الوقت الحالي.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <Card key={assignment.assignmentId} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg truncate">
                    {assignment.projectName}
                  </CardTitle>
                  {getStatusBadge(assignment.status, assignment.isOverdue)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <User className="h-4 w-4 mr-1" />
                  <span className="truncate">{assignment.userName}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">اللغة:</span>
                    <span>{assignment.targetLanguageName} ({assignment.targetLanguageCode})</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">الحالة:</span>
                    <span>{assignment.status}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">الموعد النهائي:</span>
                    <span>{new Date(assignment.deadline).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">الtranslations:</span>
                    <span>{assignment.translationCount}</span>
                  </div>
                </div>
                <Button 
                  className="w-full mt-4" 
                  onClick={() => router.push(`/translator/projects/${assignment.projectId}`)}
                >
                  عرض التفاصيل
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}