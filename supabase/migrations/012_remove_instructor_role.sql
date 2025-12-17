-- Migration Part 2: Remove 'instructor' role and keep only 'admin' and 'user' roles
-- Also removes instructor_id from courses since only admins manage courses

-- Step 1: Drop ALL policies that depend on 'role' column or related functions

-- Storage policies (course-thumbnails bucket)
DROP POLICY IF EXISTS "Admins can upload course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view course thumbnails" ON storage.objects;

-- Storage policies (lesson-materials bucket)
DROP POLICY IF EXISTS "Admins can upload lesson materials" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update lesson materials" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete lesson materials" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view lesson materials" ON storage.objects;

-- Users table policies
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;

-- Courses policies
DROP POLICY IF EXISTS "Instructors and admins can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Course owners and admins can update courses" ON public.courses;
DROP POLICY IF EXISTS "Course owners and admins can delete courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Course creators and admins can update courses" ON public.courses;
DROP POLICY IF EXISTS "Course creators and admins can delete courses" ON public.courses;

-- Lessons policies
DROP POLICY IF EXISTS "Users can view lessons of published courses" ON public.lessons;
DROP POLICY IF EXISTS "Course owners and admins can manage lessons" ON public.lessons;
DROP POLICY IF EXISTS "Course creators and admins can manage lessons" ON public.lessons;

-- Quizzes policies
DROP POLICY IF EXISTS "Users can view quizzes of published courses" ON public.quizzes;
DROP POLICY IF EXISTS "Course owners and admins can manage quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Course creators and admins can manage quizzes" ON public.quizzes;

-- Step 2: Now we can safely drop functions
DROP FUNCTION IF EXISTS is_instructor() CASCADE;
DROP FUNCTION IF EXISTS owns_course(UUID) CASCADE;

-- Step 3: Update all users with 'instructor' role to 'admin' role
UPDATE public.users
SET role = 'admin'
WHERE role = 'instructor';

-- Step 4: Update all users with 'student' role to 'user' role
UPDATE public.users
SET role = 'user'
WHERE role = 'student';

-- Step 5: Drop the index on instructor_id before removing the column
DROP INDEX IF EXISTS idx_courses_instructor;

-- Step 6: Remove instructor_id column from courses table (admins manage all courses)
ALTER TABLE public.courses DROP COLUMN IF EXISTS instructor_id;

-- Step 7: Now recreate the enum without 'instructor' and 'student'
-- First, remove the default value
ALTER TABLE public.users ALTER COLUMN role DROP DEFAULT;

-- Change column to TEXT
ALTER TABLE public.users ALTER COLUMN role TYPE TEXT;

-- Drop the old enum (now safe to do)
DROP TYPE user_role;

-- Create new enum with only 'admin' and 'user'
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- Convert column back to enum
ALTER TABLE public.users ALTER COLUMN role TYPE user_role USING role::user_role;

-- Restore the default value
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'user';

-- Step 8: Recreate all policies with new structure

-- Storage policies for course-thumbnails bucket
CREATE POLICY "Admins can upload course thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-thumbnails' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Admins can update course thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-thumbnails' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Admins can delete course thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-thumbnails' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Anyone can view course thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-thumbnails');

-- Storage policies for lesson-materials bucket
CREATE POLICY "Admins can upload lesson materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-materials' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Admins can update lesson materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lesson-materials' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Admins can delete lesson materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lesson-materials' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Anyone can view lesson materials"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lesson-materials');

-- Users table policies
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

-- Courses policies - only admins manage courses
CREATE POLICY "Users can view published courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (status = 'published' OR is_admin());

CREATE POLICY "Admins can insert courses"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update courses"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete courses"
  ON public.courses FOR DELETE
  TO authenticated
  USING (is_admin());

-- Lessons policies
CREATE POLICY "Users can view lessons of published courses"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lessons.course_id
      AND (courses.status = 'published' OR is_admin())
    )
  );

CREATE POLICY "Admins can manage lessons"
  ON public.lessons FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Quizzes policies
CREATE POLICY "Users can view quizzes of published courses"
  ON public.quizzes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.courses ON courses.id = lessons.course_id
      WHERE lessons.id = quizzes.lesson_id
      AND (courses.status = 'published' OR is_admin())
    )
  );

CREATE POLICY "Admins can manage quizzes"
  ON public.quizzes FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

