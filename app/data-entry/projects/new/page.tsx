// src/app/data-entry/projects/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// تعريف الأنواع بناءً على OpenAPI
interface Language {
  languageId: number;
  languageName: string;
  languageCode: string;
  textDirection: string;
  isActive: boolean;
  projectCount: number;
}

interface CreateProjectDto {
  projectName: string;
  description?: string;
  sourceLanguageId: number;
  createdBy: number;
  targetLanguageIds: number[];
}

export default function NewProjectPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<CreateProjectDto, 'createdBy'>>({
    projectName: "",
    description: "",
    sourceLanguageId: 0,
    targetLanguageIds: [],
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [autoSplitText, setAutoSplitText] = useState("");
  const [status, setStatus] = useState<'Draft' | 'Active'>('Draft');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      const data = await apiClient.get("Languages/active"); // نستخدم اللغات النشطة فقط
      setLanguages(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في جلب اللغات",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageToggle = (languageId: number) => {
    setFormData(prev => {
      if (prev.targetLanguageIds.includes(languageId)) {
        return {
          ...prev,
          targetLanguageIds: prev.targetLanguageIds.filter(id => id !== languageId)
        };
      } else {
        return {
          ...prev,
          targetLanguageIds: [...prev.targetLanguageIds, languageId]
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.projectName.trim()) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى إدخال اسم المشروع",
      });
      return;
    }

    if (formData.sourceLanguageId === 0) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى اختيار لغة المصدر",
      });
      return;
    }

    if (formData.targetLanguageIds.length === 0) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى اختيار لغة مستهدفة واحدة على الأقل",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const createData: CreateProjectDto = {
        ...formData,
        createdBy: user.userId, // تعيين المستخدم الحالي
      };

      const response = await apiClient.post("Projects", createData);
      const newProjectId = response.projectId;

      toast({
        title: "نجاح",
        description: "تم إنشاء المشروع بنجاح",
      });

      // إذا تم اختيار رفع ملف
      if (uploadFile) {
        const fileFormData = new FormData();
        fileFormData.append('file', uploadFile);
        try {
          const token = localStorage.getItem("token");
          await fetch(`http://samali1-001-site1.stempurl.com/api/Paragraphs/upload/${newProjectId}`, {
            method: 'POST',
            headers: {
              ...(token && { "Authorization": `Bearer ${token}` })
            },
            body: fileFormData
          });
          toast({
            title: "نجاح",
            description: "تم رفع الملف إلى المشروع بنجاح",
          });
        } catch (error) {
          toast({
            variant: "destructive",
            title: "خطأ",
            description: "فشل في رفع الملف",
          });
        }
      }

      // إذا تم إدخال نص للتقسيم التلقائي
      if (autoSplitText.trim()) {
        try {
          const token = localStorage.getItem("token");
          const splitFormData = new FormData();
          splitFormData.append('text', autoSplitText);
          await fetch(`http://samali1-001-site1.stempurl.com/api/Paragraphs/auto-split/${newProjectId}`, {
            method: 'POST',
            headers: {
              ...(token && { "Authorization": `Bearer ${token}` })
            },
            body: splitFormData
          });
          toast({
            title: "نجاح",
            description: "تم تقسيم النص إلى فقرات بنجاح",
          });
        } catch (error) {
          toast({
            variant: "destructive",
            title: "خطأ",
            description: "فشل في التقسيم التلقائي للنص",
          });
        }
      }

      // تغيير الحالة إذا كانت Active
      if (status === 'Active') {
        try {
          await apiClient.patch(`Projects/${newProjectId}/status`, "Active");
          toast({
            title: "نجاح",
            description: "تم تفعيل المشروع",
          });
        } catch (error) {
          toast({
            variant: "destructive",
            title: "تحذير",
            description: "فشل في تفعيل المشروع، يرجى التحديث يدويًا",
          });
        }
      }

      router.push(`/data-entry/projects/${newProjectId}`);
    } catch (error) {
      // تم التعامل مع الخطأ داخل apiClient
    } finally {
      setSubmitting(false);
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
    <div className="container mx-auto py-10 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>إنشاء مشروع جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="projectName">اسم المشروع *</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                placeholder="أدخل اسم المشروع"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="أدخل وصف المشروع (اختياري)"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="sourceLanguageId">لغة المصدر *</Label>
                <Select 
                  value={formData.sourceLanguageId.toString()} 
                  onValueChange={(v) => setFormData({...formData, sourceLanguageId: parseInt(v)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر لغة المصدر" />
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
                <Label htmlFor="status">الحالة</Label>
                <Select 
                  value={status} 
                  onValueChange={(v: 'Draft' | 'Active') => setStatus(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">مسودة</SelectItem>
                    <SelectItem value="Active">نشط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>اللغات المستهدفة *</Label>
              <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                {languages.filter(l => l.languageId !== formData.sourceLanguageId).map(lang => (
                  <div 
                    key={lang.languageId}
                    className={`flex items-center p-2 rounded cursor-pointer ${
                      formData.targetLanguageIds.includes(lang.languageId) 
                        ? "bg-primary/10 border border-primary" 
                        : "hover:bg-muted"
                    }`}
                    onClick={() => handleLanguageToggle(lang.languageId)}
                  >
                    <div className={`w-4 h-4 rounded border mr-2 ${
                      formData.targetLanguageIds.includes(lang.languageId) 
                        ? "bg-primary border-primary" 
                        : "border-muted-foreground"
                    }`}>
                      {formData.targetLanguageIds.includes(lang.languageId) && (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-primary">✓</span>
                        </div>
                      )}
                    </div>
                    <span>{lang.languageName} ({lang.languageCode})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uploadFile">رفع ملف (اختياري)</Label>
              <Input
                id="uploadFile"
                type="file"
                accept=".txt,.docx,.pdf"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">سيتم تقسيم الملف تلقائيًا إلى فقرات.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="autoSplitText">أو إدخال نص للتقسيم (اختياري)</Label>
              <Textarea
                id="autoSplitText"
                value={autoSplitText}
                onChange={(e) => setAutoSplitText(e.target.value)}
                placeholder="أو الصق النص هنا لتقسيمه تلقائيًا..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">سيتم تقسيم النص المدخل إلى فقرات.</p>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.back()}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    جاري الإنشاء...
                  </>
                ) : (
                  "إنشاء المشروع"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {/* Toast Notifications Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {/* Success Message */}
        {submitting && (
          <div className="bg-green-500 text-white px-4 py-3 rounded shadow-lg flex items-center gap-2 hover:bg-green-600 transition-colors">
            <span className="text-sm">✓</span>
            <span className="text-sm">تم إنشاء المشروع بنجاح</span>
          </div>
        )}
        {/* Error Message */}
        {submitting === false && (
          <div className="bg-red-500 text-white px-4 py-3 rounded shadow-lg flex items-center gap-2 hover:bg-red-600 transition-colors">
            <span className="text-sm">✗</span>
            <span className="text-sm">فشل في إنشاء المشروع</span>
          </div>
        )}
      </div>

      {/* Hover Effects for Interactive Elements */}
      <style jsx>{`
        .hover-glow:hover {
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
          transform: translateY(-1px);
          transition: all 0.2s ease-in-out;
        }
        .hover-scale:hover {
          transform: scale(1.02);
          transition: transform 0.2s ease-in-out;
        }
      `}</style>
    </div>
  );
}