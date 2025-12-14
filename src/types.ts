// User types
export type UserRole = "admin" | "user";

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
  status: CourseStatus;
  thumbnail_url: string | null;
  lesson_access_mode?: "sequential" | "all_access";
  created_at: string;
  updated_at: string;
  price?: number | null;
  stripe_product_id?: string | null;
  stripe_price_id?: string | null;
}

export interface CourseWithPrice extends Course {
  price: number | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
}

export interface CourseWithProgress extends Course {
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
  lesson_access_mode: "sequential" | "all_access";
  next_lesson_id?: string | null;
  enrolled_at?: string;
  enrollment_count?: number;
}

// Module types
export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface ModuleWithLessons extends Module {
  lessons: LessonWithProgress[];
}

// Lesson types
export type LessonType = "quiz" | "content";

export type LessonFileType = "pdf" | "image" | "document";

export interface LessonFile {
  id: string;
  type: LessonFileType;
  url: string;
  name: string;
  size: number;
}

// Legacy type for backward compatibility
export type LessonMaterialType = "pdf" | "image";

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
  module_id: string;
  title: string;
  type: LessonType;
  content: string | null;
  video_url?: string | null; // External video URL (Vimeo, YouTube)
  files: LessonFile[];
  order_index: number;
  created_at: string;
  // Legacy field for backward compatibility
  materials?: LessonMaterial[];
}

export interface LessonWithProgress extends Lesson {
  completed: boolean;
  completed_at?: string | null;
  is_accessible: boolean;
  quiz?: Quiz; // Included if type is 'quiz'
}

// Quiz lesson - must have associated quiz
export interface QuizLesson extends Lesson {
  type: "quiz";
  quiz?: Quiz;
}

// Content lesson - must have at least one: video_url, content, or files
export interface ContentLesson extends Lesson {
  type: "content";
}

// Lesson Progress types
export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

// Quiz types
export type QuizDifficulty = "easy" | "medium" | "hard";

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
  passing_score: number;
  max_attempts: number | null;
  time_limit_minutes: number | null;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  answers: Record<string, number>;
  time_spent_seconds: number;
  passed: boolean;
  completed_at: string;
}

export interface QuizAttemptWithDetails extends QuizAttempt {
  quiz: Quiz;
  total_attempts: number;
  best_score: number;
  can_retry: boolean;
}

export interface QuizWithAttemptInfo extends Quiz {
  user_attempts_count: number;
  user_best_score: number;
  user_has_passed: boolean;
  can_attempt: boolean;
}

export interface QuizFeedback {
  question_id: string;
  question: string;
  options: string[];
  user_answer: number;
  correct_answer: number;
  is_correct: boolean;
}

export interface QuizResult {
  attempt: QuizAttempt;
  quiz: Quiz;
  feedback: QuizFeedback[];
  total_questions: number;
  correct_answers: number;
  percentage: number;
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

// Payment types
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export interface Payment {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  currency: string;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  status: PaymentStatus;
  created_at: string;
  paid_at: string | null;
}

export interface PaymentWithDetails extends Payment {
  user: User;
  course: Course;
}

export interface PaymentFilters extends PaginationParams {
  status?: PaymentStatus;
  user_id?: string;
  course_id?: string;
  date_from?: string;
  date_to?: string;
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
  search?: string;
}

// Course form types
export interface CourseFormData {
  title: string;
  description: string;
  status: CourseStatus;
  thumbnail_url: string;
  price?: number | null;
}

// Lesson form types
export interface LessonFormData {
  module_id: string;
  title: string;
  type: LessonType;
  content?: string;
  video_url?: string;
  files?: LessonFile[];
  quiz_id?: string; // For quiz type lessons
}

// Quiz form types
export interface QuizFormData {
  lesson_id: string;
  title: string;
  questions: QuizQuestion[];
  ai_generated?: boolean;
  passing_score?: number;
  max_attempts?: number | null;
  time_limit_minutes?: number | null;
}

// AI Quiz Generation types
export interface AIQuizGenerationOptions {
  lesson_id: string;
  num_questions: number;
  difficulty: QuizDifficulty;
}

export interface AIQuizGenerationResult {
  questions: QuizQuestion[];
  lesson_title: string;
}
