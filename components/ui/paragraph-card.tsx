// src/components/ui/paragraph-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Edit, 
  Trash2, 
  Copy,
  Eye,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock
} from "lucide-react";

interface ParagraphCardProps {
  paragraph: {
    paragraphId: number;
    projectId: number;
    projectName: string;
    originalText: string;
    paragraphType?: string;
    position: number;
    wordCount: number;
    createdAt: string;
    translations: Array<{
      translationId: number;
      translatedText: string;
      status: string;
      translatorName: string;
      createdAt: string;
      targetLanguageName: string;
    }>;
  };
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
}

export function ParagraphCard({ paragraph, onEdit, onDelete, onView }: ParagraphCardProps) {
  const getStatusBadge = (translations: ParagraphCardProps['paragraph']['translations']) => {
    if (!translations || translations.length === 0) {
      return <Badge variant="outline">غير مترجمة</Badge>;
    }
    const lastTranslation = translations[translations.length - 1];
    switch (lastTranslation.status) {
      case "Draft":
        return <Badge variant="outline">مسودة</Badge>;
      case "Completed":
        return <Badge variant="success">مكتملة</Badge>;
      case "In Review":
        return <Badge variant="warning">قيد المراجعة</Badge>;
      default:
        return <Badge>{lastTranslation.status}</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            <span className="truncate">{paragraph.projectName}</span>
          </CardTitle>
          <Badge variant="secondary">{paragraph.position}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate" title={paragraph.originalText}>
              {paragraph.originalText}
            </p>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{paragraph.paragraphType || "Normal"}</Badge>
            <Badge variant="secondary">{paragraph.wordCount} كلمات</Badge>
          </div>
          {getStatusBadge(paragraph.translations)}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onView(paragraph.paragraphId)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEdit(paragraph.paragraphId)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDelete(paragraph.paragraphId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}