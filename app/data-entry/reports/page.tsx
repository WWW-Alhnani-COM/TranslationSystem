// // src/app/data-entry/reports/page.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { apiClient } from "@/lib/api-client";
// import { toast } from "@/components/ui/use-toast";
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "@data-entry/recharts";
// import { TrendingUp, FileText, Users, CheckCircle, Clock, AlertCircle } from "lucide-react";

// // تعريف الأنواع بناءً على OpenAPI
// interface DashboardStats {
//   totalProjects: number;
//   activeProjects: number;
//   completedProjects: number;
//   totalUsers: number;
//   activeUsers: number;
//   totalTranslations: number;
//   pendingTranslations: number;
//   completedTranslations: number;
//   totalWordsTranslated: number;
//   averageQualityScore: number;
//   recentProjects: Array<{
//     projectId: number;
//     projectName: string;
//     progressPercentage: number;
//     status: string;
//     deadline: string; // ISO date string
//   }>;
//   languageStats: Array<{
//     languageName: string;
//     projectCount: number;
//     wordCount: number;
//     averageQuality: number;
//   }>;
//   timestamp: string; // ISO date string
// }

// interface Project {
//   [x: string]: any;
//   projectId: number;
//   projectName: string;
//   description?: string;
//   sourceLanguageId: number;
//   sourceLanguageName: string;
//   sourceLanguageCode: string;
//   createdBy: number;
//   creatorName: string;
//   status: 'Draft' | 'Active' | 'InProgress' | 'Review' | 'Completed' | 'Cancelled';
//   createdAt: string; // ISO date string
//   updatedAt?: string; // ISO date string
//   totalParagraphs: number;
//   wordCount: number;
//   targetLanguages?: Array<{
//     languageId: number;
//     languageName: string;
//     languageCode: string;
//     textDirection: string;
//   }>;
// }

// interface Assignment {
//   assignmentId: number;
//   projectId: number;
//   projectName: string;
//   userId: number;
//   userName: string;
//   userEmail: string;
//   role: string;
//   targetLanguageId: number;
//   targetLanguageName: string;
//   targetLanguageCode: string;
//   status: string;
//   assignedAt: string; // ISO date string
//   deadline: string; // ISO date string
//   completedAt: string | null; // ISO date string
//   isOverdue: boolean;
//   translationCount: number;
//   reviewCount: number;
// }

// export default function ReportsPage() {
//   const [stats, setStats] = useState<DashboardStats | null>(null);
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [assignments, setAssignments] = useState<Assignment[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect((): void => {
//     fetchReportsData();
//   }, []);

//   const fetchReportsData = async () => {
//     try {
//       setLoading(true);
//       const statsResponse = await apiClient.get("Statistics/dashboard");
//       const projectsResponse = await apiClient.get("Projects");
//       const assignmentsResponse = await apiClient.get("Assignments");

//       if (statsResponse.success && statsResponse.data) {
//         setStats(statsResponse.data);
//       } else {
//         toast({
//           variant: "destructive",
//           title: "خطأ",
//           description: statsResponse.message || "فشل في جلب الإحصائيات",
//         });
//       }

//       if (projectsResponse.success && Array.isArray(projectsResponse.data)) {
//         // --- التعديل: حساب القيم من الفقرات ---
//         const projectsWithCalculatedValues = await Promise.all(
//           projectsResponse.data.map(async (project: { projectId: number; }) => {
//             const calculatedTotalParagraphs = await getProjectParagraphCount(project.projectId);
//             const calculatedTotalWordCount = await getProjectWordCount(project.projectId);

//             return {
//               ...project,
//               totalParagraphs: calculatedTotalParagraphs,
//               wordCount: calculatedTotalWordCount,
//             };
//           })
//         );
//         setProjects(projectsWithCalculatedValues);
//       } else {
//         toast({
//           variant: "destructive",
//           title: "خطأ",
//           description: projectsResponse.message || "فشل في جلب المشاريع",
//         });
//       }

//       if (assignmentsResponse.success && Array.isArray(assignmentsResponse.data)) {
//         setAssignments(assignmentsResponse.data);
//       } else {
//         toast({
//           variant: "destructive",
//           title: "خطأ",
//           description: assignmentsResponse.message || "فشل في جلب المهام",
//         });
//       }
//     } catch (error) {
//       toast({
//         variant: "destructive",
//         title: "خطأ",
//         description: "فشل في الاتصال بالخادم",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getProjectParagraphCount = async (projectId: number): Promise<number> => {
//     try {
//       const response = await apiClient.get(`Paragraphs/project/${projectId}`);
//       if (response.success && Array.isArray(response.data)) {
//         return response.data.length;
//       }
//       return 0;
//     } catch (error) {
//       console.error(`Failed to fetch paragraph count for project ${projectId}:`, error);
//       return 0;
//     }
//   };

//   const getProjectWordCount = async (projectId: number): Promise<number> => {
//     try {
//       const response = await apiClient.get(`Paragraphs/project/${projectId}`);
//       if (response.success && Array.isArray(response.data)) {
//         return response.data.reduce((sum: any, paragraph: { wordCount: any; }) => sum + (paragraph.wordCount || 0), 0);
//       }
//       return 0;
//     } catch (error) {
//       console.error(`Failed to fetch word count for project ${projectId}:`, error);
//       return 0;
//     }
//   };

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case "Active":
//       case "InProgress":
//         return <Badge variant="success">نشط</Badge>;
//       case "Completed":
//         return <Badge variant="secondary">مكتمل</Badge>;
//       case "Draft":
//         return <Badge variant="outline">مسودة</Badge>;
//       case "Review":
//         return <Badge variant="warning">قيد المراجعة</Badge>;
//       case "Cancelled":
//         return <Badge variant="destructive">ملغى</Badge>;
//       default:
//         return <Badge>{status}</Badge>;
//     }
//   };

//   if (loading) {
//     return (
//       <div className="container mx-auto py-10 flex justify-center items-center">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   if (!stats) {
//     return (
//       <div className="container mx-auto py-10 text-center">
//         <h2 className="text-xl font-bold">لا توجد إحصائيات</h2>
//         <p className="text-muted-foreground">لا توجد بيانات إحصائية متاحة حاليًا.</p>
//       </div>
//     );
//   }

//   // تحويل بيانات اللغات لاستخدامها في الرسم البياني
//   const languageChartData = stats.languageStats.map(lang => ({
//     name: lang.languageName,
//     words: lang.wordCount
//   }));

//   // تحويل بيانات المشاريع لاستخدامها في الرسم البياني
//   const projectProgressData = projects.map(project => ({
//     name: project.projectName,
//     progress: project.progressPercentage // تأكد من أن هذا الحقل موجود في Project
//   }));

//   const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

//   return (
//     <div className="container mx-auto py-10">
//       <h1 className="text-3xl font-bold mb-8">التقارير</h1>

//       {/* الإحصائيات العامة */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">إجمالي المشاريع</CardTitle>
//             <FileText className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.totalProjects}</div>
//             <p className="text-xs text-muted-foreground">إجمالي عدد المشاريع</p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">المشاريع النشطة</CardTitle>
//             <FileText className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.activeProjects}</div>
//             <p className="text-xs text-muted-foreground">المشاريع قيد التقدم</p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
//             <Users className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.totalUsers}</div>
//             <p className="text-xs text-muted-foreground">إجمالي عدد المستخدمين</p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">متوسط جودة الترجمة</CardTitle>
//             <TrendingUp className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.averageQualityScore.toFixed(2)}/5</div>
//             <p className="text-xs text-muted-foreground">متوسط النقاط</p>
//           </CardContent>
//         </Card>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//         {/* تقدم المشروع */}
//         <Card>
//           <CardHeader>
//             <CardTitle>تقدم المشروع</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="h-80">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={projectProgressData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="name" />
//                   <YAxis />
//                   <Tooltip />
//                   <Legend />
//                   <Bar dataKey="progress" name="نسبة التقدم (%)" fill="#8884d8" />
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </CardContent>
//         </Card>

//         {/* توزيع الكلمات حسب اللغة */}
//         <Card>
//           <CardHeader>
//             <CardTitle>توزيع الكلمات حسب اللغة</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="h-80">
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie
//                     data={languageChartData}
//                     cx="50%"
//                     cy="50%"
//                     labelLine={false}
//                     outerRadius={80}
//                     fill="#8884d8"
//                     dataKey="words"
//                     nameKey="name"
//                     label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//                   >
//                     {languageChartData.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                     ))}
//                   </Pie>
//                   <Tooltip formatter={(value: any) => [value, 'كلمة']} />
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* المشاريع الحديثة */}
//       <Card className="mb-8">
//         <CardHeader>
//           <CardTitle>المشاريع الحديثة</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr>
//                   <th className="text-right py-2 px-4 font-medium">الاسم</th>
//                   <th className="text-right py-2 px-4 font-medium">الحالة</th>
//                   <th className="text-right py-2 px-4 font-medium">الكلمات</th>
//                   <th className="text-right py-2 px-4 font-medium">الفقرات</th>
//                   <th className="text-right py-2 px-4 font-medium">الموعد النهائي</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {stats.recentProjects.map((project) => (
//                   <tr key={project.projectId} className="border-b">
//                     <td className="py-2 px-4">{project.projectName}</td>
//                     <td className="py-2 px-4">{getStatusBadge(project.status)}</td>
//                     <td className="py-2 px-4">{projects.find(p => p.projectId === project.projectId)?.wordCount || 0}</td>
//                     <td className="py-2 px-4">{projects.find(p => p.projectId === project.projectId)?.totalParagraphs || 0}</td>
//                     <td className="py-2 px-4">{new Date(project.deadline).toLocaleDateString('ar-EG')}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* المهام الحديثة */}
//       <Card>
//         <CardHeader>
//           <CardTitle>المهام الحديثة</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr>
//                   <th className="text-right py-2 px-4 font-medium">المشروع</th>
//                   <th className="text-right py-2 px-4 font-medium">المستخدم</th>
//                   <th className="text-right py-2 px-4 font-medium">الدور</th>
//                   <th className="text-right py-2 px-4 font-medium">اللغة المستهدفة</th>
//                   <th className="text-right py-2 px-4 font-medium">الحالة</th>
//                   <th className="text-right py-2 px-4 font-medium">الموعد النهائي</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {assignments.map((assignment) => (
//                   <tr key={assignment.assignmentId} className="border-b">
//                     <td className="py-2 px-4">{assignment.projectName}</td>
//                     <td className="py-2 px-4">{assignment.userName}</td>
//                     <td className="py-2 px-4">{assignment.role}</td>
//                     <td className="py-2 px-4">{assignment.targetLanguageName}</td>
//                     <td className="py-2 px-4">{getStatusBadge(assignment.status)}</td>
//                     <td className="py-2 px-4">
//                       {assignment.isOverdue ? (
//                         <Badge variant="destructive">متأخر</Badge>
//                       ) : (
//                         new Date(assignment.deadline).toLocaleDateString('ar-EG')
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }