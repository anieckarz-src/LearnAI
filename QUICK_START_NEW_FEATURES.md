# Quick Start Guide - New Features

This guide helps you get started with the newly implemented features.

## 🚀 Getting Started

### 1. Apply Database Migration

First, apply the new storage migration:

**Option A: Supabase Dashboard**

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/005_lesson_storage_setup.sql`
3. Run the SQL

**Option B: Supabase CLI**

```bash
supabase db push
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Login as Admin

Navigate to `http://localhost:4321/login` and login with an admin account.

---

## 📚 Managing Lessons

### Access Lesson Management

1. Go to **Admin Dashboard** → **Courses**
2. Click **Edit** on any course
3. Scroll down to see the **Lessons** section

### Create a New Lesson

1. Click **"Dodaj lekcję"** button
2. Fill in the form:
   - **Title**: Enter lesson name (3-200 characters)
   - **Content**: Use rich text editor for lesson content
     - Bold, Italic formatting
     - Headings (H2, H3)
     - Lists (bullet, numbered)
     - Links
   - **Materials**: Upload files (optional)
     - PDFs (max 10MB)
     - Videos (MP4, WebM - max 100MB)
     - Images (JPEG, PNG, WebP - max 5MB)
3. Click **"Utwórz lekcję"**

### Reorder Lessons (Drag & Drop)

1. Hover over the grip icon (⋮⋮) on any lesson
2. Click and drag to new position
3. Release to drop
4. Order is saved automatically

### Preview a Lesson

1. Click the **eye icon** on any lesson
2. View rendered content and materials
3. Test video playback
4. Close modal when done

### Edit a Lesson

1. Click **Edit** button on lesson
2. Modify content
3. Click **"Zapisz zmiany"**

### Delete a Lesson

1. Click **trash icon** on lesson
2. Confirm deletion
3. Lesson is permanently removed

---

## 🎯 Managing Quizzes

### Access Quiz Management

Go to **Admin Dashboard** → **Quizzes**

### Create a New Quiz

1. Click **"Dodaj nowy quiz"** button
2. Fill in the form:
   - **Title**: Quiz name (3-200 characters)
   - **Lesson**: Select from dropdown (shows Course - Lesson)
3. Add questions:
   - Click **"Dodaj pytanie"** to add more (max 50)
   - For each question:
     - Enter question text
     - Add 2-6 answer options
     - Click the **circle** to mark correct answer (green = correct)
     - Click **trash icon** to remove answer option
     - Click **trash icon** at top-right to remove question
4. Click **"Utwórz quiz"**

### Edit Existing Quiz

1. Find quiz in list
2. Click **"Edytuj"** button
3. Modify as needed
4. Click **"Zapisz zmiany"**

### Preview Quiz

1. Click **"Podgląd"** button
2. View all questions and answers
3. Correct answers are highlighted in green

### Delete Quiz

1. Click **trash icon**
2. Confirm deletion

---

## 📊 Viewing Analytics

### Access Analytics Dashboard

Go to **Admin Dashboard** (main page after login)

### Available Charts

#### 1. Activity Chart (Area Chart)

- Shows last 30 days of activity
- Three metrics:
  - **Blue**: New users
  - **Purple**: Course enrollments
  - **Green**: Quiz attempts
- Hover to see exact numbers per day

#### 2. Course Progress Chart (Bar Chart)

- Top 10 courses by enrollment
- **Blue bars**: Total enrollments
- **Green bars**: Completions
- Sorted by popularity

#### 3. Quiz Results - Distribution (Pie Chart)

- Shows score ranges:
  - **Red**: 0-25%
  - **Orange**: 25-50%
  - **Blue**: 50-75%
  - **Green**: 75-100%
- Displays average score and total attempts

#### 4. Quiz Results - Timeline (Line Chart)

- Average quiz scores over time
- Shows trends in student performance
- Hover to see exact score per day

---

## 📁 File Upload Tips

### Drag & Drop

1. Drag file from desktop
2. Drop onto upload area (blue border appears)
3. Wait for upload to complete

### Click to Upload

1. Click anywhere in upload area
2. Select file from dialog
3. Wait for upload to complete

### Supported Formats

- **PDF**: Documents, guides (max 10MB)
- **Video**: MP4, WebM (max 100MB)
- **Images**: JPEG, PNG, WebP, GIF (max 5MB)

### Managing Uploaded Files

- View all uploaded files below upload area
- Click **X** to remove a file
- Files show icon, name, type, and size

---

## 🎨 Rich Text Editor Tips

### Formatting Toolbar

- **Bold**: Ctrl/Cmd + B
- **Italic**: Ctrl/Cmd + I
- **Heading 2**: Click H2 button
- **Heading 3**: Click H3 button
- **Bullet List**: Click bullet icon
- **Numbered List**: Click number icon
- **Link**: Click link icon, enter URL
- **Clear Format**: Click eraser icon

### Best Practices

- Use H2 for main sections
- Use H3 for subsections
- Keep paragraphs short
- Use lists for steps or points
- Add links to external resources

---

## ⚠️ Troubleshooting

### File Upload Fails

- **Check file size**: Must be under limit
- **Check file type**: Only allowed types work
- **Check connection**: Ensure stable internet
- **Try again**: Refresh page and retry

### Drag & Drop Not Working

- **Check permissions**: Must be logged in as admin
- **Use mouse**: Touch/trackpad may not work well
- **Try keyboard**: Tab + Enter to edit instead

### Charts Not Loading

- **Check data**: Need users/courses/quizzes for data
- **Wait**: Charts may take a few seconds to load
- **Refresh**: Try refreshing the page
- **Check console**: Open browser console for errors

### Quiz Not Saving

- **Fill all fields**: Title and lesson are required
- **Check questions**: All questions need text
- **Check answers**: All answers need text
- **Mark correct**: Each question needs 1 correct answer

---

## 🔐 Permissions

All new features require **admin** role:

- Only admins can create/edit/delete lessons
- Only admins can upload files
- Only admins can create/edit/delete quizzes
- Only admins can view analytics

Students and instructors see these features as read-only or not at all.

---

## 📝 Notes

- All changes are saved immediately
- No "Save Draft" needed - lessons auto-save on submit
- Files are stored permanently in Supabase Storage
- Deleted items cannot be recovered
- Charts update automatically as new data comes in

---

## 🆘 Need Help?

If you encounter issues:

1. Check browser console for errors
2. Verify database migration was applied
3. Check Supabase Storage bucket exists
4. Ensure you're logged in as admin
5. Try clearing browser cache
6. Check network tab for failed requests

---

## 🎉 You're Ready!

Start by:

1. Creating a course
2. Adding lessons with content and materials
3. Creating quizzes for those lessons
4. Checking analytics as students engage

Enjoy your enhanced LMS! 🚀
