// // app/supervisor/approvals/page.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { apiClient } from "@/lib/api-client";
// import { toast } from "@/components/ui/use-toast";
// import {
//   ReviewResponseDto,
//   AssignmentResponseDto,
//   CreateApprovalDto,
//   TranslationResponseDto,
//   CreateNotificationDto,
//   ProjectResponseDto,
// } from "@/types";
// import { format } from "date-fns";
// import { ar } from "date-fns/locale";
// import { useAuth } from "@/context/AuthContext";

// export default function SupervisorApprovalsPage() {
//   const [reviews, setReviews] = useState<ReviewResponseDto[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [submittingIds, setSubmittingIds] = useState<number[]>([]);

//   const auth = useAuth();
//   const user = auth.user;
//   const authLoading = auth.loading !== undefined ? auth.loading : false;
//   const router = useRouter();

//   useEffect(() => {
//     const fetchAllReviewsAndFilter = async () => {
//       if (authLoading) return;
//       if (!user || user.userType !== "Supervisor") {
//         router.push("/login");
//         return;
//       }

//       try {
//         setLoading(true);
//         // ✅ جلب جميع المراجعات
//         const  ReviewResponseDto[] = await apiClient.get("Reviews");
//         // ✅ فلترة المراجعات التي بحاجة إلى موافقة
//         const pending = data.filter(
//           (review) =>
//             review.status === "Completed" &&
//             (!review.approvals || review.approvals.length === 0)
//         );
//         setReviews(pending);
//       } catch (err) {
//         console.error("فشل جلب المراجعات:", err);
//         setError((err as Error).message || "فشل في تحميل المراجعات");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAllReviewsAndFilter();
//   }, [user, authLoading, router]);

//   // === دالة مساعدة: جلب معلومات المشروع واللغة من المراجعة ===
//   const getProjectAndLanguageInfo = async (review: ReviewResponseDto) => {
//     const translation: TranslationResponseDto = await apiClient.get(`Translations/${review.translationId}`);
//     const assignment: AssignmentResponseDto = await apiClient.get(`Assignments/${translation.assignmentId}`);
//     return { assignment, projectId: assignment.projectId, targetLanguageId: assignment.targetLanguageId };
//   };

//   // === دالة مساعدة: جلب منشئ المشروع ===
//   const getProjectCreator = async (projectId: number) => {
//     const project: ProjectResponseDto = await apiClient.get(`Projects/${projectId}`);
//     return project.createdBy; // userId
//   };

//   // === دالة مساعدة: جلب المستخدم من مهمة المراجع ===
//   const getReviewerUserId = async (reviewerAssignmentId: number) => {
//     const assignment: AssignmentResponseDto = await apiClient.get(`Assignments/${reviewerAssignmentId}`);
//     return assignment.userId; // userId
//   };

//   // === دالة مساعدة: إرسال إشعار ===
//   const sendNotification = async (notification: CreateNotificationDto) => {
//     try {
//       await apiClient.post("Notifications", notification);
//     } catch (err) {
//       console.error("فشل إرسال الإشعار:", err);
//       // لا نوقف العملية إذا فشل الإشعار فقط
//     }
//   };

//   // === الموافقة مع إرسال الإشعارات ===
//   const handleApprove = async (review: ReviewResponseDto) => {
//     if (!user) return;
//     setSubmittingIds((prev) => [...prev, review.reviewId]);

//     try {
//       const { assignment, projectId } = await getProjectAndLanguageInfo(review);
//       const supervisorAssignmentId = await (async () => {
//         const assignments: AssignmentResponseDto[] = await apiClient.get(`Assignments/user/${user.userId}`);
//         return assignments.find(
//           (a) =>
//             a.projectId === projectId &&
//             a.targetLanguageId === assignment.targetLanguageId &&
//             a.role === "Supervisor" &&
//             a.status !== "Cancelled"
//         )?.assignmentId;
//       })();

//       if (!supervisorAssignmentId) throw new Error("لا توجد مهمة مشرف لهذا المشروع واللغة");

//       // 1. إنشاء الموافقة
//       const approvalData: CreateApprovalDto = {
//         reviewId: review.reviewId,
//         supervisorAssignmentId,
//         finalText: review.reviewedText || review.translatedText || "",
//         selectedVersion: "Reviewed",
//         decision: "Accepted",
//         comments: "",
//       };

//       await apiClient.post("Approvals", approvalData);

//       // 2. إرسال إشعار للمراجع
//       const reviewerUserId = await getReviewerUserId(review.reviewerAssignmentId);
//       if (reviewerUserId) {
//         const reviewerNotification: CreateNotificationDto = {
//           userId: reviewerUserId,
//           title: "تم اعتماد مراجعتك",
//           message: `تم اعتماد المراجعة للفقرة في المشروع "${assignment.projectName}".`,
//           relatedType: "Approval",
//           relatedId: approvalData.reviewId,
//         };
//         await sendNotification(reviewerNotification);
//       }

//       // 3. إرسال إشعار لمُدخل البيانات (منشئ المشروع)
//       const projectCreatorId = await getProjectCreator(projectId);
//       if (projectCreatorId) {
//         const dataEntryNotification: CreateNotificationDto = {
//           userId: projectCreatorId,
//           title: "تم اعتماد جزء من مشروع",
//           message: `تم اعتماد مراجعة لمشروع "${assignment.projectName}" من قبل المشرف.`,
//           relatedType: "Approval",
//           relatedId: approvalData.reviewId,
//         };
//         await sendNotification(dataEntryNotification);
//       }

//       toast({ title: "تمت الموافقة وتم إرسال الإشعارات" });
//       setReviews((prev) => prev.filter((r) => r.reviewId !== review.reviewId));
//     } catch (err) {
//       toast({
//         variant: "destructive",
//         title: "خطأ",
//         description: (err as Error).message || "فشل في الموافقة",
//       });
//     } finally {
//       setSubmittingIds((prev) => prev.filter((id) => id !== review.reviewId));
//     }
//   };

//   // === الرفض مع إرسال الإشعارات ===
//   const handleReject = async (review: ReviewResponseDto) => {
//     if (!user) return;
//     setSubmittingIds((prev) => [...prev, review.reviewId]);

//     try {
//       const { assignment, projectId } = await getProjectAndLanguageInfo(review);
//       const supervisorAssignmentId = await (async () => {
//         const assignments: AssignmentResponseDto[] = await apiClient.get(`Assignments/user/${user.userId}`);
//         return assignments.find(
//           (a) =>
//             a.projectId === projectId &&
//             a.targetLanguageId === assignment.targetLanguageId &&
//             a.role === "Supervisor" &&
//             a.status !== "Cancelled"
//         )?.assignmentId;
//       })();

//       if (!supervisorAssignmentId) throw new Error("لا توجد مهمة مشرف لهذا المشروع واللغة");

//       // 1. إنشاء الموافقة (برفض)
//       const approvalData: CreateApprovalDto = {
//         reviewId: review.reviewId,
//         supervisorAssignmentId,
//         finalText: review.reviewedText || review.translatedText || "",
//         selectedVersion: "Original",
//         decision: "Rejected",
//         comments: "مرفوض من قبل المشرف",
//       };

//       await apiClient.post("Approvals", approvalData);

//       // 2. إشعار للمراجع
//       const reviewerUserId = await getReviewerUserId(review.reviewerAssignmentId);
//       if (reviewerUserId) {
//         const reviewerNotification: CreateNotificationDto = {
//           userId: reviewerUserId,
//           title: "تم رفض مراجعتك",
//           message: `تم رفض المراجعة للفقرة في المشروع "${assignment.projectName}". السبب: ${approvalData.comments}`,
//           relatedType: "Approval",
//           relatedId: approvalData.reviewId,
//         };
//         await sendNotification(reviewerNotification);
//       }

//       // 3. إشعار لمُدخل البيانات
//       const projectCreatorId = await getProjectCreator(projectId);
//       if (projectCreatorId) {
//         const dataEntryNotification: CreateNotificationDto = {
//           userId: projectCreatorId,
//           title: "تم رفض جزء من مشروع",
//           message: `تم رفض مراجعة لمشروع "${assignment.projectName}" من قبل المشرف.`,
//           relatedType: "Approval",
//           relatedId: approvalData.reviewId,
//         };
//         await sendNotification(dataEntryNotification);
//       }

//       toast({ title: "تم الرفض وتم إرسال الإشعارات" });
//       setReviews((prev) => prev.filter((r) => r.reviewId !== review.reviewId));
//     } catch (err) {
//       toast({
//         variant: "destructive",
//         title: "خطأ",
//         description: (err as Error).message || "فشل في الرفض",
//       });
//     } finally {
//       setSubmittingIds((prev) => prev.filter((id) => id !== review.reviewId));
//     }
//   };

//   if (authLoading) {
//     return (
//       <div className="container mx-auto py-10 flex justify-center items-center">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="container mx-auto py-10 text-center">
//         <h2 className="text-2xl font-bold text-destructive">خطأ</h2>
//         <p className="text-muted-foreground mt-2">{error}</p>
//         <Button className="mt-4" onClick={() => router.push("/login")}>
//           العودة إلى تسجيل الدخول
//         </Button>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto py-10">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold">المراجعات بانتظار الموافقة</h1>
//         <p className="text-muted-foreground mt-2">راجع واعتمد الترجمات التي أكملها المراجعون.</p>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle>قائمة المراجعات</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {loading ? (
//             <p className="text-muted-foreground text-center py-8">جارٍ التحميل...</p>
//           ) : reviews.length === 0 ? (
//             <p className="text-muted-foreground text-center py-8">
//               لا توجد مراجعات بانتظار الموافقة.
//             </p>
//           ) : (
//             <div className="overflow-x-auto">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead className="text-right">النص الأصلي</TableHead>
//                     <TableHead className="text-right">النص المراجَع</TableHead>
//                     <TableHead className="text-right">المراجع</TableHead>
//                     <TableHead className="text-right">التقييم</TableHead>
//                     <TableHead className="text-right">التاريخ</TableHead>
//                     <TableHead className="text-center w-32">الإجراءات</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {reviews.map((review) => (
//                     <TableRow key={review.reviewId}>
//                       <TableCell className="max-w-xs truncate">
//                         {review.originalText?.substring(0, 50) || "–"}
//                       </TableCell>
//                       <TableCell className="max-w-xs truncate">
//                         {review.reviewedText?.substring(0, 50) || "–"}
//                       </TableCell>
//                       <TableCell>{review.reviewerName || "–"}</TableCell>
//                       <TableCell>
//                         {review.qualityScore ? (
//                           <Badge variant="secondary">{review.qualityScore}/10</Badge>
//                         ) : (
//                           "–"
//                         )}
//                       </TableCell>
//                       <TableCell>
//                         {format(new Date(review.createdAt), "dd/MM/yyyy HH:mm", { locale: ar })}
//                       </TableCell>
//                       <TableCell className="text-center">
//                         <div className="flex justify-center gap-2">
//                           <Button
//                             size="sm"
//                             variant="default"
//                             onClick={() => handleApprove(review)}
//                             disabled={submittingIds.includes(review.reviewId)}
//                           >
//                             ✅
//                           </Button>
//                           <Button
//                             size="sm"
//                             variant="destructive"
//                             onClick={() => handleReject(review)}
//                             disabled={submittingIds.includes(review.reviewId)}
//                           >
//                             ❌
//                           </Button>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }