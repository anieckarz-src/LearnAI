-- Migration: Remove content_reports table and related types
-- This migration removes the content moderation functionality

-- Drop policies first
DROP POLICY IF EXISTS "Users can view their own reports" ON public.content_reports;
DROP POLICY IF EXISTS "Users can create reports" ON public.content_reports;
DROP POLICY IF EXISTS "Admins can manage reports" ON public.content_reports;

-- Drop the table
DROP TABLE IF EXISTS public.content_reports;

-- Drop the custom types
DROP TYPE IF EXISTS content_type;
DROP TYPE IF EXISTS report_status;

