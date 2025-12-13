# Supabase Setup Instructions

## Prerequisites

1. Create a Supabase project at https://supabase.com
2. Get your project URL and anon key from Project Settings > API

## Environment Variables

Create a `.env` file in the root directory with:

```env
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

### Option 1: Using Supabase CLI (Recommended)

1. Install Supabase CLI:

```bash
npm install -g supabase
```

2. Link to your project:

```bash
supabase link --project-ref your_project_ref
```

3. Push migrations:

```bash
supabase db push
```

### Option 2: Manual Setup via Supabase Studio

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file in order:
   - `001_initial_schema.sql`
   - `002_row_level_security.sql`
   - `003_seed_data.sql`
   - `004_storage_setup.sql`
   - `005_lesson_storage_setup.sql`
   - `006_remove_content_reports.sql` (optional - removes content_reports table)

## Creating the First Admin User

1. Sign up a user through your application's auth flow
2. Go to Supabase Dashboard > Authentication > Users
3. Copy the user's UUID
4. Go to SQL Editor and run:

```sql
INSERT INTO public.users (id, email, full_name, role)
VALUES (
  'user_uuid_here',
  'admin@example.com',
  'Admin User',
  'admin'
);
```

Or update an existing user:

```sql
UPDATE public.users
SET role = 'admin'
WHERE id = 'user_uuid_here';
```

## Generating TypeScript Types

To regenerate TypeScript types from your database schema:

```bash
supabase gen types typescript --project-id your_project_ref > src/db/database.types.ts
```

## Testing Database Connection

You can test the connection by creating a test API endpoint or using the Supabase client in your code.

## Row Level Security (RLS)

All tables have RLS enabled. The policies ensure:

- Admins have full access to all data
- Instructors can manage their own courses
- Students can view published content and their own data
- Users cannot access blocked accounts

## Next Steps

After setting up the database:

1. Configure authentication in Astro middleware
2. Create API routes for admin operations
3. Build the admin UI components
