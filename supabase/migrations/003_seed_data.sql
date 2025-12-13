-- Insert default system settings
INSERT INTO public.system_settings (key, value) VALUES
  ('platform_name', '{"value": "LearnAI"}'),
  ('platform_email', '{"value": "contact@learnai.com"}'),
  ('ai_chatbot_model', '{"value": "gpt-4"}'),
  ('ai_chatbot_temperature', '{"value": 0.7}'),
  ('ai_chatbot_max_tokens', '{"value": 2000}'),
  ('ai_chatbot_system_prompt', '{"value": "You are a helpful educational assistant. Help students understand course materials and answer their questions."}'),
  ('quiz_default_questions', '{"value": 5}'),
  ('quiz_default_difficulty', '{"value": "medium"}'),
  ('session_timeout_minutes', '{"value": 60}'),
  ('rate_limit_per_minute', '{"value": 60}')
ON CONFLICT (key) DO NOTHING;

-- Note: First admin user should be created manually after signup through Supabase dashboard
-- by updating the user's role to 'admin' in the users table
