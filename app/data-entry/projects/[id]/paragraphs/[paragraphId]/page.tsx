// src/app/data-entry/projects/[id]/paragraphs/[paragraphId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Save, Edit3, Eye, Trash2, Loader2 } from "lucide-react";

interface Paragraph {
  paragraphId: number;
  projectId: number;
  projectName: string;
  originalText: string;
  paragraphType?: string;
  position: number;
  wordCount: number;
  createdAt: string; // ISO date string
  translations: Array<{
    translationId: number;
    translatedText: string;
    status: string;
    translatorName: string;
    createdAt: string; // ISO date string
    targetLanguageName: string;
  }>;
}

interface UpdateParagraphDto {
  originalText?: string;
  paragraphType?: string;
  position?: number;
  wordCount?: number;
}

export default function ParagraphDetailPage() {
  const params = useParams();
  const projectId = parseInt(params.id as string);
  const paragraphId = parseInt(params.paragraphId as string);
  const router = useRouter();
  const [paragraph, setParagraph] = useState<Paragraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    originalText: "",
    paragraphType: "Normal",
    position: 0,
    wordCount: 0
  });
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchParagraph();
  }, [paragraphId]);

  const fetchParagraph = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`Paragraphs/${paragraphId}`);
      
      if (response.success && response.data) {
        const data = response.data;
        setParagraph(data);
        setFormData({
          originalText: data.originalText || "",
          paragraphType: data.paragraphType || "Normal",
          position: data.position || 0,
          wordCount: data.wordCount || 0
        });
      } else {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: response.message || "فشل في جلب تفاصيل الفقرة",
        });
        router.push(`/data-entry/projects/${projectId}/paragraphs`);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في الاتصال بالخادم",
      });
      router.push(`/data-entry/projects/${projectId}/paragraphs`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      const response = await apiClient.put(`Paragraphs/${paragraphId}`, {
        originalText: formData.originalText,
        paragraphType: formData.paragraphType,
        position: formData.position,
        wordCount: formData.wordCount
      });

      if (response.success) {
        toast({
          title: "نجاح",
          description: "تم تحديث الفقرة بنجاح",
        });
        setEditing(false);
        fetchParagraph();
      } else {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: response.message || "فشل في تحديث الفقرة",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في الاتصال بالخادم",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذه الفقرة؟ لن يمكن التراجع عن هذا الإجراء.")) {
      return;
    }

    try {
      setDeleting(true);
      const response = await apiClient.delete(`Paragraphs/${paragraphId}`);
      
      if (response.success) {
        toast({
          title: "نجاح",
          description: "تم حذف الفقرة بنجاح",
        });
        router.push(`/data-entry/projects/${projectId}/paragraphs`);
      } else {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: response.message || "فشل في حذف الفقرة",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في الاتصال بالخادم",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Draft":
        return <Badge variant="outline">مسودة</Badge>;
      case "Completed":
        return <Badge variant="success">مكتملة</Badge>;
      case "In Review":
        return <Badge variant="warning">قيد المراجعة</Badge>;
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

  if (!paragraph) {
    return null;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="icon" 
            className="mr-4"
            onClick={() => router.push(`/data-entry/projects/${projectId}/paragraphs`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">تفاصيل الفقرة #{paragraph.paragraphId}</h1>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          {editing ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setEditing(false)}
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleUpdate} 
                disabled={updating}
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    حفظ التغييرات
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => setEditing(true)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              تعديل الفقرة
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>النص الأصلي</CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-4">
                <Textarea
                  value={formData.originalText}
                  onChange={(e) => setFormData({...formData, originalText: e.target.value})}
                  placeholder="أدخل النص الأصلي للفقرة"
                  rows={8}
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paragraphType">نوع الفقرة</Label>
                    <Select 
                      value={formData.paragraphType} 
                      onValueChange={(v) => setFormData({...formData, paragraphType: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الفقرة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Normal">نص عادي</SelectItem>
                        <SelectItem value="Header">عنوان</SelectItem>
                        <SelectItem value="Subheader">عنوان فرعي</SelectItem>
                        <SelectItem value="Quote">اقتباس</SelectItem>
                        <SelectItem value="List">قائمة</SelectItem>
                        <SelectItem value="Code">كود</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">الترتيب</Label>
                    <Input
                      id="position"
                      type="number"
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: parseInt(e.target.value)})}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wordCount">عدد الكلمات</Label>
                  <Input
                    id="wordCount"
                    type="number"
                    value={formData.wordCount}
                    onChange={(e) => setFormData({...formData, wordCount: parseInt(e.target.value)})}
                    min="0"
                    readOnly
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted rounded-md min-h-[200px] font-sans">
                {paragraph.originalText}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>معلومات الفقرة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm text-muted-foreground">رقم المشروع</Label>
                <p className="font-medium">{paragraph.projectId}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">اسم المشروع</Label>
                <p className="font-medium">{paragraph.projectName}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">النوع</Label>
                <Badge variant="outline" className="mt-1">
                  {paragraph.paragraphType === "Normal" && "نص عادي"}
                  {paragraph.paragraphType === "Header" && "عنوان"}
                  {paragraph.paragraphType === "Subheader" && "عنوان فرعي"}
                  {paragraph.paragraphType === "Quote" && "اقتباس"}
                  {paragraph.paragraphType === "List" && "قائمة"}
                  {paragraph.paragraphType === "Code" && "كود"}
                </Badge>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">الترتيب</Label>
                <p className="font-medium">{paragraph.position}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">عدد الكلمات</Label>
                <p className="font-medium">{paragraph.wordCount}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">تاريخ الإنشاء</Label>
                <p className="font-medium">{new Date(paragraph.createdAt).toLocaleString('ar-EG')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الترجمات</CardTitle>
            </CardHeader>
            <CardContent>
              {paragraph.translations && paragraph.translations.length > 0 ? (
                <div className="space-y-4">
                  {paragraph.translations.map((translation) => (
                    <div key={translation.translationId} className="border-b pb-4 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{translation.translatorName}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {translation.targetLanguageName} | {new Date(translation.createdAt).toLocaleString('ar-EG')}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(translation.status)}
                        </div>
                      </div>
                      <div className="mt-2 p-3 bg-muted rounded-md text-sm font-sans">
                        {translation.translatedText}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">لا توجد ترجمات لهذه الفقرة</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الإجراءات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="destructive" 
                  onClick={handleDelete} 
                  disabled={deleting}
                  className="w-full"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري الحذف...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      حذف الفقرة
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}