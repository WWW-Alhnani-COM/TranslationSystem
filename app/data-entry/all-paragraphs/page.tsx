// src/app/data-entry/all-paragraphs/page.tsx
"use client";

import { useState, useEffect } from "react";
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
  FileText, 
  ArrowUp, 
  ArrowDown, 
  Filter,
  Download,
  Upload,
  RefreshCw,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";

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

export default function AllParagraphsPage() {
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredParagraphs, setFilteredParagraphs] = useState<Paragraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingParagraph, setEditingParagraph] = useState<Paragraph | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedParagraphType, setSelectedParagraphType] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
    fetchAllParagraphs();
  }, []);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [searchTerm, selectedProjectId, selectedParagraphType, selectedStatus, sortBy, sortOrder, paragraphs]);

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

  const fetchAllParagraphs = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get("Paragraphs");
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

  const applyFiltersAndSorting = () => {
    let result = [...paragraphs];
    
    // تطبيق الفلاتر
    if (selectedProjectId) {
      result = result.filter(p => p.projectId === selectedProjectId);
    }
    
    if (selectedParagraphType !== "All") {
      result = result.filter(p => p.paragraphType === selectedParagraphType);
    }
    
    if (selectedStatus !== "All") {
      // هذا يتطلب مراجعة البيانات لأن الحالة تأتي من الترجمات
      // يمكن تحسين هذا لاحقًا
    }
    
    // تطبيق البحث
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.originalText.toLowerCase().includes(term) ||
        p.projectName.toLowerCase().includes(term) ||
        (p.translations && p.translations.some(t => t.translatedText.toLowerCase().includes(term)))
      );
    }
    
    // تطبيق الترتيب
    result.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Paragraph];
      let bValue: any = b[sortBy as keyof Paragraph];
      
      if (sortBy === "projectName") {
        aValue = a.projectName;
        bValue = b.projectName;
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
    
    setFilteredParagraphs(result);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParagraph) return;

    const createData: CreateParagraphDto = {
      projectId: editingParagraph.projectId,
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
      fetchAllParagraphs();
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
      fetchAllParagraphs();
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
      fetchAllParagraphs();
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
      projectId: 0,
      projectName: "",
      originalText: "",
      paragraphType: "Normal",
      position: 1,
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

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
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
        return <Badge variant="secondary">مكتملة</Badge>;
      case "In Review":
        return <Badge variant="warning">قيد المراجعة</Badge>;
      default:
        return <Badge>{lastTranslation.status}</Badge>;
    }
  };

  const getTranslatorInfo = (translations: Paragraph['translations']) => {
    if (!translations || translations.length === 0) {
      return "لا يوجد";
    }
    return translations[translations.length - 1].translatorName;
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">إدارة فقرات جميع المشاريع</h1>
          <p className="text-muted-foreground mt-2">
            إدارة جميع الفقرات في جميع المشاريع
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button onClick={handleAddNewClick}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة فقرة
          </Button>
        </div>
      </div>

      {/* عناصر التصفية */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            تصفية وترتيب البيانات
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="projectFilter">المشروع</Label>
            <Select 
              value={selectedProjectId?.toString() || "All"} 
              onValueChange={(v) => setSelectedProjectId(v === "All" ? null : parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر مشروعًا" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">جميع المشاريع</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.projectId} value={project.projectId.toString()}>
                    {project.projectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="typeFilter">نوع الفقرة</Label>
            <Select 
              value={selectedParagraphType} 
              onValueChange={setSelectedParagraphType}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوعًا" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">جميع الأنواع</SelectItem>
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
            <Label htmlFor="sortField">ترتيب حسب</Label>
            <Select 
              value={sortBy} 
              onValueChange={setSortBy}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر حقل الترتيب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">تاريخ الإنشاء</SelectItem>
                <SelectItem value="position">الترتيب</SelectItem>
                <SelectItem value="wordCount">عدد الكلمات</SelectItem>
                <SelectItem value="projectName">المشروع</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">ترتيب</Label>
            <Select 
              value={sortOrder} 
              onValueChange={(value) => setSortOrder(value as "asc" | "desc")}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الترتيب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">تصاعدي</SelectItem>
                <SelectItem value="desc">تنازلي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* محرر الفقرات */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectId">المشروع</Label>
                  <Select 
                    value={editingParagraph.projectId.toString()} 
                    onValueChange={(v) => setEditingParagraph({...editingParagraph, projectId: parseInt(v)})}
                  >
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
              </div>

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
                <div className="text-sm text-muted-foreground">
                  عدد الكلمات: {editingParagraph.wordCount}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* قائمة الفقرات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              قائمة الفقرات
              <Badge variant="secondary" className="ml-2">
                {filteredParagraphs.length} فقرة
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                تصدير
              </Button>
              <Button variant="outline" size="sm" onClick={fetchAllParagraphs}>
                <RefreshCw className="h-4 w-4 mr-2" />
                تحديث
              </Button>
            </div>
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
                {searchTerm ? "لم يتم العثور على فقرات مطابقة للبحث" : "ابدأ بإضافة فقرة جديدة"}
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
                    <th 
                      className="text-right py-2 px-4 font-medium cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("projectName")}
                    >
                      <div className="flex items-center gap-1">
                        المشروع
                        {sortBy === "projectName" && (
                          <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th className="text-right py-2 px-4 font-medium">النص الأصلي</th>
                    <th 
                      className="text-right py-2 px-4 font-medium cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("position")}
                    >
                      <div className="flex items-center gap-1">
                        الترتيب
                        {sortBy === "position" && (
                          <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-right py-2 px-4 font-medium cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("wordCount")}
                    >
                      <div className="flex items-center gap-1">
                        الكلمات
                        {sortBy === "wordCount" && (
                          <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th className="text-right py-2 px-4 font-medium">النوع</th>
                    <th className="text-right py-2 px-4 font-medium">الحالة</th>
                    <th className="text-right py-2 px-4 font-medium">المترجم</th>
                    <th className="text-right py-2 px-4 font-medium w-24">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParagraphs.map(paragraph => (
                    <tr key={paragraph.paragraphId} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-4">{paragraph.position}</td>
                      <td className="py-2 px-4">
                        <span className="font-medium">{paragraph.projectName}</span>
                      </td>
                      <td className="py-2 px-4 max-w-xs truncate" title={paragraph.originalText}>
                        {paragraph.originalText || "N/A"}
                      </td>
                      <td className="py-2 px-4">{paragraph.position}</td>
                      <td className="py-2 px-4">{paragraph.wordCount}</td>
                      <td className="py-2 px-4">
                        <Badge variant="outline">{paragraph.paragraphType || "Normal"}</Badge>
                      </td>
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
    </div>
  );
}