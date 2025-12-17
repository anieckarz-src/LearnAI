-- Payments Setup Migration
-- This migration adds payment functionality with Stripe integration

-- Create payment status enum
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');

-- Add payment-related columns to courses table
ALTER TABLE public.courses
ADD COLUMN price DECIMAL(10, 2) DEFAULT NULL,
ADD COLUMN stripe_product_id TEXT DEFAULT NULL,
ADD COLUMN stripe_price_id TEXT DEFAULT NULL;

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PLN',
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT payments_amount_check CHECK (amount >= 0)
);

-- Create indexes for better performance
CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_course ON public.payments(course_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_stripe_session ON public.payments(stripe_checkout_session_id);
CREATE INDEX idx_payments_stripe_intent ON public.payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_created ON public.payments(created_at DESC);
CREATE INDEX idx_courses_price ON public.courses(price) WHERE price IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.courses.price IS 'Course price in PLN. NULL means free course.';
COMMENT ON COLUMN public.courses.stripe_product_id IS 'Stripe Product ID for this course';
COMMENT ON COLUMN public.courses.stripe_price_id IS 'Stripe Price ID for this course';
COMMENT ON TABLE public.payments IS 'Records of all payment transactions';
COMMENT ON COLUMN public.payments.amount IS 'Payment amount in the specified currency';
COMMENT ON COLUMN public.payments.currency IS 'Currency code (ISO 4217)';
COMMENT ON COLUMN public.payments.stripe_payment_intent_id IS 'Stripe PaymentIntent ID';
COMMENT ON COLUMN public.payments.stripe_checkout_session_id IS 'Stripe Checkout Session ID';
COMMENT ON COLUMN public.payments.status IS 'Payment status: pending, succeeded, failed, or refunded';
COMMENT ON COLUMN public.payments.paid_at IS 'Timestamp when payment was successfully completed';

-- Row Level Security Policies for payments table

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only system (via service role) can insert payments
-- This happens through webhook handlers
CREATE POLICY "System can insert payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON public.payments FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Function to automatically create enrollment after successful payment
CREATE OR REPLACE FUNCTION create_enrollment_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create enrollment if payment succeeded and enrollment doesn't exist
  IF NEW.status = 'succeeded' AND NOT EXISTS (
    SELECT 1 FROM public.course_enrollments 
    WHERE course_id = NEW.course_id AND user_id = NEW.user_id
  ) THEN
    INSERT INTO public.course_enrollments (course_id, user_id)
    VALUES (NEW.course_id, NEW.user_id)
    ON CONFLICT (course_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create enrollment on successful payment
CREATE TRIGGER auto_enroll_on_payment
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  WHEN (NEW.status = 'succeeded')
  EXECUTE FUNCTION create_enrollment_after_payment();

-- Function to check if a course is free
CREATE OR REPLACE FUNCTION is_course_free(course_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  course_price DECIMAL(10, 2);
BEGIN
  SELECT price INTO course_price
  FROM public.courses
  WHERE id = course_id_param;
  
  RETURN course_price IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to course (purchased or free)
CREATE OR REPLACE FUNCTION user_has_course_access(user_id_param UUID, course_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if course is free
  IF is_course_free(course_id_param) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has enrollment (either via payment or admin grant)
  RETURN EXISTS (
    SELECT 1 FROM public.course_enrollments
    WHERE user_id = user_id_param AND course_id = course_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update course_enrollments policies to allow enrollment for free courses
-- Drop existing policy if it conflicts
DROP POLICY IF EXISTS "Users can enroll in courses" ON public.course_enrollments;

-- New policy: Users can enroll in free courses
CREATE POLICY "Users can enroll in free courses"
  ON public.course_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND 
    is_course_free(course_id)
  );

-- Add audit log entries for payment-related actions
CREATE OR REPLACE FUNCTION log_payment_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, new_values)
    VALUES (NEW.user_id, 'payment_created', 'payment', NEW.id, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (NEW.user_id, 'payment_updated', 'payment', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for payment audit logging
CREATE TRIGGER payment_audit_log
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION log_payment_changes();

