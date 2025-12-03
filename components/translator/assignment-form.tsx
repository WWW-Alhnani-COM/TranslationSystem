// src/components/translator/assignment-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { 
  Users, 
  Languages, 
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5296/api';

interface AssignmentFormProps {
  projectId: number;
  project: any;
  availableTranslators: any[];
  availableReviewers: any[];
  availableSupervisors: any[];
  initialAssignments?: any;
  onSubmit: (assignments: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function AssignmentForm({
  projectId,
  project,
  availableTranslators,
  availableReviewers,
  availableSupervisors,
  initialAssignments = {},
  onSubmit,
  onCancel,
  isLoading
}: AssignmentFormProps) {
  const [assignments, setAssignments] = useState({
    translators: initialAssignments.translators || {} as Record<number, number>,
    reviewers: initialAssignments.reviewers || {} as Record<number, number>,
    supervisor: initialAssignments.supervisor || null as number | null
  });
  const [error, setError] = useState<string | null>(null);

  const assignTranslator = (languageId: number, userId: number) => {
    setAssignments(prev => ({
      ...prev,
      translators: {
        ...prev.translators,
        [languageId]: userId
      }
    }));
  };

  const assignReviewer = (languageId: number, userId: number) => {
    setAssignments(prev => ({
      ...prev,
      reviewers: {
        ...prev.reviewers,
        [languageId]: userId
      }
    }));
  };

  const assignSupervisor = (userId: number) => {
    setAssignments(prev => ({
      ...prev,
      supervisor: userId
    }));
  };

  const canUserHandleLanguage = (user: any, languageId: number) => {
    if (user.languages && Array.isArray(user.languages)) {
      return user.languages.some((lang: any) => lang.languageId === languageId);
    }
    return true;
  };

  const handleSubmit = () => {
    // التحقق من التعيينات الأساسية
    const validationErrors = [];

    // التحقق من تعيين مترجم ومراجع لكل لغة
    project.targetLanguages?.forEach((lang: any) => {
      if (!assignments.translators[lang.languageId]) {
        validationErrors.push(`يجب تعيين مترجم للغة ${lang.languageName}`);
      }
      if (!assignments.reviewers[lang.languageId]) {
        validationErrors.push(`يجب تعيين مراجع للغة ${lang.languageName}`);
      }
    });
    
    if (!assignments.supervisor) {
      validationErrors.push('يجب تعيين مشرف للمشروع');
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      return;
    }

    onSubmit(assignments);
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>تعيين الفريق</CardTitle>
        <CardDescription>
          قم بتعيين المترجمين والمراجعين والمشرف للمشروع: {project.projectName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>خطأ</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* تعيين الفريق حسب اللغات */}
        <div className="space-y-4">
          {project.targetLanguages?.map((lang: any) => (
            <div key={lang.languageId} className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-blue-500" />
                  <h3 className="font-medium">{lang.languageName}</h3>
                </div>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                  فقرات: {project.totalParagraphs || 0}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm mb-1 block">المترجم</Label>
                  <Select 
                    value={assignments.translators[lang.languageId]?.toString() || ''}
                    onValueChange={(value) => assignTranslator(lang.languageId, parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مترجم" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTranslators
                        .filter(u => canUserHandleLanguage(u, lang.languageId))
                        .map(translator => (
                          <SelectItem 
                            key={translator.userId} 
                            value={translator.userId.toString()}
                          >
                            {translator.firstName} {translator.lastName}
                            {translator.languages && (
                              <span className="text-muted-foreground text-xs ml-2">
                                ({translator.languages.map((l: any) => l.languageName).join(', ')})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      {availableTranslators.filter(u => canUserHandleLanguage(u, lang.languageId)).length === 0 && (
                        <SelectItem value="" disabled>لا يوجد مترجمين يدعمون هذه اللغة</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm mb-1 block">المراجع</Label>
                  <Select 
                    value={assignments.reviewers[lang.languageId]?.toString() || ''}
                    onValueChange={(value) => assignReviewer(lang.languageId, parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مراجع" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableReviewers
                        .filter(u => canUserHandleLanguage(u, lang.languageId))
                        .map(reviewer => (
                          <SelectItem 
                            key={reviewer.userId} 
                            value={reviewer.userId.toString()}
                          >
                            {reviewer.firstName} {reviewer.lastName}
                            {reviewer.languages && (
                              <span className="text-muted-foreground text-xs ml-2">
                                ({reviewer.languages.map((l: any) => l.languageName).join(', ')})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      {availableReviewers.filter(u => canUserHandleLanguage(u, lang.languageId)).length === 0 && (
                        <SelectItem value="" disabled>لا يوجد مراجعين يدعمون هذه اللغة</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
          
          <div>
            <Label className="text-sm mb-1 block">المشرف</Label>
            <Select 
              value={assignments.supervisor?.toString() || ''}
              onValueChange={(value) => assignSupervisor(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر مشرف" />
              </SelectTrigger>
              <SelectContent>
                {availableSupervisors.map(supervisor => (
                  <SelectItem 
                    key={supervisor.userId} 
                    value={supervisor.userId.toString()}
                  >
                    {supervisor.firstName} {supervisor.lastName}
                  </SelectItem>
                ))}
                {availableSupervisors.length === 0 && (
                  <SelectItem value="" disabled>لا يوجد مشرفين متاحين</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={onCancel}
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري التعيين...
              </>
            ) : (
              <>
                تعيين الفريق
                <Users className="h-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}