"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import type { ReviewResponseDto } from "@/types";
import {
  MoreHorizontal,
  Search,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Star,
  User,
  Filter,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export default function ReviewerReviewsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (user?.userId) {
      fetchReviews();
    }
  }, [user]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(`Reviews/reviewer/${user?.userId}`);
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في تحميل المراجعات",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = 
      review.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.targetLanguageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.translatorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewId.toString().includes(searchTerm);

    const matchesStatus = 
      statusFilter === "all" || 
      review.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "Pending":
        return <Badge variant="outline">قيد الانتظار</Badge>;
      case "In Progress":
        return <Badge variant="secondary">قيد المراجعة</Badge>;
      case "Submitted":
        return <Badge variant="default">مُقدَّمة</Badge>;
      case "Approved":
        return <Badge variant="success">معتمدة</Badge>;
      case "Rejected":
        return <Badge variant="destructive">مرفوضة</Badge>;
      default:
        return <Badge>{status || "غير معروف"}</Badge>;
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Submitted":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "In Progress":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "Pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "Rejected":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleViewDetails = (reviewId: number) => {
    router.push(`/reviewer/reviews/${reviewId}`);
  };

  const handleEditReview = (reviewId: number) => {
    router.push(`/reviewer/reviews/${reviewId}/edit`);
  };

  const getQualityStars = (score: number | null | undefined) => {
    if (!score) return null;
    return (
      <div className="flex items-center gap-1">
        <Star className="h-3 w-3 text-yellow-500 fill-current" />
        <span className="text-sm font-medium">{score}/10</span>
      </div>
    );
  };

  const statusCounts = {
    all: reviews.length,
    pending: reviews.filter(r => r.status === "Pending").length,
    inProgress: reviews.filter(r => r.status === "In Progress").length,
    submitted: reviews.filter(r => r.status === "Submitted").length,
    approved: reviews.filter(r => r.status === "Approved").length,
    rejected: reviews.filter(r => r.status === "Rejected").length,
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">مراجعاتي</h1>
          <p className="text-muted-foreground mt-1">إدارة وتتبع جميع مراجعاتك</p>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <StatCard
          label="الكل"
          value={statusCounts.all}
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
        />
        <StatCard
          label="قيد الانتظار"
          value={statusCounts.pending}
          active={statusFilter === "pending"}
          onClick={() => setStatusFilter("pending")}
          variant="outline"
        />
        <StatCard
          label="قيد المراجعة"
          value={statusCounts.inProgress}
          active={statusFilter === "in progress"}
          onClick={() => setStatusFilter("in progress")}
          variant="secondary"
        />
        <StatCard
          label="مُقدَّمة"
          value={statusCounts.submitted}
          active={statusFilter === "submitted"}
          onClick={() => setStatusFilter("submitted")}
          variant="default"
        />
        <StatCard
          label="معتمدة"
          value={statusCounts.approved}
          active={statusFilter === "approved"}
          onClick={() => setStatusFilter("approved")}
          variant="success"
        />
        <StatCard
          label="مرفوضة"
          value={statusCounts.rejected}
          active={statusFilter === "rejected"}
          onClick={() => setStatusFilter("rejected")}
          variant="destructive"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>قائمة المراجعات</CardTitle>
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="بحث في المراجعات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 ml-2" />
                    ترتيب
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                    الكل
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                    قيد الانتظار
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("in progress")}>
                    قيد المراجعة
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("submitted")}>
                    مُقدَّمة
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">لا توجد مراجعات</h3>
              <p className="text-muted-foreground mt-1">
                {searchTerm || statusFilter !== "all" 
                  ? "لم يتم العثور على مراجعات تطابق البحث" 
                  : "لا توجد مراجعات مخصصة لك حالياً"
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المراجعة</TableHead>
                  <TableHead>المشروع</TableHead>
                  <TableHead>المترجم</TableHead>
                  <TableHead>اللغة</TableHead>
                  <TableHead>درجة الجودة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead className="w-[80px]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.reviewId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(review.status)}
                        <div>
                          <div className="font-medium">مراجعة #{review.reviewId}</div>
                          <div className="text-sm text-muted-foreground">
                            الترجمة #{review.translationId}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[150px] truncate" title={review.projectName || ""}>
                        {review.projectName || "غير محدد"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{review.translatorName || "غير محدد"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {review.targetLanguageName || "غير محدد"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getQualityStars(review.qualityScore)}
                    </TableCell>
                    <TableCell>{getStatusBadge(review.status)}</TableCell>
                    <TableCell>
                      {new Date(review.createdAt).toLocaleDateString("ar-EG")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(review.reviewId)}>
                            <Eye className="h-4 w-4 ml-2" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          {(review.status === "Pending" || review.status === "In Progress") && (
                            <DropdownMenuItem onClick={() => handleEditReview(review.reviewId)}>
                              <FileText className="h-4 w-4 ml-2" />
                              تعديل المراجعة
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// مكون البطاقة الإحصائية
const StatCard = ({ 
  label, 
  value, 
  active, 
  onClick, 
  variant = "default" 
}: { 
  label: string; 
  value: number; 
  active: boolean;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary" | "success" | "destructive";
}) => (
  <Card 
    className={`cursor-pointer transition-all ${
      active ? "ring-2 ring-primary" : "hover:shadow-md"
    }`}
    onClick={onClick}
  >
    <CardContent className="p-4 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </CardContent>
  </Card>
);