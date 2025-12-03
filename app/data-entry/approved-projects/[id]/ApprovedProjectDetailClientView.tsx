// app/data-entry/approved-projects/[id]/ApprovedProjectDetailClientView.tsx
'use client';

import { useState } from 'react';
import { ProjectResponseDto, ApprovalInfoDto, ReviewResponseDto, TranslationResponseDto, ParagraphResponseDto } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { format } from 'date-fns';

export function ApprovedProjectDetailClientView({
  project,
  approvedItems,
}: {
  project: ProjectResponseDto;
  approvedItems: Array<{
    paragraph: ParagraphResponseDto;
    translation: TranslationResponseDto;
    review: ReviewResponseDto;
    approval: ApprovalInfoDto;
  }>;
}) {
  const [showOriginal, setShowOriginal] = useState(true);
  const [showTranslated, setShowTranslated] = useState(true);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">تفاصيل المشروع المعتمد</h1>
        <h2 className="text-xl mt-2">{project.projectName}</h2>
        <p className="text-muted-foreground">{project.description || 'بدون وصف'}</p>
        <div className="mt-2 flex items-center gap-4 text-sm">
          <span>لغة المصدر: {project.sourceLanguageName}</span>
          <Badge variant="secondary">{project.status}</Badge>
        </div>
      </div>

      {/* أزرار التحكم */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant={showOriginal ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowOriginal(!showOriginal)}
          className="gap-2"
        >
          {showOriginal ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          {showOriginal ? 'إخفاء' : 'إظهار'} النص الأصلي
        </Button>
        <Button
          variant={showTranslated ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowTranslated(!showTranslated)}
          className="gap-2"
        >
          {showTranslated ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          {showTranslated ? 'إخفاء' : 'إظهار'} الترجمة
        </Button>
      </div>

      {approvedItems.length === 0 ? (
        <p className="text-muted-foreground">لا توجد فقرات معتمدة في هذا المشروع.</p>
      ) : (
        <div className="space-y-6">
          {approvedItems.map((item, index) => (
            <Card key={item.paragraph.paragraphId + '-' + item.translation.translationId} className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="text-base">فقرة #{item.paragraph.position}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* عرض النص الأصلي (إذا كان مُفعّلًا) */}
                {showOriginal && (
                  <div className="bg-muted/30 p-3 rounded">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      النص الأصلي ({project.sourceLanguageName})
                    </h4>
                    <p className="whitespace-pre-wrap">{item.paragraph.originalText}</p>
                  </div>
                )}

                {/* عرض الترجمة (إذا كان مُفعّلًا) */}
                {showTranslated && (
                  <div className="bg-green-50/30 p-3 rounded border border-green-200">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      الترجمة ({item.translation.targetLanguageName})
                    </h4>
                    <p className="whitespace-pre-wrap font-medium">{item.approval.finalText || item.review.reviewedText || item.translation.translatedText}</p>
                  </div>
                )}

                {/* معلومات المشرف والتاريخ */}
                <div className="pt-3 border-t border-muted-foreground/20">
                  <h5 className="text-sm font-medium">المشرف: {item.approval.supervisorName}</h5>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(item.approval.approvedAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                  {item.approval.comments && (
                    <p className="text-xs mt-2 bg-yellow-50 p-2 rounded border border-yellow-100">
                      <span className="font-medium text-yellow-800">ملاحظات:</span> {item.approval.comments}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}