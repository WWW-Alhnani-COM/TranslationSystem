// src/app/data-entry/projects/[id]/paragraphs/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import * as input from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Edit, Trash2, Loader2, CheckCircle, XCircle, BookOpen } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";

export default function ProjectParagraphsPage() {
  const params = useParams();
  const projectId = parseInt(params.id as string);
  const router = useRouter();
  const [paragraphs, setParagraphs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newParagraph, setNewParagraph] = useState({
    originalText: "",
    paragraphType: "Normal",
    position: 0,
    wordCount: 0
  });
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchParagraphs();
  }, [projectId]);

  const fetchParagraphs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`Paragraphs/project/${projectId}`);
      
      if (response.success) {
        setParagraphs(response.data || []);
      } else {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: response.message || "فشل في جلب فقرات المشروع",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في الاتصال بالخادم",
      });
    } finally {
      setLoading(false);
    }
  };

  const addParagraph = async () => {
    if (!newParagraph.originalText.trim()) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "الرجاء إدخال نص الفقرة",
      });
      return;
    }

    try {
      setAdding(true);
      const response = await apiClient.post("Paragraphs", {
        projectId,
        originalText: newParagraph.originalText,
        paragraphType: newParagraph.paragraphType,
        position: newParagraph.position,
        wordCount: newParagraph.wordCount
      });

      if (response.success) {
        toast({
          title: "نجاح",
          description: "تمت إضافة الفقرة بنجاح",
        });
        setNewParagraph({
          originalText: "",
          paragraphType: "Normal",
          position: 0,
          wordCount: 0
        });
        setShowAddForm(false);
        fetchParagraphs();
      } else {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: response.message || "فشل في إضافة الفقرة",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في الاتصال بالخادم",
      });
    } finally {
      setAdding(false);
    }
  };

  const deleteParagraph = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفقرة؟ لن يمكن التراجع عن هذا الإجراء.")) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await apiClient.delete(`Paragraphs/${id}`);
      
      if (response.success) {
        toast({
          title: "نجاح",
          description: "تم حذف الفقرة بنجاح",
        });
        fetchParagraphs();
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
      setDeletingId(null);
    }
  };

  const getStatusBadge = (translations: any[]) => {
    if (translations.length === 0) {
      return <Badge variant="outline" className="text-muted-foreground">غير مترجمة</Badge>;
    }
    const completed = translations.some(t => t.status === "Completed");
    return completed ? (
      <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">مترجمة</Badge>
    ) : (
      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">قيد المراجعة</Badge>
    );
  };

  const filteredParagraphs = paragraphs.filter(paragraph => 
    paragraph.originalText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">فقرات المشروع</h1>
          <p className="text-muted-foreground mt-2">
            إدارة فقرات المشروع وترجماتها
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input.Input
              placeholder="بحث عن فقرة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة فقرة
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>إضافة فقرة جديدة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="originalText">النص الأصلي</Label>
                <Textarea
                  id="originalText"
                  value={newParagraph.originalText}
                  onChange={(e: { target: { value: any; }; }) => setNewParagraph({...newParagraph, originalText: e.target.value})}
                  placeholder="أدخل النص الأصلي للفقرة"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paragraphType">نوع الفقرة</Label>
                  <select
                    id="paragraphType"
                    value={newParagraph.paragraphType}
                    onChange={(e) => setNewParagraph({...newParagraph, paragraphType: e.target.value})}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="Normal">نص عادي</option>
                    <option value="Header">عنوان</option>
                    <option value="Subheader">عنوان فرعي</option>
                    <option value="Quote">اقتباس</option>
                    <option value="List">قائمة</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">الترتيب</Label>
                  <input.Input
                    id="position"
                    type="number"
                    value={newParagraph.position}
                    onChange={(e) => setNewParagraph({...newParagraph, position: parseInt(e.target.value)})}
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wordCount">عدد الكلمات</Label>
                  <input.Input
                    id="wordCount"
                    type="number"
                    value={newParagraph.wordCount}
                    onChange={(e) => setNewParagraph({...newParagraph, wordCount: parseInt(e.target.value)})}
                    min="0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                >
                  إلغاء
                </Button>
                <Button 
                  onClick={addParagraph} 
                  disabled={adding}
                >
                  {adding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري الإضافة...
                    </>
                  ) : "إضافة الفقرة"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>قائمة الفقرات</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredParagraphs.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-medium mb-1">لا توجد فقرات</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "لم يتم العثور على فقرات مطابقة للبحث" : "ابدأ بإضافة فقرة جديدة"}
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                إضافة فقرة جديدة
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الرقم</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>النص الأصلي</TableHead>
                    <TableHead>عدد الكلمات</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParagraphs.map((paragraph) => (
                    <TableRow key={paragraph.paragraphId}>
                      <TableCell className="font-medium">{paragraph.position}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {paragraph.paragraphType === "Normal" && "نص عادي"}
                          {paragraph.paragraphType === "Header" && "عنوان"}
                          {paragraph.paragraphType === "Subheader" && "عنوان فرعي"}
                          {paragraph.paragraphType === "Quote" && "اقتباس"}
                          {paragraph.paragraphType === "List" && "قائمة"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={paragraph.originalText}>
                          {paragraph.originalText}
                        </div>
                      </TableCell>
                      <TableCell>{paragraph.wordCount}</TableCell>
                      <TableCell>{getStatusBadge(paragraph.translations)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2 space-x-reverse">
                          <Button
                            variant="outline"
                            size="icon"
                            title="تعديل الفقرة"
                            onClick={() => {
                              // هنا يمكن إضافة منطق لتعديل الفقرة
                              toast({
                                title: "ملاحظة",
                                description: "هذه الميزة قيد التطوير",
                              });
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            title="حذف الفقرة"
                            onClick={() => deleteParagraph(paragraph.paragraphId)}
                            disabled={deletingId === paragraph.paragraphId}
                          >
                            {deletingId === paragraph.paragraphId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
