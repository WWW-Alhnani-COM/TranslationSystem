'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Save, FolderOpen, Languages } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// --- Interfaces based on API documentation ---
interface ProjectRequestDto {
  projectName: string;
  description?: string;
  sourceLanguageId: number;
  targetLanguageIds?: number[];
  deadline?: string;
}

interface Language {
  languageId: number;
  name: string;
  code: string;
  isActive: boolean;
  direction?: 'LTR' | 'RTL';
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProjectRequestDto>({
    projectName: '',
    description: '',
    sourceLanguageId: 1, // Default to Arabic or first language
    targetLanguageIds: [],
    deadline: ''
  });
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch available languages - الحل الجذري
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch('http://localhost:5296/api/Languages/active');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // الحل الجذري: التحقق الشامل من نوع البيانات قبل استخدامها
        const languagesResult = await response.json();
        
        // التحقق الشامل من نوع البيانات
        if (languagesResult && 
            typeof languagesResult === 'object' && 
            'success' in languagesResult && 
            languagesResult.success === true && 
            'data' in languagesResult && 
            Array.isArray(languagesResult.data)) {
          
          setLanguages(languagesResult.data);
          // تعيين اللغة المصدر الافتراضية
          if (languagesResult.data.length > 0) {
            setFormData(prev => ({
              ...prev,
              sourceLanguageId: languagesResult.data[0].languageId
            }));
          }
        } else {
          throw new Error('Invalid response format from API');
        }
      } catch (err: any) {
        console.error('Error fetching languages:', err);
        setError(err.message || 'An unexpected error occurred while fetching languages.');
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sourceLanguageId' || name === 'targetLanguageIds' 
        ? (name === 'targetLanguageIds' ? value.split(',').map(Number).filter(id => !isNaN(id)) : parseInt(value))
        : value
    }));
  };

  const handleTargetLanguageChange = (languageId: number) => {
    setFormData(prev => {
      const currentTargetLangs = prev.targetLanguageIds || [];
      const newTargetLangs = currentTargetLangs.includes(languageId)
        ? currentTargetLangs.filter(id => id !== languageId)
        : [...currentTargetLangs, languageId];
      
      return {
        ...prev,
        targetLanguageIds: newTargetLangs
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate form data
      if (!formData.projectName.trim()) {
        throw new Error('اسم المشروع مطلوب');
      }

      if (!formData.sourceLanguageId) {
        throw new Error('اللغة المصدر مطلوبة');
      }

      if (!formData.targetLanguageIds || formData.targetLanguageIds.length === 0) {
        throw new Error('يجب اختيار لغة واحدة على الأقل');
      }

      // Debug: Log the exact data being sent
      console.log('Sending project data:', {
        projectName: formData.projectName,
        description: formData.description,
        sourceLanguageId: formData.sourceLanguageId,
        targetLanguageIds: formData.targetLanguageIds,
        deadline: formData.deadline || undefined
      });

      const response = await fetch('http://localhost:5296/api/Projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: formData.projectName,
          description: formData.description,
          sourceLanguageId: formData.sourceLanguageId,
          targetLanguageIds: formData.targetLanguageIds,
          deadline: formData.deadline || undefined
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'خطأ في الخادم' }));
        console.error('API Error Details:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      if (result.success) {
        setSuccess(true);
        // Redirect to project page after successful creation
        setTimeout(() => {
          router.push('/dashboard/manager/projects');
        }, 2000);
      } else {
        throw new Error(result.message || 'فشل في إنشاء المشروع.');
      }
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'حدث خطأ أثناء إنشاء المشروع.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="flex items-center gap-2 mb-6">
          <Button asChild variant="ghost">
            <Link href="/dashboard/manager/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              العودة إلى المشاريع
            </Link>
          </Button>
        </div>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              إنشاء مشروع جديد
            </CardTitle>
            <CardDescription>
              جاري تحميل البيانات...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
              
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex items-center gap-2 mb-6">
        <Button asChild variant="ghost">
          <Link href="/dashboard/manager/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            العودة إلى المشاريع
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            إنشاء مشروع جديد
          </CardTitle>
          <CardDescription>
            قم بإنشاء مشروع جديد لإدارة الترجمة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="default" className="mb-4">
              <Save className="h-4 w-4" />
              <AlertDescription>
                تم إنشاء المشروع بنجاح! جاري التوجيه...
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="projectName">اسم المشروع *</Label>
              <Input
                id="projectName"
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                placeholder="أدخل اسم المشروع"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="وصف المشروع (اختياري)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="sourceLanguageId">اللغة المصدر *</Label>
                <select
                  id="sourceLanguageId"
                  name="sourceLanguageId"
                  value={formData.sourceLanguageId}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  required
                >
                  {languages.map(language => (
                    <option key={language.languageId} value={language.languageId}>
                      {language.name} ({language.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">الموعد النهائي (اختياري)</Label>
                <Input
                  type="date"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>اللغات المستهدفة *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {languages.map(language => (
                  <div 
                    key={language.languageId} 
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      formData.targetLanguageIds?.includes(language.languageId) 
                        ? 'border-primary bg-primary/10' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTargetLanguageChange(language.languageId)}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.targetLanguageIds?.includes(language.languageId) || false}
                        onChange={() => {}}
                        className="hidden"
                      />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        formData.targetLanguageIds?.includes(language.languageId) 
                          ? 'bg-primary border-primary' 
                          : 'border-gray-300'
                      }`}>
                        {formData.targetLanguageIds?.includes(language.languageId) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </div>
                      <span className="text-sm">
                        {language.name} ({language.code})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Save className="mr-2 h-4 w-4 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    إنشاء المشروع
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}