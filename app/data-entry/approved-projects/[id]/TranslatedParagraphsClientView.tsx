// app/data-entry/approved-projects/[id]/TranslatedParagraphsClientView.tsx
'use client';

import { useState } from 'react';
import { ProjectResponseDto, TranslationResponseDto, ParagraphResponseDto } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { format } from 'date-fns';

export function TranslatedParagraphsClientView({
  project,
  translatedParagraphs, // Array<{ paragraph: ParagraphResponseDto, translations: TranslationResponseDto[] }>
}: {
  project: ProjectResponseDto;
  translatedParagraphs: Array<{
    paragraph: ParagraphResponseDto;
    translations: TranslationResponseDto[];
  }>;
}) {
  const [showOriginal, setShowOriginal] = useState(true);
  const [showTranslated, setShowTranslated] = useState(true);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">تفاصيل المشروع - الفقرات المترجمة</h1>
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
          {showTranslated ? 'إخفاء' : 'إظهار'} الترجمات
        </Button>
      </div>

      {translatedParagraphs.length === 0 ? (
        <p className="text-muted-foreground">لا توجد فقرات مترجمة في هذا المشروع.</p>
      ) : (
        <div className="space-y-6">
          {translatedParagraphs.map(({ paragraph, translations }) => (
            <Card key={paragraph.paragraphId} className="border-l-4 border-l-blue-500"> {/* تغيير اللون لتمييزه عن المعتمد */}
              <CardHeader>
                <CardTitle className="text-base">فقرة #{paragraph.position}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* عرض النص الأصلي (إذا كان مُفعّلًا) */}
                {showOriginal && (
                  <div className="bg-muted/30 p-3 rounded">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      النص الأصلي ({project.sourceLanguageName})
                    </h4>
                    <p className="whitespace-pre-wrap">{paragraph.originalText}</p>
                  </div>
                )}

                {/* عرض الترجمات (إذا كانت مُفعّلة) */}
                {showTranslated && translations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">الترجمات:</h4>
                    {translations.map((translation) => (
                      <div key={translation.translationId} className="bg-blue-50/30 p-3 rounded border border-blue-200">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-blue-800">اللغة: {translation.targetLanguageName}</span>
                          <Badge variant="outline" className="text-xs">{translation.status}</Badge>
                        </div>
                        <p className="whitespace-pre-wrap font-medium">{translation.translatedText}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* إذا تم إخفاء الترجمات أو لم توجد، عرض رسالة */
                  showTranslated && translations.length === 0 && (
                    <p className="text-muted-foreground text-sm italic">لا توجد ترجمات لهذه الفقرة.</p>
                  )
                }
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}