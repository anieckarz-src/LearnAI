-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin' AND is_blocked = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is instructor
CREATE OR REPLACE FUNCTION is_instructor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('instructor', 'admin') AND is_blocked = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user owns the course
CREATE OR REPLACE FUNCTION owns_course(course_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = course_id AND instructor_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS table policies
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any user"
  ON public.users FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id AND NOT is_blocked)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- COURSES table policies
CREATE POLICY "Anyone can view published courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (status = 'published' OR instructor_id = auth.uid() OR is_admin());

CREATE POLICY "Instructors and admins can insert courses"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (is_instructor());

CREATE POLICY "Course owners and admins can update courses"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (instructor_id = auth.uid() OR is_admin())
  WITH CHECK (instructor_id = auth.uid() OR is_admin());

CREATE POLICY "Course owners and admins can delete courses"
  ON public.courses FOR DELETE
  TO authenticated
  USING (instructor_id = auth.uid() OR is_admin());

-- LESSONS table policies
CREATE POLICY "Users can view lessons of published courses"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lessons.course_id
      AND (courses.status = 'published' OR courses.instructor_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Course owners and admins can manage lessons"
  ON public.lessons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lessons.course_id
      AND (courses.instructor_id = auth.uid() OR is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lessons.course_id
      AND (courses.instructor_id = auth.uid() OR is_admin())
    )
  );

-- QUIZZES table policies
CREATE POLICY "Users can view quizzes of published courses"
  ON public.quizzes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.courses ON courses.id = lessons.course_id
      WHERE lessons.id = quizzes.lesson_id
      AND (courses.status = 'published' OR courses.instructor_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Course owners and admins can manage quizzes"
  ON public.quizzes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.courses ON courses.id = lessons.course_id
      WHERE lessons.id = quizzes.lesson_id
      AND (courses.instructor_id = auth.uid() OR is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.courses ON courses.id = lessons.course_id
      WHERE lessons.id = quizzes.lesson_id
      AND (courses.instructor_id = auth.uid() OR is_admin())
    )
  );

-- QUIZ_ATTEMPTS table policies
CREATE POLICY "Users can view their own quiz attempts"
  ON public.quiz_attempts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can insert their own quiz attempts"
  ON public.quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all quiz attempts"
  ON public.quiz_attempts FOR SELECT
  TO authenticated
  USING (is_admin());

-- SYSTEM_SETTINGS table policies
CREATE POLICY "Anyone can view system settings"
  ON public.system_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage system settings"
  ON public.system_settings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- COURSE_ENROLLMENTS table policies
CREATE POLICY "Users can view their own enrollments"
  ON public.course_enrollments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can enroll in courses"
  ON public.course_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all enrollments"
  ON public.course_enrollments FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- AUDIT_LOG table policies
CREATE POLICY "Admins can view audit log"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "System can insert audit log"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);
