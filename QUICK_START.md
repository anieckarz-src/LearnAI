# LearnAI Admin Panel - Quick Start Guide

## 🚀 Quick Start (5 minutes)

### 1. Supabase Setup

```bash
# Option A: Using Supabase CLI (recommended)
supabase link --project-ref your_project_ref
supabase db push

# Option B: Manual setup
# Go to Supabase SQL Editor and run:
# - supabase/migrations/001_initial_schema.sql
# - supabase/migrations/002_row_level_security.sql
# - supabase/migrations/003_seed_data.sql
```

### 2. Environment Variables

Create `.env` file:

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Create First Admin User

After signing up a user through Supabase Auth, run in SQL Editor:

```sql
INSERT INTO public.users (id, email, full_name, role)
VALUES (
  'user-uuid-from-auth-users',
  'admin@example.com',
  'Admin User',
  'admin'
);
```

### 4. Start Development Server

```bash
npm install  # Already done
npm run dev
```

### 5. Access Admin Panel

Navigate to: `http://localhost:3000/admin/dashboard`

## 📁 What You Got

```
Admin Panel Features:
├── 📊 Dashboard (/admin/dashboard)
│   ├── User statistics
│   ├── Course statistics
│   ├── Quiz performance metrics
│   └── Quick action links
│
├── 👥 Users Management (/admin/users)
│   ├── List all users
│   ├── Search & filter by role
│   ├── Edit user profiles
│   ├── Change user roles
│   └── Block/unblock accounts
│
├── 📚 Courses Management (/admin/courses)
│   ├── Grid view of all courses
│   ├── Filter by status
│   ├── Create new courses
│   ├── Edit course details
│   ├── Manage lessons
│   └── Delete courses
│
├── ❓ Quizzes Management (/admin/quizzes)
│   ├── List all quizzes
│   ├── Preview questions
│   ├── View statistics
│   └── Delete quizzes
│
├── 🚩 Content Moderation (/admin/reports)
│   ├── Review user reports
│   ├── Filter by status/type
│   └── Resolve reports
│
└── ⚙️ System Settings (/admin/settings)
    ├── General settings
    ├── AI chatbot config
    ├── Quiz defaults
    └── Security settings
```

## 🔐 Security Features

- ✅ Middleware protection for /admin/\* routes
- ✅ Row Level Security on all database tables
- ✅ Role-based access control
- ✅ Audit logging for all admin actions
- ✅ Session management
- ✅ Account blocking capability

## 🎨 Design System

Uses existing landing page colors:

- Primary: Blue (#3B82F6)
- Background: Dark slate (#0F172A, #020617)
- Cards: Glass-morphism with backdrop blur
- Responsive: Mobile, Tablet, Desktop

## 📚 Documentation

- **[ADMIN_PANEL.md](./ADMIN_PANEL.md)** - Complete admin panel guide
- **[supabase/README.md](./supabase/README.md)** - Database setup
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - What was built

## 🐛 Troubleshooting

**Can't access /admin/dashboard?**

- Check if you're logged in
- Verify user has 'admin' role in users table
- Check console for middleware errors

**Database errors?**

- Verify Supabase connection in .env
- Run all 3 migration files in order
- Check RLS policies are enabled

**Blank pages?**

- Open browser console for errors
- Check terminal for server errors
- Verify React components are mounting

## 🎯 Next Steps

1. **Customize the platform:**
   - Update platform name in settings
   - Add your branding/logo
   - Configure AI settings

2. **Add content:**
   - Create instructor accounts
   - Add courses and lessons
   - Generate quizzes

3. **Extend functionality:**
   - Add rich text editor for lessons
   - Implement file uploads
   - Add email notifications
   - Create instructor dashboard

## 💡 Tips

- Use the search and filters to find users/courses quickly
- Check audit_log table to see all admin actions
- Settings are stored in system_settings table
- All dates use browser's local timezone

## 🤝 Need Help?

Check these files:

- Technical details → `ADMIN_PANEL.md`
- Database schema → `supabase/migrations/*.sql`
- API routes → `src/pages/api/admin/**/*.ts`
- Components → `src/components/admin/*.tsx`

---

**Built with:** Astro 5 + React 19 + Supabase + TypeScript + Tailwind CSS
