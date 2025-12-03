// app/data-entry/paragraphs/[id]/page.tsx
"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
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
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  MoreHorizontal,
  Save,
  X,
  RefreshCw
} from "lucide-react";
import { useRouter } from "next/navigation";

// --- تعريف الأنواع بناءً على OpenAPI ---
// من /api/Paragraphs/project/{projectId} (GET) -> ParagraphResponseDto[]
interface ParagraphResponseDto {
  paragraphId: number;
  projectId: number;
  projectName: string;
  originalText: string;
  paragraphType?: string;
  position: number;
  wordCount: number;
  createdAt: string; // ISO date string
  translations?: TranslationInfoDto[]; // من ParagraphResponseDto
}

// من /api/Translations (POST/GET) -> TranslationResponseDto
interface TranslationResponseDto {
  translationId: number;
  paragraphId: number;
  originalText?: string;
  assignmentId: number;
  translatorName?: string;
  targetLanguageName?: string;
  translatedText: string;
  status: string; // Draft, InProgress, Submitted, Completed, Approved, Rejected
  createdAt: string;
  updatedAt?: string;
  draftCount: number;
  finalWordCount: number;
  reviews?: ReviewInfoDto[]; // من TranslationResponseDto
}

// من ParagraphResponseDto
interface TranslationInfoDto {
  translationId: number;
  translatedText: string;
  status: string;
  translatorName?: string;
  createdAt: string;
  targetLanguageName?: string;
}

// من TranslationResponseDto
interface ReviewInfoDto {
  reviewId: number;
  reviewedText: string;
  qualityScore?: number;
  status: string;
  reviewerName?: string;
  createdAt: string;
  approvals?: ApprovalInfoDto[]; // من ReviewResponseDto
}

// من ReviewResponseDto
interface ApprovalInfoDto {
  approvalId: number;
  finalText: string;
  decision: string; // Accepted, Rejected
  supervisorName?: string;
  approvedAt: string;
  comments?: string;
}

// من /api/Projects/{id} (GET) -> ProjectResponseDto
interface ProjectResponseDto {
  projectId: number;
  projectName: string;
  description?: string;
  sourceLanguageId: number;
  sourceLanguageName: string;
  sourceLanguageCode: string;
  createdBy: number;
  creatorName: string;
  status: string; // Draft, Active, InProgress, Completed, Cancelled
  createdAt: string;
  updatedAt?: string;
  totalParagraphs: number;
  wordCount: number;
  targetLanguages?: LanguageInfoDto[]; // من ProjectResponseDto
  assignmentsCount?: number;
}

// من ProjectResponseDto
interface LanguageInfoDto {
  languageId: number;
  languageName: string;
  languageCode: string;
  textDirection: string;
}

// من /api/Paragraphs (POST) -> CreateParagraphDto
interface CreateParagraphDto {
  projectId: number;
  originalText: string;
  paragraphType?: string;
  position?: number; // اختياري، الخادم يعيّنه غالبًا
  wordCount?: number; // اختياري، الخادم يحسبه غالبًا
}

// من /api/Paragraphs/{id} (PUT) -> UpdateParagraphDto
interface UpdateParagraphDto {
  originalText?: string;
  paragraphType?: string;
  position?: number;
  wordCount?: number;
}

export default function ProjectParagraphsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const projectId = parseInt(id, 10);
  const [paragraphs, setParagraphs] = useState<ParagraphResponseDto[]>([]);
  const [project, setProject] = useState<ProjectResponseDto | null>(null);
  const [filteredParagraphs, setFilteredParagraphs] = useState<ParagraphResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingParagraph, setEditingParagraph] = useState<CreateParagraphDto | UpdateParagraphDto | null>(null);
  const [autoSplitText, setAutoSplitText] = useState("");
  const [autoSplitLoading, setAutoSplitLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showAutoSplitModal, setShowAutoSplitModal] = useState(false);
  const [selectedParagraphs, setSelectedParagraphs] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isNaN(projectId)) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "معرف المشروع غير صحيح",
      });
      return;
    }
    fetchProjectDetails(); // جلب معلومات المشروع
    fetchParagraphs(projectId); // جلب الفقرات
  }, [projectId]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredParagraphs(paragraphs);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredParagraphs(
        paragraphs.filter(paragraph => 
          paragraph.originalText.toLowerCase().includes(term) ||
          (paragraph.translations && paragraph.translations.some(t => t.translatedText?.toLowerCase().includes(term)))
        )
      );
    }
  }, [searchTerm, paragraphs]);

  const fetchProjectDetails = async () => {
    try {
      const data: ProjectResponseDto = await apiClient.get(`Projects/${projectId}`);
      setProject(data);
    } catch (error) {
      console.error("Error fetching project details:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في جلب تفاصيل المشروع",
      });
    }
  };

  const fetchParagraphs = async (projId: number) => {
    try {
      setLoading(true);
      const data: ParagraphResponseDto[] = await apiClient.get(`Paragraphs/project/${projId}`);
      setParagraphs(data || []);
      setFilteredParagraphs(data || []);
      setSelectedParagraphs([]);
    } catch (error) {
      console.error("Error fetching paragraphs:", error);
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
      projectId: projectId, // استخدام projectId من المسار
      originalText: editingParagraph.originalText || "",
      paragraphType: editingParagraph.paragraphType,
      position: editingParagraph.position,
      wordCount: editingParagraph.wordCount,
    };

    try {
      const createdParagraph: ParagraphResponseDto = await apiClient.post("Paragraphs", createData);
      toast({
        title: "نجاح",
        description: "تم إنشاء الفقرة بنجاح",
      });
      resetForm();
      // تحديث القائمة محليًا لتجنب جلبها من الخادم مرة أخرى
      setParagraphs(prev => [...prev, createdParagraph]);
      setFilteredParagraphs(prev => [...prev, createdParagraph]);
      fetchProjectDetails(); // تحديث معلومات المشروع (مثل totalParagraphs)
    } catch (error) {
      console.error("Error creating paragraph:", error);
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
      const updatedParagraph: ParagraphResponseDto = await apiClient.put(`Paragraphs/${editingId}`, updateData);
      toast({
        title: "نجاح",
        description: "تم تحديث الفقرة بنجاح",
      });
      resetForm();
      // تحديث القائمة محليًا
      setParagraphs(prev => prev.map(p => p.paragraphId === editingId ? updatedParagraph : p));
      setFilteredParagraphs(prev => prev.map(p => p.paragraphId === editingId ? updatedParagraph : p));
    } catch (error) {
      console.error("Error updating paragraph:", error);
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
      // تحديث القائمة محليًا
      setParagraphs(prev => prev.filter(p => p.paragraphId !== id));
      setFilteredParagraphs(prev => prev.filter(p => p.paragraphId !== id));
      fetchProjectDetails(); // تحديث معلومات المشروع
    } catch (error) {
      console.error("Error deleting paragraph:", error);
      // تم التعامل مع الخطأ داخل apiClient
    }
  };

  const handleEditClick = (paragraph: ParagraphResponseDto) => {
    setEditingParagraph({
      originalText: paragraph.originalText,
      paragraphType: paragraph.paragraphType,
      position: paragraph.position,
      wordCount: paragraph.wordCount,
    });
    setEditingId(paragraph.paragraphId);
    setShowAddForm(true);
  };

  const handleAddNewClick = () => {
    setEditingParagraph({
      originalText: "",
      paragraphType: "Normal",
      position: paragraphs.length > 0 ? Math.max(...paragraphs.map(p => p.position)) + 1 : 1,
      wordCount: 0,
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

      // نستخدم fetch مباشرة لرفع الملفات إلى المشروع الحالي
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
        fetchParagraphs(projectId); // تحديث الفقرات
        fetchProjectDetails(); // تحديث معلومات المشروع
      } else {
        throw new Error(data.message || "فشل في رفع الملف");
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
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
        setShowAutoSplitModal(false);
        fetchParagraphs(projectId); // تحديث الفقرات
        fetchProjectDetails(); // تحديث معلومات المشروع
      } else {
        throw new Error(data.message || "فشل في التقسيم التلقائي");
      }
    } catch (error: any) {
      console.error("Error auto-splitting text:", error);
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
        apiClient.patch(`Paragraphs/${paragraph.paragraphId}/position/${newParagraphs[newIndex].position}`, null),
        apiClient.patch(`Paragraphs/${newParagraphs[currentIndex].paragraphId}/position/${newParagraphs[currentIndex].position}`, null)
      ]);
      toast({
        title: "نجاح",
        description: "تم تحديث ترتيب الفقرة",
      });
    } catch (error) {
      console.error("Error updating paragraph position:", error);
      // إذا فشل التحديث في الخادم، نعيد الترتيب الأصلي
      toast({
        variant: "destructive",
        title: "تحذير",
        description: "فشل في تحديث ترتيب الفقرة في الخادم، يرجى التحديث لاحقًا",
      });
      fetchParagraphs(projectId);
    }
  };

  const toggleBulkAction = (paragraphId: number) => {
    setSelectedParagraphs(prev => 
      prev.includes(paragraphId) 
        ? prev.filter(id => id !== paragraphId) 
        : [...prev, paragraphId]
    );
  };

  const selectAll = () => {
    if (selectedParagraphs.length === filteredParagraphs.length) {
      setSelectedParagraphs([]);
    } else {
      setSelectedParagraphs(filteredParagraphs.map(p => p.paragraphId));
    }
  };

  const getStatusBadge = (translations: TranslationInfoDto[] | undefined) => {
    if (!translations || translations.length === 0) {
      return <Badge variant="outline">غير مترجمة</Badge>;
    }
    // افترض أن الحالة هي حالة الترجمة الأخيرة
    const lastTranslation = translations[translations.length - 1];
    switch (lastTranslation.status) {
      case "Draft":
        return <Badge variant="outline">مسودة</Badge>;
      case "Completed":
      case "Approved":
        return <Badge variant="success">مكتملة</Badge>;
      case "In Review":
      case "Submitted":
        return <Badge variant="default">قيد المراجعة</Badge>;
      case "Rejected":
        return <Badge variant="destructive">مرفوضة</Badge>;
      default:
        return <Badge>{lastTranslation.status}</Badge>;
    }
  };

  const getTranslatorInfo = (translations: TranslationInfoDto[] | undefined) => {
    if (!translations || translations.length === 0) {
      return "لا يوجد";
    }
    return translations[translations.length - 1].translatorName || "غير محدد";
  };

  const handleBulkDelete = () => {
    if (selectedParagraphs.length === 0) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى تحديد الفقرات للحذف",
      });
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف ${selectedParagraphs.length} فقرة؟`)) return;
    
    const deletePromises = selectedParagraphs.map(id => apiClient.delete(`Paragraphs/${id}`));
    
    Promise.all(deletePromises)
      .then(() => {
        toast({
          title: "نجاح",
          description: "تم حذف الفقرات المحددة بنجاح",
        });
        setSelectedParagraphs([]);
        fetchParagraphs(projectId); // تحديث الفقرات
        fetchProjectDetails(); // تحديث معلومات المشروع
      })
      .catch(error => {
        console.error("Error bulk deleting paragraphs:", error);
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "فشل في حذف بعض الفقرات",
        });
      });
  };

  if (isNaN(projectId)) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-3xl font-bold mb-4">خطأ</h1>
        <p className="text-muted-foreground">معرف المشروع غير صحيح.</p>
      </div>
    );
  }

  if (loading && !project) {
     // عرض تحميل عند بدء التحميل فقط
     return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">فقرات المشروع: {project?.projectName || `Project ${projectId}`}</h1>
          <p className="text-muted-foreground mt-2">
            عرض وتحرير وتحميل الفقرات لمشروع "{project?.projectName || `Project ${projectId}`}"
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              رفع ملف
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".txt,.docx,.pdf"
              onChange={handleFileInput}
              ref={fileInputRef}
              className="hidden"
            />
            <Button onClick={handleAddNewClick}>
              <Plus className="h-4 w-4 mr-2" />
              إضافة فقرة
            </Button>
          </div>
        </div>
      </div>

      {/* محرر الفقرات وتقسيم النص */}
      {showAddForm && editingParagraph && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{editingId ? "تعديل الفقرة" : "إضافة فقرة جديدة"}</span>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="originalText">النص الأصلي</Label>
                <Textarea
                  id="originalText"
                  value={editingParagraph.originalText || ''}
                  onChange={(e) => setEditingParagraph({...editingParagraph, originalText: e.target.value, wordCount: e.target.value.split(/\s+/).filter(Boolean).length})}
                  placeholder="أدخل النص الأصلي للفقرة"
                  rows={6}
                  required
                />
                <div className="text-sm text-muted-foreground">
                  عدد الكلمات: {editingParagraph.wordCount || 0}
                </div>
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
                    value={editingParagraph.position || 1}
                    onChange={(e) => setEditingParagraph({...editingParagraph, position: parseInt(e.target.value)})}
                    min="1"
                    required
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
                <Button type="submit" disabled={!editingParagraph.originalText?.trim()}>
                  {editingId ? "تحديث الفقرة" : "إضافة الفقرة"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* تقسيم النص التلقائي */}
      {showAutoSplitModal && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>تقسيم النص تلقائيًا</span>
              <Button variant="ghost" size="sm" onClick={() => setShowAutoSplitModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={autoSplitText}
                onChange={(e) => setAutoSplitText(e.target.value)}
                placeholder="الصق النص هنا لتقسيمه تلقائيًا..."
                rows={8}
              />
              <div className="flex justify-end gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAutoSplitModal(false)}
                >
                  إلغاء
                </Button>
                <Button 
                  onClick={handleAutoSplit} 
                  disabled={!autoSplitText.trim() || autoSplitLoading}
                >
                  {autoSplitLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      جاري التقسيم...
                    </>
                  ) : (
                    <>
                      <AlignLeft className="h-4 w-4 mr-2" />
                      تقسيم النص
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* أدوات الإجراءات الجماعية */}
      {selectedParagraphs.length > 0 && (
        <div className="flex items-center justify-between p-4 mb-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedParagraphs.length} فقرة محددة
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={selectAll}
              className="text-xs"
            >
              {selectedParagraphs.length === filteredParagraphs.length ? "إلغاء التحديد" : "تحديد الكل"}
            </Button>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleBulkDelete}
            className="text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            حذف المحدد
          </Button>
        </div>
      )}

      {/* قائمة الفقرات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            قائمة الفقرات
            <Badge variant="secondary" className="ml-2">
              {filteredParagraphs.length} فقرة
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
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
                    <th className="text-right py-2 px-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedParagraphs.length === filteredParagraphs.length && filteredParagraphs.length > 0}
                        onChange={selectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="text-right py-2 px-4 font-medium w-12">#</th>
                    <th className="text-right py-2 px-4 font-medium">النص الأصلي</th>
                    <th className="text-right py-2 px-4 font-medium">النوع</th>
                    <th className="text-right py-2 px-4 font-medium">الكلمات</th>
                    <th className="text-right py-2 px-4 font-medium">الحالة</th>
                    <th className="text-right py-2 px-4 font-medium">المترجم</th>
                    <th className="text-right py-2 px-4 font-medium w-24">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParagraphs.map(paragraph => (
                    <tr 
                      key={paragraph.paragraphId} 
                      className={`border-b hover:bg-muted/50 ${selectedParagraphs.includes(paragraph.paragraphId) ? 'bg-primary/10' : ''}`}
                    >
                      <td className="py-2 px-4">
                        <input
                          type="checkbox"
                          checked={selectedParagraphs.includes(paragraph.paragraphId)}
                          onChange={() => toggleBulkAction(paragraph.paragraphId)}
                          className="rounded"
                        />
                      </td>
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
                        <Badge variant="outline">{paragraph.paragraphType || "Normal"}</Badge>
                      </td>
                      <td className="py-2 px-4">{paragraph.wordCount}</td>
                      <td className="py-2 px-4">{getStatusBadge(paragraph.translations)}</td>
                      <td className="py-2 px-4">{getTranslatorInfo(paragraph.translations)}</td>
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

      {/* أدوات إضافية */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlignLeft className="h-5 w-5" />
              تقسيم النص التلقائي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              قم بتحويل النص إلى فقرات تلقائيًا بناءً على العلامات أو الأسطر.
            </p>
            <Button 
              onClick={() => setShowAutoSplitModal(true)} 
              className="w-full"
            >
              <AlignLeft className="h-4 w-4 mr-2" />
              تقسيم النص
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              تنزيل قالب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              قم بتنزيل قالب لملف النصوص لتسهيل إدخال البيانات.
            </p>
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              تنزيل قالب
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              حفظ المسودة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              احفظ الفقرات كمسودة للعمل عليها لاحقًا.
            </p>
            <Button variant="outline" className="w-full">
              <Save className="h-4 w-4 mr-2" />
              حفظ المسودة
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}