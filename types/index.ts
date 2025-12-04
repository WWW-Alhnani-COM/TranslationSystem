// src/types/index.ts - النسخة المصححة والمتوافقة مع OpenAPI

// ==================== الأنواع الأساسية ====================

export interface User {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  userType: string;
  phoneNumber?: string;
  profileImage?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  token?: string;
}
// في ملف src/types/index.ts
export interface ApprovalInfoDto {
  approvalId: number;
  finalText: string;
  decision: string;
  supervisorName: string;
  approvedAt: string;
  comments?: string;  // أضف هذا السطر
}
export interface Language {
  languageId: number;
  languageName: string;
  languageCode: string;
  textDirection: string;
  isActive: boolean;
  projectCount: number;
}

export interface Project {
  projectId: number;
  projectName: string;
  description?: string;
  sourceLanguageId: number;
  sourceLanguageName: string;
  sourceLanguageCode: string;
  targetLanguages?: LanguageInfoDto[];
  createdBy: number;
  creatorName: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  totalParagraphs: number;
  wordCount: number;
  assignmentsCount?: number;
}

export interface Assignment {
  assignmentId: number;
  projectId: number;
  projectName: string;
  userId: number;
  userName: string;
  userEmail: string;
  role: string;
  targetLanguageId: number;
  targetLanguageName: string;
  targetLanguageCode: string;
  status: string;
  assignedAt: string;
  deadline?: string;
  completedAt?: string;
  isOverdue: boolean;
  translationCount: number;
  reviewCount: number;
}

// ==================== أنواع DTOs للاستجابة ====================

export interface UserResponseDto {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  userType: string;
  phoneNumber?: string;
  profileImage?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface LanguageResponseDto {
  languageId: number;
  languageName: string;
  languageCode: string;
  textDirection: string;
  isActive: boolean;
  projectCount: number;
}

export interface ProjectResponseDto {
  projectId: number;
  projectName: string;
  description?: string;
  sourceLanguageId: number;
  sourceLanguageName: string;
  sourceLanguageCode: string;
  createdBy: number;
  creatorName: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  totalParagraphs: number;
  wordCount: number;
  targetLanguages?: LanguageInfoDto[];
}

export interface AssignmentResponseDto {
  assignmentId: number;
  projectId: number;
  projectName: string;
  userId: number;
  userName: string;
  userEmail: string;
  role: string;
  targetLanguageId: number;
  targetLanguageName: string;
  targetLanguageCode: string;
  status: string;
  assignedAt: string;
  deadline?: string;
  completedAt?: string;
  isOverdue: boolean;
  translationCount: number;
  reviewCount: number;
}

export interface ParagraphResponseDto {
  paragraphId: number;
  projectId: number;
  projectName: string;
  originalText: string;
  paragraphType?: string;
  position: number;
  wordCount: number;
  createdAt: string;
  translations?: TranslationInfoDto[];
}

export interface TranslationResponseDto {
  translationId: number;
  paragraphId: number;
  originalText: string;
  assignmentId: number;
  translatorName: string;
  targetLanguageName: string;
  translatedText: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  draftCount: number;
  finalWordCount: number;
  reviews?: ReviewInfoDto[];
}

export interface ReviewResponseDto {
  reviewId: number;
  translationId: number;
  originalText: string;
  translatedText: string;
  reviewerAssignmentId: number;
  reviewerName: string;
  reviewedText: string;
  changesMade?: string;
  qualityScore?: number;
  comments?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  approvals?: ApprovalInfoDto[];
  projectName?: string | null;
  targetLanguageName?: string | null;
  translatorName?: string | null;
}

export interface ReviewWithProjectInfo extends ReviewResponseDto {
  projectName?: string | null;
  translatorName?: string | null;
  targetLanguageName?: string | null;
}


export interface ApprovalResponseDto {
  approvalId: number;
  reviewId: number;
  supervisorAssignmentId: number;
  supervisorName: string;
  finalText: string;
  selectedVersion: string;
  decision: string;
  comments?: string;
  approvedAt: string;
  projectName: string;
  paragraphText: string;
}

export interface NotificationResponseDto {
  notificationId: number;
  userId: number;
  title: string;
  message: string;
  relatedType?: string;
  relatedId?: number;
  isRead: boolean;
  createdAt: string;
}

// ==================== أنواع المعلومات المساعدة ====================

export interface LanguageInfoDto {
  languageId: number;
  languageName: string;
  languageCode: string;
  textDirection: string;
  isActive?: boolean;
}

export interface TranslationInfoDto {
  translationId: number;
  translatedText: string;
  status: string;
  translatorName: string;
  createdAt: string;
  targetLanguageName: string;
}

export interface ReviewInfoDto {
  reviewId: number;
  reviewedText: string;
  qualityScore?: number;
  status: string;
  reviewerName: string;
  createdAt: string;
}



// ==================== أنواع DTOs للإنشاء والتحديث ====================

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: string;
  phoneNumber?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImage?: string;
  isActive?: boolean;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CreateProjectDto {
  projectName: string;
  description?: string;
  sourceLanguageId: number;
  createdBy: number;
  targetLanguageIds?: number[];
}

export interface UpdateProjectDto {
  projectName?: string;
  description?: string;
  status?: string;
}

export interface CreateAssignmentDto {
  projectId: number;
  userId: number;
  role: string;
  targetLanguageId: number;
  deadline?: string;
}

export interface UpdateAssignmentDto {
  status?: string;
  deadline?: string;
  completedAt?: string;
}

export interface CreateLanguageDto {
  languageName: string;
  languageCode: string;
  textDirection: string;
}

export interface UpdateLanguageDto {
  languageName?: string;
  languageCode?: string;
  textDirection?: string;
  isActive?: boolean;
}

export interface CreateNotificationDto {
  userId: number;
  title: string;
  message: string;
  relatedType?: string;
  relatedId?: number;
}

export interface CreateParagraphDto {
  projectId: number;
  originalText: string;
  paragraphType?: string;
  position?: number;
  wordCount?: number;
}

export interface UpdateParagraphDto {
  originalText?: string;
  paragraphType?: string;
  position?: number;
  wordCount?: number;
}

export interface AutoSplitRequest {
  text?: string;
}

export interface CreateTranslationDto {
  paragraphId: number;
  assignmentId: number;
  translatedText: string;
  status?: string;
}

export interface UpdateTranslationDto {
  translatedText?: string;
  status?: string;
  finalWordCount?: number;
}

export interface CreateReviewDto {
  translationId: number;
  reviewerAssignmentId: number;
  reviewedText: string;
  changesMade?: string;
  qualityScore?: number;
  comments?: string;
  status?: string;
}

export interface UpdateReviewDto {
  reviewedText?: string;
  changesMade?: string;
  qualityScore?: number;
  comments?: string;
  status?: string;
}

export interface CreateApprovalDto {
  reviewId: number;
  supervisorAssignmentId: number;
  finalText: string;
  selectedVersion: string;
  decision: string;
  comments?: string;
}

// ==================== أنواع الإحصائيات ====================

export interface DashboardStatsDto {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalUsers: number;
  activeUsers: number;
  totalTranslations: number;
  pendingTranslations: number;
  completedTranslations: number;
  totalWordsTranslated: number;
  averageQualityScore: number;
  recentProjects?: ProjectProgressDto[];
  languageStats?: LanguageStatsDto[];
}

export interface ProjectStatsDto {
  projectId: number;
  projectName: string;
  totalParagraphs: number;
  translatedParagraphs: number;
  reviewedParagraphs: number;
  approvedParagraphs: number;
  pendingAssignments: number;
  completedAssignments: number;
  progressPercentage: number;
}

export interface LanguageStatsDto {
  languageName: string;
  projectCount: number;
  wordCount: number;
  averageQuality: number;
}

export interface UserPerformanceDto {
  userId: number;
  userName: string;
  userType: string;
  completedProjects: number;
  completedTranslations: number;
  completedReviews: number;
  averageQualityScore: number;
  totalWordsTranslated: number;
  lastActivity: string;
}

export interface ProjectProgressDto {
  projectId: number;
  projectName: string;
  progressPercentage: number;
  status: string;
  deadline: string;
}

// ==================== أنواع الاستجابة العامة ====================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  timestamp: string;
}

// ==================== أنواع القوائم ====================

export type UserResponseDtoListApiResponse = ApiResponse<UserResponseDto[]>;
export type LanguageResponseDtoListApiResponse = ApiResponse<LanguageResponseDto[]>;
export type ProjectResponseDtoListApiResponse = ApiResponse<ProjectResponseDto[]>;
export type AssignmentResponseDtoListApiResponse = ApiResponse<AssignmentResponseDto[]>;
export type ParagraphResponseDtoListApiResponse = ApiResponse<ParagraphResponseDto[]>;
export type TranslationResponseDtoListApiResponse = ApiResponse<TranslationResponseDto[]>;
export type ReviewResponseDtoListApiResponse = ApiResponse<ReviewResponseDto[]>;
export type ApprovalResponseDtoListApiResponse = ApiResponse<ApprovalResponseDto[]>;
export type NotificationResponseDtoListApiResponse = ApiResponse<NotificationResponseDto[]>;
export type ProjectProgressDtoListApiResponse = ApiResponse<ProjectProgressDto[]>;
export type LanguageStatsDtoListApiResponse = ApiResponse<LanguageStatsDto[]>;
export type UserPerformanceDtoListApiResponse = ApiResponse<UserPerformanceDto[]>;

// ==================== أنواع الاستجابة الفردية ====================

export type UserResponseDtoApiResponse = ApiResponse<UserResponseDto>;
export type LanguageResponseDtoApiResponse = ApiResponse<LanguageResponseDto>;
export type ProjectResponseDtoApiResponse = ApiResponse<ProjectResponseDto>;
export type AssignmentResponseDtoApiResponse = ApiResponse<AssignmentResponseDto>;
export type ParagraphResponseDtoApiResponse = ApiResponse<ParagraphResponseDto>;
export type TranslationResponseDtoApiResponse = ApiResponse<TranslationResponseDto>;
export type ReviewResponseDtoApiResponse = ApiResponse<ReviewResponseDto>;
export type ApprovalResponseDtoApiResponse = ApiResponse<ApprovalResponseDto>;
export type NotificationResponseDtoApiResponse = ApiResponse<NotificationResponseDto>;
export type ProjectStatsDtoApiResponse = ApiResponse<ProjectStatsDto>;
export type DashboardStatsDtoApiResponse = ApiResponse<DashboardStatsDto>;
export type BooleanApiResponse = ApiResponse<boolean>;

// ==================== أنواع الحالات (اختيارية - للاستخدام الداخلي) ====================

export type AssignmentRole = 'Translator' | 'Reviewer' | 'Supervisor' | 'Manager' | 'DataEntry';
export type AssignmentStatus = 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';
export type TranslationStatus = 'Draft' | 'InProgress' | 'Submitted' | 'Completed' | 'Approved' | 'Rejected';
export type ProjectStatus = 'Draft' | 'Active' | 'InProgress' | 'Completed' | 'Cancelled';
export type ReviewStatus = 'Pending' | 'InProgress' | 'Completed' | 'Approved' | 'Rejected';
export type LanguageDirection = 'ltr' | 'rtl';
