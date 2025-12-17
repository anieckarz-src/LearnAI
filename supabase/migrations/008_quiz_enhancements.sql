-- Quiz Enhancements Migration
-- Adds support for passing scores, attempt limits, and detailed feedback

-- Add new columns to quizzes table
ALTER TABLE public.quizzes
ADD COLUMN passing_score INTEGER NOT NULL DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
ADD COLUMN max_attempts INTEGER DEFAULT NULL CHECK (max_attempts IS NULL OR max_attempts > 0),
ADD COLUMN time_limit_minutes INTEGER DEFAULT NULL CHECK (time_limit_minutes IS NULL OR time_limit_minutes > 0);

-- Add comments for documentation
COMMENT ON COLUMN public.quizzes.passing_score IS 'Required score percentage (0-100) to pass the quiz. Default: 70%';
COMMENT ON COLUMN public.quizzes.max_attempts IS 'Maximum number of attempts allowed. NULL means unlimited attempts';
COMMENT ON COLUMN public.quizzes.time_limit_minutes IS 'Time limit in minutes. NULL means no time limit';

-- Add new columns to quiz_attempts table
ALTER TABLE public.quiz_attempts
ADD COLUMN time_spent_seconds INTEGER DEFAULT 0 CHECK (time_spent_seconds >= 0),
ADD COLUMN passed BOOLEAN NOT NULL DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.quiz_attempts.time_spent_seconds IS 'Time spent on quiz in seconds';
COMMENT ON COLUMN public.quiz_attempts.passed IS 'Whether the user passed the quiz based on passing_score';

-- Add indexes for better performance
CREATE INDEX idx_quiz_attempts_passed ON public.quiz_attempts(passed);
CREATE INDEX idx_quiz_attempts_user_quiz ON public.quiz_attempts(user_id, quiz_id);
CREATE INDEX idx_quizzes_passing_score ON public.quizzes(passing_score);

-- Function to get user's quiz attempts count
CREATE OR REPLACE FUNCTION get_user_quiz_attempts_count(user_id_param UUID, quiz_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  attempts_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO attempts_count
  FROM public.quiz_attempts
  WHERE user_id = user_id_param AND quiz_id = quiz_id_param;
  
  RETURN attempts_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can attempt quiz
CREATE OR REPLACE FUNCTION can_user_attempt_quiz(user_id_param UUID, quiz_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  attempts_count INTEGER;
  max_attempts_allowed INTEGER;
BEGIN
  -- Get the max_attempts for this quiz
  SELECT max_attempts
  INTO max_attempts_allowed
  FROM public.quizzes
  WHERE id = quiz_id_param;
  
  -- If max_attempts is NULL, unlimited attempts are allowed
  IF max_attempts_allowed IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Get current attempts count
  SELECT get_user_quiz_attempts_count(user_id_param, quiz_id_param)
  INTO attempts_count;
  
  -- Check if user has attempts remaining
  RETURN attempts_count < max_attempts_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's best score for a quiz
CREATE OR REPLACE FUNCTION get_user_best_score(user_id_param UUID, quiz_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  best_score INTEGER;
BEGIN
  SELECT COALESCE(MAX(score), 0)
  INTO best_score
  FROM public.quiz_attempts
  WHERE user_id = user_id_param AND quiz_id = quiz_id_param;
  
  RETURN best_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has passed a quiz
CREATE OR REPLACE FUNCTION has_user_passed_quiz(user_id_param UUID, quiz_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_passed BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM public.quiz_attempts
    WHERE user_id = user_id_param 
      AND quiz_id = quiz_id_param 
      AND passed = true
  ) INTO has_passed;
  
  RETURN has_passed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to automatically set 'passed' field based on score and passing_score
CREATE OR REPLACE FUNCTION set_quiz_attempt_passed()
RETURNS TRIGGER AS $$
DECLARE
  quiz_passing_score INTEGER;
BEGIN
  -- Get the passing score for this quiz
  SELECT passing_score
  INTO quiz_passing_score
  FROM public.quizzes
  WHERE id = NEW.quiz_id;
  
  -- Set passed field based on score vs passing_score
  NEW.passed := NEW.score >= quiz_passing_score;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-set passed field on quiz attempt insert/update
CREATE TRIGGER auto_set_quiz_passed
  BEFORE INSERT OR UPDATE ON public.quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION set_quiz_attempt_passed();

-- Update existing quiz attempts to set passed field correctly
DO $$
DECLARE
  attempt_record RECORD;
  quiz_passing_score INTEGER;
BEGIN
  FOR attempt_record IN 
    SELECT qa.id, qa.quiz_id, qa.score
    FROM public.quiz_attempts qa
  LOOP
    -- Get passing score for this quiz
    SELECT passing_score INTO quiz_passing_score
    FROM public.quizzes
    WHERE id = attempt_record.quiz_id;
    
    -- Update passed field
    UPDATE public.quiz_attempts
    SET passed = (attempt_record.score >= quiz_passing_score)
    WHERE id = attempt_record.id;
  END LOOP;
END $$;

-- Add audit logging for quiz attempts
CREATE OR REPLACE FUNCTION log_quiz_attempt_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, new_values)
    VALUES (NEW.user_id, 'quiz_attempt_created', 'quiz_attempt', NEW.id, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (NEW.user_id, 'quiz_attempt_updated', 'quiz_attempt', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for quiz attempt audit logging
CREATE TRIGGER quiz_attempt_audit_log
  AFTER INSERT OR UPDATE ON public.quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION log_quiz_attempt_changes();

