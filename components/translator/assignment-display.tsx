// src/components/translator/assignment-display.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Languages, 
  Clock, 
  Edit,
  CheckCircle2,
  AlertCircle,
  Eye,
  User
} from 'lucide-react';
import Link from 'next/link';

interface AssignmentDisplayProps {
  project: any;
  assignments: any[];
  onEdit: () => void;
}

export function AssignmentDisplay({ project, assignments, onEdit }: AssignmentDisplayProps) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Translator':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">مترجم</Badge>;
      case 'Reviewer':
        return <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 border-purple-500/20">مراجع</Badge>;
      case 'Supervisor':
        return <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">مشرف</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">في الانتظار</Badge>;
      case 'InProgress':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">قيد العمل</Badge>;
      case 'Completed':
        return <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">مكتمل</Badge>;
      case 'Overdue':
        return <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20">متأخر</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // تجميع التعيينات حسب اللغة
  const assignmentsByLanguage: Record<number, any[]> = {};
  const supervisorAssignment = assignments.find(a => a.role === 'Supervisor');

  assignments
    .filter(a => a.role !== 'Supervisor')
    .forEach(assignment => {
      if (!assignmentsByLanguage[assignment.targetLanguageId]) {
        assignmentsByLanguage[assignment.targetLanguageId] = [];
      }
      assignmentsByLanguage[assignment.targetLanguageId].push(assignment);
    });

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>التعيينات الحالية</CardTitle>
          <p className="text-sm text-muted-foreground">
            عرض الفريق المعين لهذا المشروع
          </p>
        </div>
        <Button onClick={onEdit} variant="outline" className="gap-2">
          <Edit className="w-4 h-4" />
          تعديل
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* الفريق حسب اللغات */}
        {Object.entries(assignmentsByLanguage).map(([languageId, languageAssignments]) => {
          const language = project.targetLanguages?.find((lang: any) => lang.languageId === parseInt(languageId));
          return (
            <div key={languageId} className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-blue-500" />
                  <h3 className="font-medium">{language?.languageName || `لغة ${languageId}`}</h3>
                </div>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                  {languageAssignments.length} عضو
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {languageAssignments.map(assignment => (
                  <div key={assignment.assignmentId} className="p-3 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          <span className="font-medium">
                            {assignment.userName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getRoleBadge(assignment.role)}
                          {getStatusBadge(assignment.status)}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {new Date(assignment.deadline).toLocaleDateString('ar-SA')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        {/* المشرف */}
        {supervisorAssignment && (
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-500" />
                <h3 className="font-medium">المشرف</h3>
              </div>
            </div>
            
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-green-500" />
                    <span className="font-medium">
                      {supervisorAssignment.userName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(supervisorAssignment.role)}
                    {getStatusBadge(supervisorAssignment.status)}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {new Date(supervisorAssignment.deadline).toLocaleDateString('ar-SA')}
                </Badge>
              </div>
            </div>
          </div>
        )}
        
        {Object.keys(assignmentsByLanguage).length === 0 && !supervisorAssignment && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>لا توجد تعيينات حالية لهذا المشروع</p>
            <Button onClick={onEdit} className="mt-4">
              تعيين الفريق
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}