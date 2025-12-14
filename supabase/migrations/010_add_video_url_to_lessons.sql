-- Add video_url column to lessons table
-- This allows lessons to embed external video content (Vimeo, YouTube) instead of storing video files

ALTER TABLE lessons
ADD COLUMN video_url TEXT NULL;

COMMENT ON COLUMN lessons.video_url IS 'External video URL (Vimeo, YouTube) - we do NOT store video files on the server';
