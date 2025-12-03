// app/data-entry/approved-projects/[id]/page.tsx
import { notFound } from 'next/navigation';
import { projectService, paragraphService, translationService } from '@/lib/api-services';
import { ProjectResponseDto, ParagraphResponseDto, TranslationResponseDto } from '@/types';
import { TranslatedParagraphsClientView } from './TranslatedParagraphsClientView';

export default async function ApprovedProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id || typeof id !== 'string') {
    notFound();
  }

  const projectId = parseInt(id, 10);
  if (isNaN(projectId) || projectId <= 0) {
    notFound();
  }

  let project: ProjectResponseDto;
  let paragraphs: ParagraphResponseDto[] = [];

  try {
    [project, paragraphs] = await Promise.all([
      projectService.getById(projectId),
      paragraphService.getByProject(projectId),
    ]);
  } catch (error) {
    console.error('فشل تحميل تفاصيل المشروع أو الفقرات:', error);
    notFound();
  }

  // جلب الترجمات لكل فقرة
  const paragraphsAndTranslations = await Promise.all(
    paragraphs.map(async (paragraph) => {
      try {
        const translations = await translationService.getByParagraph(paragraph.paragraphId);
        return { paragraph, translations };
      } catch (error) {
        console.warn(`فشل تحميل الترجمات للفقرة ${paragraph.paragraphId}`);
        return { paragraph, translations: [] };
      }
    })
  );

  // تصفية الفقرات التي تحتوي على ترجمات
  const translatedParagraphs = paragraphsAndTranslations.filter(item => item.translations.length > 0);

  return (
    <TranslatedParagraphsClientView
      project={project}
      translatedParagraphs={translatedParagraphs}
    />
  );
}