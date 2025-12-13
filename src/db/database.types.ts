export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      audit_log: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "admin" | "instructor" | "student";
          is_blocked: boolean;
          created_at: string;
          last_login: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: "admin" | "instructor" | "student";
          is_blocked?: boolean;
          created_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: "admin" | "instructor" | "student";
          is_blocked?: boolean;
          created_at?: string;
          last_login?: string | null;
        };
      };
      courses: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          instructor_id: string;
          status: "draft" | "published" | "archived";
          thumbnail_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          instructor_id: string;
          status?: "draft" | "published" | "archived";
          thumbnail_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          instructor_id?: string;
          status?: "draft" | "published" | "archived";
          thumbnail_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      lessons: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          content: string | null;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          content?: string | null;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          content?: string | null;
          order_index?: number;
          created_at?: string;
        };
      };
      quizzes: {
        Row: {
          id: string;
          lesson_id: string;
          title: string;
          questions: Json;
          ai_generated: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          title: string;
          questions?: Json;
          ai_generated?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          title?: string;
          questions?: Json;
          ai_generated?: boolean;
          created_at?: string;
        };
      };
      quiz_attempts: {
        Row: {
          id: string;
          quiz_id: string;
          user_id: string;
          score: number;
          answers: Json;
          completed_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          user_id: string;
          score: number;
          answers?: Json;
          completed_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          user_id?: string;
          score?: number;
          answers?: Json;
          completed_at?: string;
        };
      };
      system_settings: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          value?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
      };
      course_enrollments: {
        Row: {
          id: string;
          course_id: string;
          user_id: string;
          enrolled_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          course_id: string;
          user_id: string;
          enrolled_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          course_id?: string;
          user_id?: string;
          enrolled_at?: string;
          completed_at?: string | null;
        };
      };
    };
  };
}
