# 10x Astro Starter - LearnAI Platform

A modern, full-stack educational platform with landing page and admin panel, built with Astro, React, and Supabase.

## ✨ What's New

This starter now includes:

### 🎓 **Complete Admin Panel**

- Full-featured admin dashboard for managing educational platform
- User management (roles, permissions, blocking)
- Course and lesson management (CRUD operations)
- Quiz management with AI generation support
- Content moderation system
- System settings configuration

[📖 Full Admin Panel Documentation](./ADMIN_PANEL.md)

### 🌟 **Professional Landing Page**

- Modern dark theme with animated gradients
- Fully responsive (mobile-first design)
- Accessibility-first approach (WCAG AA compliant)
- Smooth animations and interactions
- Optimized performance
- SEO-ready with meta tags

[📖 Full Landing Page Documentation](./LANDING_PAGE.md)

## Tech Stack

### Frontend

- [Astro](https://astro.build/) v5.13.7 - Modern web framework for building fast, content-focused websites
- [React](https://react.dev/) v19.1.1 - UI library for building interactive components
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4.1.13 - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Re-usable UI components

### Backend

- [Supabase](https://supabase.com/) - Backend-as-a-Service (Auth, Database, Storage)
- PostgreSQL - Database with Row Level Security
- Astro API Routes - Server-side endpoints

### Additional Libraries

- recharts - Data visualization
- react-hook-form + zod - Form validation
- date-fns - Date formatting
- lucide-react - Icon library

## Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/przeprogramowani/10x-astro-starter.git
cd 10x-astro-starter
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) to see the landing page

5. Build for production:

```bash
npm run build
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Key Features

### Admin Panel (`/admin/dashboard`)

- **Dashboard:** Overview with key metrics and statistics
- **User Management:** CRUD operations, role assignment, account blocking
- **Course Management:** Create, edit, publish courses and lessons
- **Quiz Management:** View, create, delete quizzes (AI generation ready)
- **System Settings:** Configure platform, AI, security settings
- **Audit Logging:** Track all admin actions

### Authentication & Security

- Supabase authentication integration
- Role-based access control (Admin, Instructor, Student)
- Row Level Security (RLS) policies
- Middleware protection for admin routes
- Session management

### Database Schema

- Users (with roles and blocking)
- Courses, Lessons, Quizzes
- Course Enrollments
- Quiz Attempts
- System Settings
- Audit Log

## Project Structure

```
.
├── src/
│   ├── components/
│   │   ├── landing/       # Landing page components
│   │   ├── admin/         # Admin panel components
│   │   └── ui/            # Reusable UI components (shadcn/ui)
│   ├── layouts/
│   │   ├── Layout.astro   # Main layout
│   │   └── AdminLayout.astro  # Admin panel layout
│   ├── pages/
│   │   ├── index.astro    # Landing page
│   │   ├── login.astro    # Login page
│   │   ├── admin/         # Admin panel pages
│   │   │   ├── dashboard.astro
│   │   │   ├── users/
│   │   │   ├── courses/
│   │   │   ├── quizzes/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   └── api/           # API endpoints
│   │       └── admin/     # Admin API routes
│   ├── middleware/        # Astro middleware (auth)
│   ├── db/                # Supabase client & types
│   ├── lib/               # Utilities and helpers
│   ├── types.ts           # TypeScript types
│   └── styles/            # Global styles
├── supabase/
│   ├── migrations/        # Database migrations
│   └── README.md          # Supabase setup guide
└── public/                # Public assets
```

## Landing Page Features

### Sections

1. **Navigation** - Sticky navbar with mobile menu
2. **Hero** - Eye-catching hero with animated gradient background
3. **Scrolling Banner** - Infinite scroll with key benefits
4. **Value Proposition** - Platform benefits with AI chatbot mockup
5. **Key Facts** - Statistics with animated counters
6. **Features** - Grid of platform features with glass-morphism cards
7. **Control Section** - Light section with CTA
8. **Footer** - Complete footer with links and social media

### Key Features

- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ Accessibility optimized (ARIA labels, semantic HTML)
- ✅ SEO-ready (meta tags, Open Graph, Twitter Cards)
- ✅ Smooth animations (CSS + JavaScript)
- ✅ Glass-morphism effects
- ✅ Animated counters
- ✅ Infinite scroll banner
- ✅ Mobile-friendly navigation
- ✅ **Global color system** - kolory z landing page dostępne w całej aplikacji

See [LANDING_PAGE.md](./LANDING_PAGE.md) for detailed documentation.

## 🎨 Global Color System

Wszystkie kolory z landing page są dostępne globalnie jako zmienne CSS i klasy Tailwind, dzięki czemu możesz zachować spójność designu w całej aplikacji.

### Quick Start

```html
<!-- Primary button (jak na landing page) -->
<button class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg">Przycisk</button>

<!-- Glass-morphism card (jak w Features) -->
<div
  class="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
>
  Karta
</div>

<!-- Gradient text (jak w Hero) -->
<h1 class="text-6xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
  Gradient Text
</h1>
```

### Available Components

- `src/components/ui/Button.astro` - Button component z wariantami (primary, secondary, outline, ghost)
- `src/components/ui/Card.astro` - Card component z efektami (default, glass, gradient, glow)

### Color Documentation

📖 **[COLOR_SYSTEM.md](./COLOR_SYSTEM.md)** - Pełna dokumentacja systemu kolorów z przykładami

🎨 **[/colors-example](http://localhost:3000/colors-example)** - Live demo wszystkich kolorów i komponentów

### Key Colors

- **Primary Blue:** `blue-600` (#3B82F6) - główny kolor akcji
- **Primary Hover:** `blue-700` (#2563EB) - hover state
- **Primary Light:** `blue-400` (#60A5FA) - jasny akcent
- **Background:** `slate-900` (#0F172A) - główne tło
- **Accent Purple:** `purple-900` (#581C87) - fioletowy akcent w gradientach

## Customization

### Change Platform Name

Edit the following files:

- `src/components/landing/Navbar.astro`
- `src/components/landing/Footer.astro`
- `src/layouts/Layout.astro`

### Update Statistics

Edit `src/components/landing/StatsSection.astro` and update the `data-counter` attributes.

### Modify Colors

Colors are defined using Tailwind classes. Main colors:

- Primary: `blue-600` (#3B82F6)
- Dark backgrounds: `slate-900`, `slate-950`
- Text: `white`, `gray-300`, `gray-400`

## AI Development Support

This project is configured with AI development tools to enhance the development experience, providing guidelines for:

- Project structure
- Coding practices
- Frontend development
- Styling with Tailwind
- Accessibility best practices
- Astro and React guidelines

### Cursor IDE

The project includes AI rules in `.cursor/rules/` directory that help Cursor IDE understand the project structure and provide better code suggestions.

### GitHub Copilot

AI instructions for GitHub Copilot are available in `.github/copilot-instructions.md`

### Windsurf

The `.windsurfrules` file contains AI configuration for Windsurf.

## Contributing

Please follow the AI guidelines and coding practices defined in the AI configuration files when contributing to this project.

## License

MIT

---

**Built with ❤️ using Astro, React, and Tailwind CSS**
