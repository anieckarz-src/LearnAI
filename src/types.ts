// User types
export type UserRole = "admin" | "instructor" | "student";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_blocked: boolean;
  created_at: string;
  last_login: string | null;
}

// Course types
export type CourseStatus = "draft" | "published" | "archived";

export interface Course {
  id: string;
  title: string;
  description: string | null;
  instructor_id: string;
  status: CourseStatus;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseWithInstructor extends Course {
  instructor: User;
  enrollment_count?: number;
}

// Lesson types
export type LessonMaterialType = "pdf" | "video" | "image";

export interface LessonMaterial {
  id: string;
  type: LessonMaterialType;
  url: string;
  name: string;
  size: number;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  order_index: number;
  created_at: string;
  materials?: LessonMaterial[];
}

// Quiz types
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  questions: QuizQuestion[];
  ai_generated: boolean;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  answers: Record<string, number>;
  completed_at: string;
}

// Report types
export type ContentType = "course" | "lesson" | "comment";
export type ReportStatus = "pending" | "reviewed" | "resolved";

export interface ContentReport {
  id: string;
  reported_by: string;
  content_type: ContentType;
  content_id: string;
  reason: string;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface ContentReportWithUsers extends ContentReport {
  reporter: User;
  reviewer: User | null;
}

// System settings types
export interface SystemSettings {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
  updated_by: string | null;
}

// Enrollment types
export interface CourseEnrollment {
  id: string;
  course_id: string;
  user_id: string;
  enrolled_at: string;
  completed_at: string | null;
}

// Stats types
export interface DashboardStats {
  total_users: number;
  new_users_this_month: number;
  total_courses: number;
  published_courses: number;
  draft_courses: number;
  total_enrollments: number;
  active_students: number;
  total_quizzes: number;
  total_quiz_attempts: number;
  avg_quiz_score: number;
  pending_reports: number;
}

export interface ActivityData {
  date: string;
  users: number;
  enrollments: number;
  quiz_attempts: number;
}

export interface CourseStats {
  course_id: string;
  title: string;
  enrollments: number;
  completions: number;
  avg_score: number;
}

// Audit log types
export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Filter and pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface UserFilters extends PaginationParams {
  role?: UserRole;
  search?: string;
  is_blocked?: boolean;
}

export interface CourseFilters extends PaginationParams {
  status?: CourseStatus;
  instructor_id?: string;
  search?: string;
}

export interface ReportFilters extends PaginationParams {
  status?: ReportStatus;
  content_type?: ContentType;
}

// Course form types
export interface CourseFormData {
  title: string;
  description: string;
  instructor_id: string;
  status: CourseStatus;
  thumbnail_url: string;
}

// Lesson form types
export interface LessonFormData {
  title: string;
  content: string;
  materials: LessonMaterial[];
}

// Quiz form types
export interface QuizFormData {
  lesson_id: string;
  title: string;
  questions: QuizQuestion[];
  ai_generated?: boolean;
}
