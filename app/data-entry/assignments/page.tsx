// src/app/data-entry/assignments/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

// تعريف الأنواع بناءً على API
interface User {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  userType: string;
  phoneNumber?: string;
  profileImage?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface Language {
  languageId: number;
  languageName: string;
  languageCode: string;
  textDirection: 'ltr' | 'rtl';
  isActive: boolean;
  projectCount: number;
}

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
  assignedAt: string; // ISO date string
  deadline: string; // ISO date string
  completedAt: string | null; // ISO date string
  isOverdue: boolean;
  translationCount: number;
  reviewCount: number;
}

interface CreateAssignmentDto {
  projectId: number;
  userId: number;
  role: string; // 'Translator' | 'Reviewer' | 'Supervisor'
  targetLanguageId: number;
  deadline: string; // ISO date string
}

// تعريف نوع إنشاء الإشعار
interface CreateNotificationDto {
  userId: number; // المستخدم المستلم
  title: string;  // عنوان الإشعار
  message: string; // نص الإشعار
  relatedType?: string; // (اختياري) نوع الكيان المرتبط (مثلاً: Assignment)
  relatedId?: number;   // (اختياري) معرف الكيان المرتبط (مثلاً: assignmentId)
}

export default function AssignmentsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [projects, setProjects] = useState<any[]>([]); // يمكن تعريف نوع المشروع لاحقًا
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<CreateAssignmentDto>({
    projectId: 0,
    userId: 0,
    role: "Translator",
    targetLanguageId: 0,
    deadline: new Date().toISOString().slice(0, 16), // 'YYYY-MM-DDTHH:mm'
  });

  const router = useRouter();

  useEffect(() => {
    fetchUsers();
    fetchLanguages();
    fetchProjects();
    fetchAssignments();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiClient.get("Users");
      setUsers(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في جلب المستخدمين",
      });
    }
  };

  const fetchLanguages = async () => {
    try {
      const data = await apiClient.get("Languages");
      setLanguages(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في جلب اللغات",
      });
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await apiClient.get("Projects");
      setProjects(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في جلب المشاريع",
      });
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get("Assignments");
      setAssignments(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في جلب المهام",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.projectId === 0 || formData.userId === 0 || formData.targetLanguageId === 0) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
      });
      return;
    }

    try {
      // 1. قم بتعيين المهمة
      const createdAssignment: Assignment = await apiClient.post("Assignments", formData);
      
      // 2. أنشئ إشعارًا للمستخدم المعيّن
      const notificationData: CreateNotificationDto = {
        userId: formData.userId, // المستلم هو المستخدم الذي تم تعيين المهمة إليه
        title: "مهمة جديدة معيّنة",
        message: `لقد تم تعيين مهمة جديدة لك في مشروع "${projects.find(p => p.projectId === formData.projectId)?.projectName || 'Project'}" للدور "${formData.role}" باللغة "${languages.find(l => l.languageId === formData.targetLanguageId)?.languageName || 'Language'}".`,
        relatedType: "Assignment", // حقل اختياري لربط الإشعار ب_ENTITY_
        relatedId: createdAssignment.assignmentId, // حقل اختياري لربط الإشعار ب_ENTITY_
      };

      // 3. أرسل الإشعار إلى الخادم
      await apiClient.post("Notifications", notificationData);

      toast({
        title: "نجاح",
        description: "تم تعيين المهمة وإرسال الإشعار بنجاح",
      });
      setFormData({
        projectId: 0,
        userId: 0,
        role: "Translator",
        targetLanguageId: 0,
        deadline: new Date().toISOString().slice(0, 16),
      });
      fetchAssignments(); // تحديث القائمة
    } catch (error) {
      console.error("Error creating assignment or notification:", error);
      // تم التعامل مع الخطأ داخل apiClient
      // ملاحظة: إذا فشل إنشاء المهمة، فلن يتم إنشاء الإشعار.
      // إذا فشل إنشاء الإشعار، فسيتم عرض رسالة نجاح تعيين المهمة فقط.
      // يمكنك التعامل مع هذه الحالات بشكل منفصل إذا لزم الأمر.
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه المهمة؟")) return;
    try {
      await apiClient.delete(`Assignments/${id}`);
      toast({
        title: "نجاح",
        description: "تم حذف المهمة بنجاح",
      });
      fetchAssignments(); // تحديث القائمة
    } catch (error) {
      // تم التعامل مع الخطأ داخل apiClient
    }
  };

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (isOverdue) {
      return <Badge variant="destructive">متأخر</Badge>;
    }
    switch (status) {
      case "Active":
      case "In Progress":
        return <Badge variant="secondary">نشط</Badge>;
      case "Completed":
        return <Badge variant="secondary">مكتمل</Badge>;
      case "Pending":
        return <Badge variant="outline">قيد الانتظار</Badge>;
      case "Cancelled":
        return <Badge variant="destructive">ملغى</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">تعيين المهام</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* نموذج التعين */}
        <Card>
          <CardHeader>
            <CardTitle>تعيين مهمة جديدة</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectId">المشروع</Label>
                <Select value={formData.projectId.toString()} onValueChange={(v) => setFormData({...formData, projectId: parseInt(v)})}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مشروعًا" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.projectId} value={project.projectId.toString()}>
                        {project.projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userId">المستخدم</Label>
                <Select value={formData.userId.toString()} onValueChange={(v) => setFormData({...formData, userId: parseInt(v)})}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مستخدمًا" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.userId} value={user.userId.toString()}>
                        {user.fullName} ({user.userType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">الدور</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر دورًا" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Translator">مترجم</SelectItem>
                    <SelectItem value="Reviewer">مراجع</SelectItem>
                    <SelectItem value="Supervisor">مشرف</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetLanguageId">اللغة المستهدفة</Label>
                <Select value={formData.targetLanguageId.toString()} onValueChange={(v) => setFormData({...formData, targetLanguageId: parseInt(v)})}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر لغة" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang.languageId} value={lang.languageId.toString()}>
                        {lang.languageName} ({lang.languageCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">الموعد النهائي</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                />
              </div>

              <Button type="submit" className="w-full">تعيين المهمة</Button>
            </form>
          </CardContent>
        </Card>

        {/* قائمة المهام */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة المهام</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>جاري التحميل...</p>
            ) : assignments.length === 0 ? (
              <p className="text-muted-foreground">لا توجد مهام</p>
            ) : (
              <div className="space-y-4">
                {assignments.map(assignment => (
                  <div key={assignment.assignmentId} className="border-b pb-3 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 
                          className="font-medium cursor-pointer hover:underline text-primary"
                          onClick={() => router.push(`/data-entry/projects/${assignment.projectId}`)}
                        >
                          {assignment.projectName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {assignment.userName} - {assignment.role} ({assignment.targetLanguageName})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          تم التعيين: {new Date(assignment.assignedAt).toLocaleString('ar-EG')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          الموعد النهائي: {new Date(assignment.deadline).toLocaleString('ar-EG')}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(assignment.status, assignment.isOverdue)}
                        <div className="mt-2">
                          <Button variant="outline" size="sm" onClick={() => handleDelete(assignment.assignmentId)}>
                            حذف
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}