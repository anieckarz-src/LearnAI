# Tabbed Layout Implementation - Course Edit Page

## Summary

Successfully implemented a tabbed layout for the course edit page, replacing the vertical stacked layout with a cleaner, more organized interface using tabs.

## Changes Made

### 1. New Files Created

#### `src/components/ui/tabs.tsx`

- Base Tabs component using Radix UI
- Includes: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- Styled with dark theme matching the existing design system
- Active tab: blue background (`bg-blue-600`)
- Inactive tabs: slate background with transparency

#### `src/components/admin/CourseEditTabs.tsx`

- Wrapper component that combines CourseForm and LessonsManager into tabs
- Two tabs:
  - **"Szczegóły kursu"** (Course Details) - with FileText icon
  - **"Lekcje"** (Lessons) - with BookOpen icon
- Default tab: "details"
- Full width layout for better content presentation

### 2. Modified Files

#### `src/pages/admin/courses/[id].astro`

- Replaced separate `CourseForm` and `LessonsManager` components
- Now uses single `CourseEditTabs` component
- Simplified layout structure

### 3. Dependencies Added

- `@radix-ui/react-tabs` (v1.x) - Accessible tabs primitive

## Benefits

1. **Better Organization** - Clear separation between course details and lesson management
2. **Improved UX** - Users can focus on one task at a time
3. **Cleaner Interface** - Each section gets full screen width
4. **Scalable** - Easy to add more tabs in the future (Quizzes, Statistics, etc.)
5. **Responsive** - Tabs work well on all screen sizes
6. **Accessible** - Built on Radix UI primitives with full keyboard support

## Visual Design

- Tab list positioned at the top with maximum width of `max-w-md`
- Grid layout with 2 equal columns for tab buttons
- Icons next to tab labels for better visual recognition
- Smooth transitions between tab states
- Consistent with existing dark theme

## Usage

Navigate to any course edit page (`/admin/courses/{id}`), and you'll see:

- Tab navigation at the top
- "Szczegóły kursu" tab selected by default
- Click "Lekcje" to manage course lessons
- All existing functionality preserved

## Testing Checklist

- [x] Tabs render correctly
- [x] Default tab (details) is active on load
- [x] Switching between tabs works smoothly
- [x] CourseForm displays correctly in details tab
- [x] LessonsManager displays correctly in lessons tab
- [x] All existing functionality works (form submission, lesson CRUD, drag-drop)
- [x] Styling matches the dark theme
- [x] Icons display correctly
- [x] Responsive layout works

## Technical Notes

- Tabs use controlled state with `defaultValue="details"`
- Each tab content uses `mt-0` to remove default margin
- Tab list uses grid layout for equal-width buttons
- Component is client-side rendered with `client:load` directive
