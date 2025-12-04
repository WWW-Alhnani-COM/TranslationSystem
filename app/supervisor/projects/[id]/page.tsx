  const getProjectStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string, icon: React.ReactNode }> = {
      'Draft': { variant: 'outline', label: 'مسودة', icon: <FileText className="w-3 h-3" /> },
      'Active': { variant: 'default', label: 'نشط', icon: <Clock className="w-3 h-3" /> },
      'InProgress': { variant: 'secondary', label: 'قيد التنفيذ', icon: <Users className="w-3 h-3" /> },
      'Completed': { variant: 'default', label: 'منتهي', icon: <CheckCircle className="w-3 h-3" /> },
      'Cancelled': { variant: 'destructive', label: 'ملغي', icon: <AlertTriangle className="w-3 h-3" /> }
    };
    const config = statusConfig[status] || { variant: 'outline', label: status, icon: <FileText className="w-3 h-3" /> };
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 text-xs">
        {config.icon}{config.label}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { variant: "default" | "secondary" | "outline", label: string }> = {
      'Translator': { variant: 'default', label: 'مترجم' },
      'Reviewer': { variant: 'secondary', label: 'مراجع' },
      'Supervisor': { variant: 'outline', label: 'مشرف' },
      'DataEntry': { variant: 'outline', label: 'مدخل بيانات' }
    };
    const config = roleConfig[role] || { variant: 'outline', label: role };
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };
  if (loading) return <ProjectDetailsSkeleton />;

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {error ? "حدث خطأ" : "المشروع غير موجود"}
        </h3>
        <p className="text-muted-foreground mb-4">
          {error || "تعذر العثور على المشروع المطلوب"}
        </p>
        <div className="flex gap-2">
          <Button onClick={fetchProjectData}>إعادة المحاولة</Button>
          <Button variant="outline" asChild>
            <Link href="/supervisor/projects">العودة إلى المشاريع</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Folder className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight truncate">
                {project.projectName}
              </h1>
              {getProjectStatusBadge(project.status)}
            </div>
            {project.description && (
              <p className="text-muted-foreground text-lg mb-3">{project.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>منشئ بواسطة: {project.creatorName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>إنشاء: {new Date(project.createdAt).toLocaleDateString('ar-SA')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Languages className="w-4 h-4" />
                <span>اللغة المصدر: {project.sourceLanguage?.languageName}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2"><Share2 className="w-4 h-4" />مشاركة</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" />تصدير</Button>
          <Button className="gap-2"><Settings className="w-4 h-4" />إدارة</Button>
        </div>
      </div>
// StatCard
interface StatCardProps { title: string; value: string; description: string; icon: React.ReactNode; color: "blue"|"green"|"orange"|"purple"; }
function StatCard({ title, value, description, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800",
    green: "bg-green-50 text-green-600 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800",
    orange: "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-800",
    purple: "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800"
  };
  return (
    <Card className={`border-2 ${colorClasses[color]}`}>
      <CardContent className="p-6 flex justify-between items-center">
        <div>
          <p className="text-2xl font-bold mb-1">{value}</p>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs opacity-75 mt-1">{description}</p>
        </div>
        <div className="p-2 rounded-lg bg-current/20">{icon}</div>
      </CardContent>
    </Card>
  );
}

// ProgressItem
interface ProgressItemProps { label: string; value: number; total: number; color: "blue"|"green"|"purple"; }
function ProgressItem({ label, value, total, color }: ProgressItemProps) {
  const percentage = total > 0 ? (value/total)*100 : 0;
  const colorClasses = { blue:"bg-blue-500", green:"bg-green-500", purple:"bg-purple-500" };
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span>{label}</span>
        <span>{value} / {total} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2">
        <div className={`rounded-full h-2 transition-all duration-300 ${colorClasses[color]}`} style={{width:`${percentage}%`}} />
      </div>
    </div>
  );
}

// InfoItem
interface InfoItemProps { label: string; value: React.ReactNode; }
function InfoItem({ label, value }: InfoItemProps) {
  return <div className="flex justify-between items-center py-2 border-b last:border-b-0"><span className="text-sm font-medium text-muted-foreground">{label}</span><span className="text-sm">{value}</span></div>;
}

// AssignmentCard
interface AssignmentCardProps { assignment: Assignment; }
function AssignmentCard({ assignment }: AssignmentCardProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className="p-2 rounded-lg bg-primary/10 text-primary"><User className="w-5 h-5" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold truncate">{assignment.userName}</h4>
            {getRoleBadge(assignment.role)}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{assignment.userEmail}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>اللغة: {assignment.targetLanguageName}</span>
            <span>الحالة: {assignment.status}</span>
            <span>المهام: {assignment.translationCount}</span>
          </div>
        </div>
      </div>
      <Button variant="ghost" size="icon"><ArrowRight className="w-4 h-4" /></Button>
    </div>
  );
}

// LanguageSection
interface LanguageSectionProps { title: string; language?: Language; languages?: Language[]; }
function LanguageSection({ title, language, languages }: LanguageSectionProps) {
  return (
    <div>
      <h4 className="font-semibold mb-3">{title}</h4>
      <div className="space-y-2">
        {language ? (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3"><Languages className="w-4 h-4 text-muted-foreground" /><span>{language.languageName}</span><Badge variant="outline" className="text-xs">{language.languageCode}</Badge></div>
          </div>
        ) : languages?.map(lang => (
          <div key={lang.languageId} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3"><Languages className="w-4 h-4 text-muted-foreground" /><span>{lang.languageName}</span><Badge variant="outline" className="text-xs">{lang.languageCode}</Badge></div>
            <Badge variant={lang.isActive?"default":"outline"} className="text-xs">{lang.isActive?"نشط":"غير نشط"}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton Loader
function ProjectDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <Skeleton className="w-14 h-14 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
          <div className="flex gap-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-28" /></div>
        </div>
        <div className="flex gap-2"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-24" /></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({length:4}).map((_,i)=><Card key={i}><CardContent className="p-6"><Skeleton className="h-6 w-12 mb-2"/><Skeleton className="h-4 w-16"/></CardContent></Card>)}</div>
      <div className="space-y-6"><Skeleton className="h-10 w-full" /><div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{Array.from({length:2}).map((_,i)=><Card key={i}><CardHeader><Skeleton className="h-6 w-32 mb-2"/><Skeleton className="h-4 w-48"/></CardHeader><CardContent className="space-y-4">{Array.from({length:i===0?3:6}).map((_,j)=><Skeleton key={j} className="h-4 w-full"/>)}</CardContent></Card>)}</div></div>
    </div>
  );
}
