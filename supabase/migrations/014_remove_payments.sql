-- Remove Payments System Migration
-- This migration removes all payment-related functionality from the system

-- Step 1: Drop RLS policies that depend on payment functions
-- This must be done BEFORE dropping the functions they depend on
DROP POLICY IF EXISTS "Users can enroll in free courses" ON public.course_enrollments;

-- Step 2: Drop triggers
DROP TRIGGER IF EXISTS payment_audit_log ON public.payments;
DROP TRIGGER IF EXISTS auto_enroll_on_payment ON public.payments;

-- Step 3: Drop functions (now safe to drop since policies are gone)
DROP FUNCTION IF EXISTS log_payment_changes();
DROP FUNCTION IF EXISTS create_enrollment_after_payment();
DROP FUNCTION IF EXISTS user_has_course_access(UUID, UUID);
DROP FUNCTION IF EXISTS is_course_free(UUID);

-- Step 4: Drop indexes on payments table
DROP INDEX IF EXISTS idx_payments_created;
DROP INDEX IF EXISTS idx_payments_stripe_intent;
DROP INDEX IF EXISTS idx_payments_stripe_session;
DROP INDEX IF EXISTS idx_payments_status;
DROP INDEX IF EXISTS idx_payments_course;
DROP INDEX IF EXISTS idx_payments_user;

-- Step 5: Drop indexes on courses table
DROP INDEX IF EXISTS idx_courses_price;

-- Step 6: Drop payments table
DROP TABLE IF EXISTS public.payments;

-- Step 7: Drop payment_status enum
DROP TYPE IF EXISTS payment_status;

-- Step 8: Remove payment-related columns from courses table
ALTER TABLE public.courses
DROP COLUMN IF EXISTS price,
DROP COLUMN IF EXISTS stripe_product_id,
DROP COLUMN IF EXISTS stripe_price_id;

-- Step 9: Create new RLS policy for course enrollments
-- All authenticated users can now enroll in any published course
CREATE POLICY "Users can enroll in courses"
  ON public.course_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = course_id AND status = 'published'
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Users can enroll in courses" ON public.course_enrollments IS 
  'Authenticated users can enroll in any published course. All courses are now free.';
