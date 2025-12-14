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
          role: "admin" | "user";
          is_blocked: boolean;
          created_at: string;
          last_login: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: "admin" | "user";
          is_blocked?: boolean;
          created_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: "admin" | "user";
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
          status: "draft" | "published" | "archived";
          thumbnail_url: string | null;
          lesson_access_mode: "sequential" | "all_access";
          price: number | null;
          stripe_product_id: string | null;
          stripe_price_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: "draft" | "published" | "archived";
          thumbnail_url?: string | null;
          lesson_access_mode?: "sequential" | "all_access";
          price?: number | null;
          stripe_product_id?: string | null;
          stripe_price_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          status?: "draft" | "published" | "archived";
          thumbnail_url?: string | null;
          lesson_access_mode?: "sequential" | "all_access";
          price?: number | null;
          stripe_product_id?: string | null;
          stripe_price_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      modules: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          description?: string | null;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          description?: string | null;
          order_index?: number;
          created_at?: string;
        };
      };
      lessons: {
        Row: {
          id: string;
          course_id: string;
          module_id: string;
          title: string;
          type: "quiz" | "content";
          content: string | null;
          video_url: string | null;
          files: Json;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          module_id: string;
          title: string;
          type?: "quiz" | "content";
          content?: string | null;
          video_url?: string | null;
          files?: Json;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          module_id?: string;
          title?: string;
          type?: "quiz" | "content";
          content?: string | null;
          video_url?: string | null;
          files?: Json;
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
      payments: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          amount: number;
          currency: string;
          stripe_payment_intent_id: string | null;
          stripe_checkout_session_id: string | null;
          status: "pending" | "succeeded" | "failed" | "refunded";
          created_at: string;
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          amount: number;
          currency?: string;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          status?: "pending" | "succeeded" | "failed" | "refunded";
          created_at?: string;
          paid_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          amount?: number;
          currency?: string;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          status?: "pending" | "succeeded" | "failed" | "refunded";
          created_at?: string;
          paid_at?: string | null;
        };
      };
      lesson_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          course_id: string;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          course_id: string;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lesson_id?: string;
          course_id?: string;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
