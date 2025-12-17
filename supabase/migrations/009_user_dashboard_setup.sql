-- User Dashboard Setup Migration
-- Adds lesson progress tracking and configurable lesson access modes

-- Add lesson_access_mode column to courses table
ALTER TABLE public.courses
ADD COLUMN lesson_access_mode TEXT DEFAULT 'all_access' 
  CHECK (lesson_access_mode IN ('sequential', 'all_access'));

-- Add comment for documentation
COMMENT ON COLUMN public.courses.lesson_access_mode IS 'Controls how lessons are accessed: sequential (unlock one by one) or all_access (all available immediately)';

-- Create lesson_progress table for tracking user progress
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Create indexes for better performance
CREATE INDEX idx_lesson_progress_user ON public.lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson ON public.lesson_progress(lesson_id);
CREATE INDEX idx_lesson_progress_course ON public.lesson_progress(course_id);
CREATE INDEX idx_lesson_progress_user_course ON public.lesson_progress(user_id, course_id);
CREATE INDEX idx_lesson_progress_completed ON public.lesson_progress(completed) WHERE completed = true;

-- Add comments for documentation
COMMENT ON TABLE public.lesson_progress IS 'Tracks user progress through course lessons';
COMMENT ON COLUMN public.lesson_progress.completed IS 'Whether the user has completed this lesson';
COMMENT ON COLUMN public.lesson_progress.completed_at IS 'Timestamp when lesson was marked as completed';

-- Row Level Security Policies for lesson_progress table

-- Enable RLS
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view own lesson progress"
  ON public.lesson_progress FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own progress
CREATE POLICY "Users can create own lesson progress"
  ON public.lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own progress
CREATE POLICY "Users can update own lesson progress"
  ON public.lesson_progress FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can view all progress
CREATE POLICY "Admins can view all lesson progress"
  ON public.lesson_progress FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Function to check if a lesson is accessible based on sequential mode
CREATE OR REPLACE FUNCTION is_lesson_accessible(
  user_id_param UUID,
  course_id_param UUID,
  lesson_order_index INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  access_mode TEXT;
  previous_lessons_completed BOOLEAN;
BEGIN
  -- Get the course access mode
  SELECT lesson_access_mode INTO access_mode
  FROM public.courses
  WHERE id = course_id_param;
  
  -- If all_access mode, lesson is always accessible
  IF access_mode = 'all_access' THEN
    RETURN TRUE;
  END IF;
  
  -- For sequential mode, check if all previous lessons are completed
  -- First lesson (order_index = 0) is always accessible
  IF lesson_order_index = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- Check if all previous lessons are completed
  SELECT COALESCE(
    (
      SELECT COUNT(*) = COUNT(CASE WHEN lp.completed THEN 1 END)
      FROM public.lessons l
      LEFT JOIN public.lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = user_id_param
      WHERE l.course_id = course_id_param 
        AND l.order_index < lesson_order_index
    ),
    FALSE
  ) INTO previous_lessons_completed;
  
  RETURN previous_lessons_completed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate course progress for a user
CREATE OR REPLACE FUNCTION get_course_progress(
  user_id_param UUID,
  course_id_param UUID
)
RETURNS TABLE(
  total_lessons INTEGER,
  completed_lessons INTEGER,
  progress_percentage INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(l.id)::INTEGER as total_lessons,
    COUNT(CASE WHEN lp.completed = true THEN 1 END)::INTEGER as completed_lessons,
    CASE 
      WHEN COUNT(l.id) = 0 THEN 0
      ELSE (COUNT(CASE WHEN lp.completed = true THEN 1 END)::FLOAT / COUNT(l.id)::FLOAT * 100)::INTEGER
    END as progress_percentage
  FROM public.lessons l
  LEFT JOIN public.lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = user_id_param
  WHERE l.course_id = course_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next incomplete lesson for a user in a course
CREATE OR REPLACE FUNCTION get_next_incomplete_lesson(
  user_id_param UUID,
  course_id_param UUID
)
RETURNS UUID AS $$
DECLARE
  next_lesson_id UUID;
BEGIN
  SELECT l.id INTO next_lesson_id
  FROM public.lessons l
  LEFT JOIN public.lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = user_id_param
  WHERE l.course_id = course_id_param
    AND (lp.completed IS NULL OR lp.completed = false)
  ORDER BY l.order_index ASC
  LIMIT 1;
  
  RETURN next_lesson_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit logging for lesson progress changes
CREATE OR REPLACE FUNCTION log_lesson_progress_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, new_values)
    VALUES (NEW.user_id, 'lesson_progress_created', 'lesson_progress', NEW.id, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if completed status changed
    IF OLD.completed != NEW.completed THEN
      INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, old_values, new_values)
      VALUES (NEW.user_id, 'lesson_progress_updated', 'lesson_progress', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for lesson progress audit logging
CREATE TRIGGER lesson_progress_audit_log
  AFTER INSERT OR UPDATE ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION log_lesson_progress_changes();

