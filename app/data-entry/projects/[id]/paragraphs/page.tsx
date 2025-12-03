// src/app/data-entry/projects/[id]/paragraphs/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Download, 
  FileText, 
  ArrowUp, 
  ArrowDown, 
  AlignLeft,
  MoreHorizontal
} from "lucide-react";

// تعريف الأنواع بناءً على API
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

interface CreateParagraphDto {
  projectId: number;
  originalText: string;
  paragraphType?: string;
  position: number;
  wordCount: number;
}

interface UpdateParagraphDto {
  originalText?: string;
  paragraphType?: string;
  position?: number;
  wordCount?: number;
}

interface Project {
  projectId: number;
  projectName: string;
  description?: string;
  sourceLanguageId: number;
  sourceLanguageName: string;
  sourceLanguageCode: string;
  targetLanguages?: any[]; // يمكن تعريف نوع اللغة لاحقًا
  createdBy: number;
  creatorName: string;
  status: string; // 'Draft' | 'Active' | 'InProgress' | 'Completed' | 'Cancelled'
  createdAt: string;
  updatedAt?: string;
  totalParagraphs: number;
  wordCount: number;
  assignmentsCount?: number;
}

export default function ProjectParagraphsPage() {
  const params = useParams();
  const projectId = parseInt(params.id as string);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredParagraphs, setFilteredParagraphs] = useState<Paragraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingParagraph, setEditingParagraph] = useState<Paragraph | null>(null);
  const [autoSplitText, setAutoSplitText] = useState("");
  const [autoSplitLoading, setAutoSplitLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
    fetchParagraphs(projectId);
  }, [projectId]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredParagraphs(paragraphs);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredParagraphs(
        paragraphs.filter(paragraph => 
          paragraph.originalText.toLowerCase().includes(term) ||
          (paragraph.translations && paragraph.translations.some(t => t.translatedText.toLowerCase().includes(term)))
        )
      );
    }
  }, [searchTerm, paragraphs]);

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

  const fetchParagraphs = async (projectId: number) => {
    try {
      setLoading(true);
      const data = await apiClient.get(`Paragraphs/project/${projectId}`);
      setParagraphs(data || []);
      setFilteredParagraphs(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في جلب الفقرات",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParagraph) return;

    const createData: CreateParagraphDto = {
      projectId: projectId,
      originalText: editingParagraph.originalText,
      paragraphType: editingParagraph.paragraphType || "Normal",
      position: editingParagraph.position,
      wordCount: editingParagraph.wordCount,
    };

    try {
      await apiClient.post("Paragraphs", createData);
      toast({
        title: "نجاح",
        description: "تم إنشاء الفقرة بنجاح",
      });
      resetForm();
      fetchParagraphs(projectId);
    } catch (error) {
      // تم التعامل مع الخطأ داخل apiClient
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editingParagraph) return;

    const updateData: UpdateParagraphDto = {
      originalText: editingParagraph.originalText,
      paragraphType: editingParagraph.paragraphType,
      position: editingParagraph.position,
      wordCount: editingParagraph.wordCount,
    };

    try {
      await apiClient.put(`Paragraphs/${editingId}`, updateData);
      toast({
        title: "نجاح",
        description: "تم تحديث الفقرة بنجاح",
      });
      resetForm();
      fetchParagraphs(projectId);
    } catch (error) {
      // تم التعامل مع الخطأ داخل apiClient
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفقرة؟")) return;
    try {
      await apiClient.delete(`Paragraphs/${id}`);
      toast({
        title: "نجاح",
        description: "تم حذف الفقرة بنجاح",
      });
      fetchParagraphs(projectId);
    } catch (error) {
      // تم التعامل مع الخطأ داخل apiClient
    }
  };

  const handleEditClick = (paragraph: Paragraph) => {
    setEditingParagraph(paragraph);
    setEditingId(paragraph.paragraphId);
    setShowAddForm(true);
  };

  const handleAddNewClick = () => {
    setEditingParagraph({
      paragraphId: 0,
      projectId: projectId,
      projectName: projects.find(p => p.projectId === projectId)?.projectName || "",
      originalText: "",
      paragraphType: "Normal",
      position: paragraphs.length > 0 ? Math.max(...paragraphs.map(p => p.position)) + 1 : 1,
      wordCount: 0,
      createdAt: new Date().toISOString(),
      translations: []
    });
    setEditingId(null);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setEditingParagraph(null);
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setUploadProgress(0);

      // محاكاة تقدم الرفع
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);

      // نستخدم fetch مباشرة لرفع الملفات
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5296/api/Paragraphs/upload/${projectId}`, {
        method: 'POST',
        headers: {
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: formData
      });

      clearInterval(interval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل في رفع الملف");
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: "نجاح",
          description: "تم رفع الفقرات من الملف بنجاح",
        });
        fetchParagraphs(projectId);
      } else {
        throw new Error(data.message || "فشل في رفع الملف");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "فشل في رفع الملف",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'text/plain' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/pdf')) {
      handleFileUpload(file);
    } else {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى رفع ملف نصي (.txt) أو Word (.docx) أو PDF (.pdf)",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleAutoSplit = async () => {
    if (!autoSplitText.trim()) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى إدخال نص للتقسيم",
      });
      return;
    }

    try {
      setAutoSplitLoading(true);
      // نستخدم fetch مباشرة لأن apiClient لا يدعم FormData
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('text', autoSplitText);

      const response = await fetch(`http://localhost:5296/api/Paragraphs/auto-split/${projectId}`, {
        method: 'POST',
        headers: {
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل في التقسيم التلقائي");
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: "نجاح",
          description: "تم تقسيم النص لفقرات بنجاح",
        });
        setAutoSplitText("");
        fetchParagraphs(projectId);
      } else {
        throw new Error(data.message || "فشل في التقسيم التلقائي");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "فشل في التقسيم التلقائي",
      });
    } finally {
      setAutoSplitLoading(false);
    }
  };

  const moveParagraph = async (id: number, direction: 'up' | 'down') => {
    const paragraph = paragraphs.find(p => p.paragraphId === id);
    if (!paragraph) return;

    const currentIndex = paragraphs.findIndex(p => p.paragraphId === id);
    let newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // التأكد من أن newIndex داخل الحدود
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= paragraphs.length) newIndex = paragraphs.length - 1;

    const newParagraphs = [...paragraphs];
    // تبديل المواقع في القائمة المحلية
    [newParagraphs[currentIndex], newParagraphs[newIndex]] = [newParagraphs[newIndex], newParagraphs[currentIndex]];

    // تحديث المواقع في القائمة
    newParagraphs.forEach((p, i) => {
      p.position = i + 1;
    });

    setParagraphs(newParagraphs);
    setFilteredParagraphs(newParagraphs);

    // محاولة تحديث المواقع في الخادم
    try {
      // نحتاج إلى تحديث موقع الفقرة الحالية والمتأثرة
      await Promise.all([
        apiClient.patch(`Paragraphs/${paragraph.paragraphId}/position/${newParagraphs[newIndex].position}`, null), // تمرير null كـ data
        apiClient.patch(`Paragraphs/${newParagraphs[currentIndex].paragraphId}/position/${newParagraphs[currentIndex].position}`, null) // تمرير null كـ data
      ]);
      toast({
        title: "نجاح",
        description: "تم تحديث ترتيب الفقرة",
      });
    } catch (error) {
      // إذا فشل التحديث في الخادم، نعيد الترتيب الأصلي
      toast({
        variant: "destructive",
        title: "تحذير",
        description: "فشل في تحديث ترتيب الفقرة في الخادم، يرجى التحديث لاحقًا",
      });
      fetchParagraphs(projectId);
    }
  };

  const getStatusBadge = (translations: Paragraph['translations']) => {
    if (!translations || translations.length === 0) {
      return <Badge variant="outline">غير مترجمة</Badge>;
    }
    // افترض أن الحالة هي حالة الترجمة الأخيرة
    const lastTranslation = translations[translations.length - 1];
    switch (lastTranslation.status) {
      case "Draft":
        return <Badge variant="outline">مسودة</Badge>;
      case "Completed":
        return <Badge variant="secondary">مكتملة</Badge>; // تم تغيير "success" إلى "secondary"
      case "In Review":
        return <Badge variant="outline">قيد المراجعة</Badge>; // تم تغيير "warning" إلى "outline" أو "secondary"
      default:
        return <Badge>{lastTranslation.status}</Badge>;
    }
  };

  const getParagraphTypeLabel = (type: string | undefined) => {
    switch (type) {
      case "Normal": return "نص عادي";
      case "Header": return "عنوان";
      case "Subheader": return "عنوان فرعي";
      case "Quote": return "اقتباس";
      case "List": return "قائمة";
      case "Code": return "كود";
      default: return type || "غير محدد";
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">فقرات المشروع</h1>
          <p className="text-muted-foreground mt-2">
            عرض وتحرير وتحميل الفقرات لمشروع "{projects.find(p => p.projectId === projectId)?.projectName}"
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن فقرة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleAddNewClick}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة فقرة
          </Button>
        </div>
      </div>

      {/* محرر الفقرات */}
      {showAddForm && editingParagraph && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? "تعديل الفقرة" : "إضافة فقرة جديدة"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="originalText">النص الأصلي</Label>
                <Textarea
                  id="originalText"
                  value={editingParagraph.originalText}
                  onChange={(e) => setEditingParagraph({...editingParagraph, originalText: e.target.value, wordCount: e.target.value.split(/\s+/).filter(Boolean).length})}
                  placeholder="أدخل النص الأصلي للفقرة"
                  rows={6}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paragraphType">نوع الفقرة</Label>
                  <Select 
                    value={editingParagraph.paragraphType || "Normal"} 
                    onValueChange={(v) => setEditingParagraph({...editingParagraph, paragraphType: v})}
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
                    value={editingParagraph.position}
                    onChange={(e) => setEditingParagraph({...editingParagraph, position: parseInt(e.target.value)})}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wordCount">عدد الكلمات</Label>
                  <Input
                    id="wordCount"
                    type="number"
                    value={editingParagraph.wordCount}
                    onChange={(e) => setEditingParagraph({...editingParagraph, wordCount: parseInt(e.target.value)})}
                    min="0"
                    readOnly
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={resetForm}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={!editingParagraph.originalText.trim()}>
                  {editingId ? "تحديث الفقرة" : "إضافة الفقرة"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* التقسيم التلقائي */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlignLeft className="h-5 w-5" />
            التقسيم التلقائي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              value={autoSplitText}
              onChange={(e) => setAutoSplitText(e.target.value)}
              placeholder="الصق النص هنا لتقسيمه تلقائيًا..."
              rows={6}
            />
            <Button onClick={handleAutoSplit} disabled={!autoSplitText.trim() || autoSplitLoading} className="w-full md:w-auto">
              {autoSplitLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  جاري التقسيم...
                </>
              ) : (
                <>
                  <AlignLeft className="h-4 w-4 mr-2" />
                  تقسيم النص تلقائيًا
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* رفع الملفات */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            رفع ملف
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-1">اسحب وأفلت الملف هنا</h3>
            <p className="text-muted-foreground mb-4">أو انقر للاختيار</p>
            <p className="text-sm text-muted-foreground">يدعم: TXT, DOCX, PDF</p>
          </div>
          <input
            id="file-upload"
            type="file"
            accept=".txt,.docx,.pdf"
            onChange={handleFileInput}
            ref={fileInputRef}
            className="hidden"
          />
          {uploading && (
            <div className="mt-4">
              <div className="w-full bg-muted rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center">{uploadProgress}%</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* قائمة الفقرات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            قائمة الفقرات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>جاري التحميل...</p>
          ) : filteredParagraphs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">لا توجد فقرات</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "لم يتم العثور على فقرات مطابقة للبحث" : "ابدأ بإضافة فقرة جديدة أو رفع ملف"}
              </p>
              <Button onClick={handleAddNewClick}>
                <Plus className="h-4 w-4 mr-2" />
                إضافة فقرة جديدة
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-4 font-medium w-12">#</th>
                    <th className="text-right py-2 px-4 font-medium">النص الأصلي</th>
                    <th className="text-right py-2 px-4 font-medium">النوع</th>
                    <th className="text-right py-2 px-4 font-medium">الكلمات</th>
                    <th className="text-right py-2 px-4 font-medium">الحالة</th>
                    <th className="text-right py-2 px-4 font-medium w-24">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParagraphs.map(paragraph => (
                    <tr key={paragraph.paragraphId} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-4">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">{paragraph.position}</span>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0"
                              onClick={() => moveParagraph(paragraph.paragraphId, 'up')}
                              title="تحريك للأعلى"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0"
                              onClick={() => moveParagraph(paragraph.paragraphId, 'down')}
                              title="تحريك للأسفل"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4 max-w-xs truncate" title={paragraph.originalText}>
                        {paragraph.originalText || "N/A"}
                      </td>
                      <td className="py-2 px-4">
                        <Badge variant="outline">{getParagraphTypeLabel(paragraph.paragraphType)}</Badge>
                      </td>
                      <td className="py-2 px-4">{paragraph.wordCount}</td>
                      <td className="py-2 px-4">{getStatusBadge(paragraph.translations)}</td>
                      <td className="py-2 px-4 text-right">
                        <div className="flex justify-end space-x-1 space-x-reverse">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(paragraph)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(paragraph.paragraphId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}