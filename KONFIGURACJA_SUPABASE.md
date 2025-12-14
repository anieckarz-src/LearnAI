# 🚀 SZYBKA KONFIGURACJA SUPABASE - SKOPIUJ I WKLEJ

## ✅ KROK 1: Utwórz plik .env

Utwórz plik `.env` w głównym katalogu projektu:

```

```

## ✅ KROK 2: Przejdź do Supabase Dashboard

1. Otwórz: https://supabase.com/dashboard/project/zcpdsrpyiprtcdsxuprk
2. W menu bocznym kliknij **SQL Editor**
3. Kliknij **New query**

---

## 📋 MIGRACJA 1: Schemat bazy danych

**Skopiuj poniższy kod i uruchom w SQL Editor:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'student');
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'student',
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status course_status NOT NULL DEFAULT 'draft',
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT courses_title_check CHECK (char_length(title) >= 3)
);

-- Lessons table
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT lessons_title_check CHECK (char_length(title) >= 3),
  CONSTRAINT lessons_order_check CHECK (order_index >= 0)
);

-- Quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT quizzes_title_check CHECK (char_length(title) >= 3)
);

-- Quiz attempts table
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT quiz_attempts_score_check CHECK (score >= 0 AND score <= 100)
);

-- System settings table
CREATE TABLE public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

-- Course enrollments table
CREATE TABLE public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(course_id, user_id)
);

-- Audit log table
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX idx_courses_status ON public.courses(status);
CREATE INDEX idx_lessons_course ON public.lessons(course_id);
CREATE INDEX idx_lessons_order ON public.lessons(course_id, order_index);
CREATE INDEX idx_quizzes_lesson ON public.quizzes(lesson_id);
CREATE INDEX idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX idx_course_enrollments_user ON public.course_enrollments(user_id);
CREATE INDEX idx_course_enrollments_course ON public.course_enrollments(course_id);
CREATE INDEX idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at DESC);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

✅ **Kliknij "RUN" i poczekaj na potwierdzenie**

---

## 📋 MIGRACJA 2: Row Level Security (kontynuuj w tym samym oknie lub utwórz nowe query)

**Skopiuj poniższy kod i uruchom:**

```sql
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin' AND is_blocked = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_instructor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('instructor', 'admin') AND is_blocked = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION owns_course(course_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = course_id AND instructor_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS policies
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can update any user" ON public.users FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id AND NOT is_blocked) WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Admins can insert users" ON public.users FOR INSERT TO authenticated WITH CHECK (is_admin());

-- COURSES policies
CREATE POLICY "Anyone can view published courses" ON public.courses FOR SELECT TO authenticated USING (status = 'published' OR instructor_id = auth.uid() OR is_admin());
CREATE POLICY "Instructors can insert courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (is_instructor());
CREATE POLICY "Owners can update courses" ON public.courses FOR UPDATE TO authenticated USING (instructor_id = auth.uid() OR is_admin()) WITH CHECK (instructor_id = auth.uid() OR is_admin());
CREATE POLICY "Owners can delete courses" ON public.courses FOR DELETE TO authenticated USING (instructor_id = auth.uid() OR is_admin());

-- LESSONS policies
CREATE POLICY "Users can view lessons of published courses" ON public.lessons FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = lessons.course_id AND (courses.status = 'published' OR courses.instructor_id = auth.uid() OR is_admin())));
CREATE POLICY "Course owners can manage lessons" ON public.lessons FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = lessons.course_id AND (courses.instructor_id = auth.uid() OR is_admin()))) WITH CHECK (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = lessons.course_id AND (courses.instructor_id = auth.uid() OR is_admin())));

-- QUIZZES policies
CREATE POLICY "Users can view quizzes" ON public.quizzes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.lessons JOIN public.courses ON courses.id = lessons.course_id WHERE lessons.id = quizzes.lesson_id AND (courses.status = 'published' OR courses.instructor_id = auth.uid() OR is_admin())));
CREATE POLICY "Course owners can manage quizzes" ON public.quizzes FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.lessons JOIN public.courses ON courses.id = lessons.course_id WHERE lessons.id = quizzes.lesson_id AND (courses.instructor_id = auth.uid() OR is_admin()))) WITH CHECK (EXISTS (SELECT 1 FROM public.lessons JOIN public.courses ON courses.id = lessons.course_id WHERE lessons.id = quizzes.lesson_id AND (courses.instructor_id = auth.uid() OR is_admin())));

-- QUIZ_ATTEMPTS policies
CREATE POLICY "Users view own attempts" ON public.quiz_attempts FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Users insert own attempts" ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- SYSTEM_SETTINGS policies
CREATE POLICY "Anyone can view settings" ON public.system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage settings" ON public.system_settings FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- COURSE_ENROLLMENTS policies
CREATE POLICY "Users view own enrollments" ON public.course_enrollments FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Users enroll" ON public.course_enrollments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage enrollments" ON public.course_enrollments FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- AUDIT_LOG policies
CREATE POLICY "Admins view audit log" ON public.audit_log FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "System insert audit log" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);
```

✅ **Kliknij "RUN"**

---

## 📋 MIGRACJA 3: Dane początkowe

**Skopiuj i uruchom:**

```sql
INSERT INTO public.system_settings (key, value) VALUES
  ('platform_name', '{"value": "LearnAI"}'),
  ('platform_email', '{"value": "contact@learnai.com"}'),
  ('ai_chatbot_model', '{"value": "gpt-4"}'),
  ('ai_chatbot_temperature', '{"value": 0.7}'),
  ('ai_chatbot_max_tokens', '{"value": 2000}'),
  ('ai_chatbot_system_prompt', '{"value": "You are a helpful educational assistant. Help students understand course materials and answer their questions."}'),
  ('quiz_default_questions', '{"value": 5}'),
  ('quiz_default_difficulty', '{"value": "medium"}'),
  ('session_timeout_minutes', '{"value": 60}'),
  ('rate_limit_per_minute', '{"value": 60}')
ON CONFLICT (key) DO NOTHING;
```

✅ **Kliknij "RUN"**

---

## 👤 KROK 3: Utwórz użytkownika Admin

### A) Utwórz użytkownika w Supabase Auth:

1. W dashboard Supabase → **Authentication** → **Users**
2. Kliknij **Add user** → **Create new user**
3. Email: `admin@example.com` (lub twój email)
4. Hasło: ustaw mocne hasło (zapamię taj je!)
5. **SKOPIUJ UUID** tego użytkownika (długi ciąg znaków)

### B) Dodaj do tabeli users z rolą admin:

W SQL Editor uruchom (zamień UUID na skopiowane):

```sql
INSERT INTO public.users (id, email, full_name, role)
VALUES (
  'WKLEJ-TUTAJ-SKOPIOWANE-UUID',
  'admin@example.com',
  'Administrator',
  'admin'
);
```

**Przykład:** Jeśli UUID to `a1b2c3d4-e5f6-7890-abcd-ef1234567890`, to:

```sql
INSERT INTO public.users (id, email, full_name, role)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'admin@example.com',
  'Administrator',
  'admin'
);
```

---

## ✅ KROK 4: Uruchom aplikację

W terminalu:

```bash
npm run dev
```

Otwórz: http://localhost:3000/login

Zaloguj się emailem i hasłem z kroku 3A.

---

## 🎉 GOTOWE!

Teraz masz dostęp do panelu admina: http://localhost:3000/admin/dashboard

**Możesz:**

- Zarządzać użytkownikami
- Tworzyć kursy i lekcje
- Przeglądać quizy
- Moderować treści
- Konfigurować system

---

## 🐛 Problemy?

**"Missing environment variables"**
→ Sprawdź czy plik `.env` istnieje i ma poprawne klucze

**"Unauthorized"**
→ Sprawdź czy użytkownik ma rolę 'admin':

```sql
SELECT * FROM public.users WHERE email = 'twoj@email.com';
```

**Błąd logowania**
→ Sprawdź czy UUID w tabeli users odpowiada UUID z auth.users
