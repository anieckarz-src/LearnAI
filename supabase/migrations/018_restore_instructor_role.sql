-- Migration: Restore instructor role and instructor_id column
-- This migration adds back the instructor role and instructor_id to support course ownership

-- Step 1: Drop existing policies that will be recreated
DROP POLICY IF EXISTS "Users can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can update courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON public.courses;
DROP POLICY IF EXISTS "Users can view lessons of published courses" ON public.lessons;
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can view quizzes of published courses" ON public.quizzes;
DROP POLICY IF EXISTS "Admins can manage quizzes" ON public.quizzes;

-- Storage policies
DROP POLICY IF EXISTS "Admins can upload course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload lesson materials" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update lesson materials" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete lesson materials" ON storage.objects;

-- Step 2: Add instructor role to enum
-- First, remove the default value
ALTER TABLE public.users ALTER COLUMN role DROP DEFAULT;

-- Change column to TEXT temporarily
ALTER TABLE public.users ALTER COLUMN role TYPE TEXT;

-- Drop the old enum
DROP TYPE user_role;

-- Create new enum with admin, instructor, and user
CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'user');

-- Convert column back to enum
ALTER TABLE public.users ALTER COLUMN role TYPE user_role USING role::user_role;

-- Restore the default value
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'user';

-- Step 3: Add instructor_id column back to courses table
ALTER TABLE public.courses ADD COLUMN instructor_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Set existing courses to be owned by the first admin (or NULL if no admin exists)
UPDATE public.courses
SET instructor_id = (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)
WHERE instructor_id IS NULL;

-- Make instructor_id NOT NULL after setting values
ALTER TABLE public.courses ALTER COLUMN instructor_id SET NOT NULL;

-- Create index for better performance
CREATE INDEX idx_courses_instructor ON public.courses(instructor_id);

-- Step 4: Create helper functions
CREATE OR REPLACE FUNCTION is_instructor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'instructor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION owns_course(course_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = course_id
    AND instructor_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_or_instructor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'instructor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Recreate policies with instructor support

-- Storage policies for course-thumbnails bucket
CREATE POLICY "Admins and instructors can upload course thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-thumbnails' AND
  is_admin_or_instructor()
);

CREATE POLICY "Admins and instructors can update course thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-thumbnails' AND
  is_admin_or_instructor()
);

CREATE POLICY "Admins and instructors can delete course thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-thumbnails' AND
  is_admin_or_instructor()
);

CREATE POLICY "Anyone can view course thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-thumbnails');

-- Storage policies for lesson-materials bucket
CREATE POLICY "Admins and instructors can upload lesson materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-materials' AND
  is_admin_or_instructor()
);

CREATE POLICY "Admins and instructors can update lesson materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lesson-materials' AND
  is_admin_or_instructor()
);

CREATE POLICY "Admins and instructors can delete lesson materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lesson-materials' AND
  is_admin_or_instructor()
);

CREATE POLICY "Anyone can view lesson materials"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lesson-materials');

-- Courses policies
CREATE POLICY "Users can view published courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (status = 'published' OR is_admin() OR owns_course(id));

CREATE POLICY "Admins and instructors can insert courses"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "Course owners and admins can update courses"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (is_admin() OR owns_course(id))
  WITH CHECK (is_admin() OR owns_course(id));

CREATE POLICY "Course owners and admins can delete courses"
  ON public.courses FOR DELETE
  TO authenticated
  USING (is_admin() OR owns_course(id));

-- Lessons policies
CREATE POLICY "Users can view lessons of published courses"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lessons.course_id
      AND (courses.status = 'published' OR is_admin() OR owns_course(courses.id))
    )
  );

CREATE POLICY "Course owners and admins can manage lessons"
  ON public.lessons FOR ALL
  TO authenticated
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lessons.course_id
      AND owns_course(courses.id)
    )
  )
  WITH CHECK (
    is_admin() OR EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lessons.course_id
      AND owns_course(courses.id)
    )
  );

-- Quizzes policies
CREATE POLICY "Users can view quizzes of published courses"
  ON public.quizzes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.courses ON courses.id = lessons.course_id
      WHERE lessons.id = quizzes.lesson_id
      AND (courses.status = 'published' OR is_admin() OR owns_course(courses.id))
    )
  );

CREATE POLICY "Course owners and admins can manage quizzes"
  ON public.quizzes FOR ALL
  TO authenticated
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.courses ON courses.id = lessons.course_id
      WHERE lessons.id = quizzes.lesson_id
      AND owns_course(courses.id)
    )
  )
  WITH CHECK (
    is_admin() OR EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.courses ON courses.id = lessons.course_id
      WHERE lessons.id = quizzes.lesson_id
      AND owns_course(courses.id)
    )
  );
