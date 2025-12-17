-- Migration 013: Add modules table and lesson types
-- This migration introduces a hierarchical structure: Course → Modules → Lessons
-- and adds lesson types (quiz vs content)

-- Step 1: Create modules table
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT modules_title_check CHECK (char_length(title) >= 3),
  CONSTRAINT modules_order_check CHECK (order_index >= 0)
);

-- Step 2: Create lesson_type enum
CREATE TYPE lesson_type AS ENUM ('quiz', 'content');

-- Step 3: Add new columns to lessons table
ALTER TABLE public.lessons ADD COLUMN module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE;
ALTER TABLE public.lessons ADD COLUMN type lesson_type NOT NULL DEFAULT 'content';
ALTER TABLE public.lessons ADD COLUMN files JSONB DEFAULT '[]'::jsonb;

-- Step 4: Migrate existing data
-- Create a default module for each existing course
INSERT INTO public.modules (course_id, title, description, order_index)
SELECT id, 'Moduł 1', 'Domyślny moduł kursu', 0 
FROM public.courses
WHERE EXISTS (SELECT 1 FROM public.lessons WHERE lessons.course_id = courses.id);

-- Assign all existing lessons to their course's default module
UPDATE public.lessons 
SET module_id = (
  SELECT m.id 
  FROM public.modules m 
  WHERE m.course_id = lessons.course_id 
  AND m.order_index = 0 
  LIMIT 1
)
WHERE module_id IS NULL;

-- Step 5: Make module_id NOT NULL after data migration
ALTER TABLE public.lessons ALTER COLUMN module_id SET NOT NULL;

-- Step 6: Create indexes for better performance
CREATE INDEX idx_modules_course ON public.modules(course_id, order_index);
CREATE INDEX idx_lessons_module ON public.lessons(module_id, order_index);
CREATE INDEX idx_lessons_type ON public.lessons(type);

-- Step 7: Enable RLS on modules table
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for modules

-- Users can view modules of published courses or if they're admin
CREATE POLICY "Users can view modules of published courses"
  ON public.modules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = modules.course_id
      AND (courses.status = 'published' OR is_admin())
    )
  );

-- Admins can insert modules
CREATE POLICY "Admins can insert modules"
  ON public.modules FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Admins can update modules
CREATE POLICY "Admins can update modules"
  ON public.modules FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins can delete modules
CREATE POLICY "Admins can delete modules"
  ON public.modules FOR DELETE
  TO authenticated
  USING (is_admin());

-- Step 9: Add comments for documentation
COMMENT ON TABLE public.modules IS 'Modules group lessons within a course';
COMMENT ON COLUMN public.modules.order_index IS 'Order of modules within a course (0-based)';
COMMENT ON COLUMN public.lessons.module_id IS 'Reference to the parent module';
COMMENT ON COLUMN public.lessons.type IS 'Type of lesson: quiz (requires quiz) or content (video/text/files)';
COMMENT ON COLUMN public.lessons.files IS 'Array of additional files: [{id, type, url, name, size}]';

