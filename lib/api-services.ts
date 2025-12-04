// src/lib/api-services.ts
import { apiClient } from './api-client';
import * as types from '@/types';

// دوال الموافقات (Approvals)
export const approvalService = {
  create: (approvalData: types.CreateApprovalDto) =>
    apiClient.post('Approvals', approvalData),

  getById: (id: number) =>
    apiClient.get(`Approvals/${id}`),

  delete: (id: number) =>
    apiClient.delete(`Approvals/${id}`),

  getByProject: (projectId: number) =>
    apiClient.get(`Approvals/project/${projectId}`),

  getBySupervisor: (supervisorId: number) =>
    apiClient.get(`Approvals/supervisor/${supervisorId}`),

  approve: (id: number) =>
    apiClient.patch(`Approvals/${id}/approve`),

  reject: (id: number) =>
    apiClient.patch(`Approvals/${id}/reject`),
};

// دوال المهام (Assignments)
export const assignmentService = {
  create: (assignmentData: types.CreateAssignmentDto) =>
    apiClient.post('Assignments', assignmentData),

  getAll: () =>
    apiClient.get('Assignments'),

  getById: (id: number) =>
    apiClient.get(`Assignments/${id}`),

  update: (id: number, assignmentData: types.UpdateAssignmentDto) =>
    apiClient.put(`Assignments/${id}`, assignmentData),

  delete: (id: number) =>
    apiClient.delete(`Assignments/${id}`),

  getByUser: (userId: number) =>
    apiClient.get(`Assignments/user/${userId}`),

  getByProject: (projectId: number) =>
    apiClient.get(`Assignments/project/${projectId}`),
  

  getByRole: (role: string) =>
    apiClient.get(`Assignments/role/${role}`),

  updateStatus: (id: number, status: string) =>
    apiClient.patch(`Assignments/${id}/status/${status}`),
};

// دوال اللغات (Languages)
export const languageService = {
  create: (languageData: types.CreateLanguageDto) =>
    apiClient.post('Languages', languageData),

  getAll: () =>
    apiClient.get('Languages'),

  getActive: () =>
    apiClient.get('Languages/active'),

  getById: (id: number) =>
    apiClient.get(`Languages/${id}`),

  update: (id: number, languageData: types.UpdateLanguageDto) =>
    apiClient.put(`Languages/${id}`, languageData),

  delete: (id: number) =>
    apiClient.delete(`Languages/${id}`),

  activate: (id: number) =>
    apiClient.patch(`Languages/${id}/activate`),

  deactivate: (id: number) =>
    apiClient.patch(`Languages/${id}/deactivate`),
};

// دوال الإشعارات (Notifications)
export const notificationService = {
  create: (notificationData: types.CreateNotificationDto) =>
    apiClient.post('Notifications', notificationData),

  getById: (id: number) =>
    apiClient.get(`Notifications/${id}`),

  delete: (id: number) =>
    apiClient.delete(`Notifications/${id}`),

  getByUser: (userId: number) =>
    apiClient.get(`Notifications/user/${userId}`),

  getUnreadByUser: (userId: number) =>
    apiClient.get(`Notifications/user/${userId}/unread`),

  markAsRead: (id: number) =>
    apiClient.patch(`Notifications/${id}/read`),

  markAllAsRead: (userId: number) =>
    apiClient.patch(`Notifications/user/${userId}/read-all`),
};

// دوال الفقرات (Paragraphs)
export const paragraphService = {
  create: (paragraphData: types.CreateParagraphDto) =>
    apiClient.post('Paragraphs', paragraphData),

  uploadFile: (projectId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`Paragraphs/upload/${projectId}`, formData);
  },

  autoSplit: (projectId: number, autoSplitData: types.AutoSplitRequest) =>
    apiClient.post(`Paragraphs/auto-split/${projectId}`, autoSplitData),

  getById: (id: number) =>
    apiClient.get(`Paragraphs/${id}`),

  update: (id: number, paragraphData: types.UpdateParagraphDto) =>
    apiClient.put(`Paragraphs/${id}`, paragraphData),

  delete: (id: number) =>
    apiClient.delete(`Paragraphs/${id}`),

  getByProject: (projectId: number) =>
    apiClient.get(`Paragraphs/project/${projectId}`),

  updatePosition: (id: number, newPosition: number) =>
    apiClient.patch(`Paragraphs/${id}/position/${newPosition}`),
};

// دوال المشاريع (Projects)
export const projectService = {
  getById: (id: number) =>
    apiClient.get(`Projects/${id}`),

  update: (id: number, projectData: types.UpdateProjectDto) =>
    apiClient.put(`Projects/${id}`, projectData),

  delete: (id: number) =>
    apiClient.delete(`Projects/${id}`),
  


  getAll: () =>
    apiClient.get('Projects'), // ← هذه هي الإضافة الجديدة

  create: (projectData: types.CreateProjectDto) =>
    apiClient.post('Projects', projectData),

  getByStatus: (status: string) =>
    apiClient.get(`Projects/status/${status}`),

  getByUser: (userId: number) =>
    apiClient.get(`Projects/user/${userId}`),

  updateStatus: (id: number, status: string) =>
    apiClient.patch(`Projects/${id}/status/${status}`),

  addTargetLanguage: (id: number, languageId: number) =>
    apiClient.post(`Projects/${id}/target-languages/${languageId}`),

  removeTargetLanguage: (id: number, languageId: number) =>
    apiClient.delete(`Projects/${id}/target-languages/${languageId}`),

  getStats: (id: number) =>
    apiClient.get(`Projects/${id}/stats`),
};

// دوال المراجعات (Reviews)
export const reviewService = {
  getAll: () =>
    apiClient.get('Reviews'),

  create: (reviewData: types.CreateReviewDto) =>
    apiClient.post('Reviews', reviewData),

  getPending: () =>
    apiClient.get('Reviews/pending'),

  getById: (id: number) =>
    apiClient.get(`Reviews/${id}`),

  update: (id: number, reviewData: types.UpdateReviewDto) =>
    apiClient.put(`Reviews/${id}`, reviewData),

  delete: (id: number) =>
    apiClient.delete(`Reviews/${id}`),

  getByTranslation: (translationId: number) =>
    apiClient.get(`Reviews/translation/${translationId}`),

  getByReviewer: (reviewerId: number) =>
    apiClient.get(`Reviews/reviewer/${reviewerId}`),

  submit: (id: number) =>
    apiClient.patch(`Reviews/${id}/submit`),
};

// دوال الإحصائيات (Statistics)
export const statisticsService = {
  getDashboard: () =>
    apiClient.get('Statistics/dashboard'),

  getUserDashboard: (userId: number) =>
    apiClient.get(`Statistics/dashboard/user/${userId}`),

  getProjectsProgress: () =>
    apiClient.get('Statistics/projects/progress'),

  getLanguagesStats: () =>
    apiClient.get('Statistics/languages'),

  getUsersPerformance: () =>
    apiClient.get('Statistics/users/performance'),
};

// دوال الترجمات (Translations)
export const translationService = {
  create: (translationData: types.CreateTranslationDto) =>
    apiClient.post('Translations', translationData),

  getById: (id: number) =>
    apiClient.get(`Translations/${id}`),

  update: (id: number, translationData: types.UpdateTranslationDto) =>
    apiClient.put(`Translations/${id}`, translationData),

  delete: (id: number) =>
    apiClient.delete(`Translations/${id}`),

  getByAssignment: (assignmentId: number) =>
    apiClient.get(`Translations/assignment/${assignmentId}`),

  getByParagraph: (paragraphId: number) =>
    apiClient.get(`Translations/paragraph/${paragraphId}`),

  submit: (id: number) =>
    apiClient.patch(`Translations/${id}/submit`),

  saveDraft: (id: number, draftText: string) =>
    apiClient.patch(`Translations/${id}/draft`, draftText),
};

// دوال المستخدمين (Users)
export const userService = {
  register: (userData: types.CreateUserDto) =>
    apiClient.post('Users/register', userData),

  login: (credentials: types.LoginDto) =>
    apiClient.post('Users/login', credentials),

  getAll: () =>
    apiClient.get('Users'),

  getById: (id: number) =>
    apiClient.get(`Users/${id}`),

  update: (id: number, userData: types.UpdateUserDto) =>
    apiClient.put(`Users/${id}`, userData),

  delete: (id: number) =>
    apiClient.delete(`Users/${id}`),

  getByType: (userType: string) =>
    apiClient.get(`Users/type/${userType}`),

  activate: (id: number) =>
    apiClient.patch(`Users/${id}/activate`),

  deactivate: (id: number) =>
    apiClient.patch(`Users/${id}/deactivate`),

  changePassword: (id: number, passwordData: types.ChangePasswordDto) =>
    apiClient.post(`Users/${id}/change-password`, passwordData),
};

// دالة اختبار الاتصال
export const testService = {
  testConnection: () =>
    apiClient.get('Test/connection'),
};

// تصدير جميع الخدمات ككائن واحد
export default {
  approvals: approvalService,
  assignments: assignmentService,
  languages: languageService,
  notifications: notificationService,
  paragraphs: paragraphService,
  projects: projectService,
  reviews: reviewService,
  statistics: statisticsService,
  translations: translationService,
  users: userService,
  test: testService,
};
