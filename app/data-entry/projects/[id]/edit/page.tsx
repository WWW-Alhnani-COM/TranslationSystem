// src/app/data-entry/projects/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";

export default function EditProjectPage() {
  const params = useParams();
  const projectId = parseInt(params.id as string);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [languages, setLanguages] = useState<any[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    projectName: "",
    description: "",
    status: "",
    sourceLanguageId: 0
  });

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      // جلب اللغات أولاً
      const languagesResponse = await apiClient.get("Languages");
      if (languagesResponse.success && languagesResponse.data) {
        setLanguages(languagesResponse.data);
      }

      // جلب بيانات المشروع
      const projectResponse = await apiClient.get(`Projects/${projectId}`);
      if (projectResponse.success && projectResponse.data) {
        const project = projectResponse.data;
        setFormData({
          projectName: project.projectName,
          description: project.description,
          status: project.status,
          sourceLanguageId: project.sourceLanguageId
        });
        
        // تعيين اللغات المستهدفة المختارة مسبقًا
        const targetLanguages = project.targetLanguages.map((lang: any) => lang.languageId);
        setSelectedLanguages(targetLanguages);
      } else {
        throw new Error(projectResponse.message || "فشل في جلب بيانات المشروع");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "فشل في تحميل بيانات المشروع",
      });
      router.push(`/data-entry/projects/${projectId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (selectedLanguages.length === 0) {
      setError("يرجى اختيار لغة مستهدفة واحدة على الأقل");
      setSubmitting(false);
      return;
    }

    try {
      const response = await apiClient.put(`Projects/${projectId}`, {
        projectName: formData.projectName,
        description: formData.description,
        status: formData.status
      });

      if (response.success) {
        toast({
          title: "نجاح",
          description: "تم تحديث المشروع بنجاح",
        });
        router.push(`/data-entry/projects/${projectId}`);
      } else {
        setError(response.message || "فشل في تحديث المشروع");
      }
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLanguageToggle = (languageId: number) => {
    setSelectedLanguages(prev => 
      prev.includes(languageId) 
        ? prev.filter(id => id !== languageId) 
        : [...prev, languageId]
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>تعديل المشروع</CardTitle>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/data-entry/projects/${projectId}`)}
            >
              العودة إلى التفاصيل
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="projectName">اسم المشروع</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                placeholder="أدخل اسم المشروع"
                required
                minLength={3}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="أدخل وصف المشروع"
                rows={4}
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر حالة المشروع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">نشط</SelectItem>
                  <SelectItem value="Completed">مكتمل</SelectItem>
                  <SelectItem value="Pending">قيد الانتظار</SelectItem>
                  <SelectItem value="Cancelled">ملغى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>اللغة المستهدفة</Label>
              <div className="border rounded-md p-4">
                {languages.map((language) => (
                  <div 
                    key={language.languageId}
                    className={`flex items-center p-2 rounded cursor-pointer ${
                      selectedLanguages.includes(language.languageId) 
                        ? "bg-primary/10 border border-primary" 
                        : "hover:bg-muted"
                    }`}
                    onClick={() => handleLanguageToggle(language.languageId)}
                  >
                    <div className={`w-4 h-4 rounded border mr-2 ${
                      selectedLanguages.includes(language.languageId) 
                        ? "bg-primary border-primary" 
                        : "border-muted-foreground"
                    }`}>
                      {selectedLanguages.includes(language.languageId) && (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-primary">✓</span>
                        </div>
                      )}
                    </div>
                    <span>{language.languageName} ({language.languageCode})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push(`/data-entry/projects/${projectId}`)}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    جاري الحفظ...
                  </>
                ) : "حفظ التغييرات"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}