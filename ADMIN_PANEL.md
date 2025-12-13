# Panel Administracyjny LearnAI

Kompleksowy panel administracyjny dla platformy edukacyjnej LearnAI, zbudowany z wykorzystaniem Astro, React i Supabase.

## 🎯 Funkcjonalności

### 1. Dashboard

- Przegląd kluczowych statystyk platformy
- Liczba użytkowników, kursów, aktywnych studentów
- Statystyki quizów i zgłoszeń
- Szybkie akcje do najważniejszych sekcji

### 2. Zarządzanie użytkownikami

- Lista wszystkich użytkowników z paginacją
- Filtrowanie po roli (admin/instructor/student)
- Wyszukiwanie po email lub nazwie
- Edycja profili użytkowników
- Zmiana ról
- Blokowanie/odblokowywanie kont
- Historia logowań

### 3. Zarządzanie kursami

- Przeglądanie wszystkich kursów w widoku siatki
- Filtrowanie po statusie (published/draft/archived)
- Tworzenie nowych kursów
- Edycja kursów i lekcji
- Publikacja/wycofanie kursów
- Usuwanie kursów
- Zarządzanie lekcjami w ramach kursu

### 4. Zarządzanie quizami

- Lista wszystkich quizów
- Podgląd pytań i odpowiedzi
- Wskaźnik quizów wygenerowanych przez AI
- Statystyki podejść do quizów
- Usuwanie quizów

### 5. Moderacja treści

- Lista zgłoszeń użytkowników
- Filtrowanie po statusie (pending/reviewed/resolved)
- Filtrowanie po typie treści (course/lesson/comment)
- Aktualizacja statusu zgłoszeń
- Historia moderacji

### 6. Ustawienia systemu

- **Ogólne:** nazwa platformy, email kontaktowy
- **AI Chatbot:** model, temperature, max tokens, system prompt
- **Quizy:** domyślna liczba pytań, poziom trudności
- **Bezpieczeństwo:** timeout sesji, rate limiting

## 📁 Struktura projektu

```
src/
├── components/
│   ├── admin/
│   │   ├── Sidebar.tsx              # Nawigacja boczna
│   │   ├── DashboardContent.tsx     # Dashboard z statystykami
│   │   ├── UsersManagement.tsx      # Zarządzanie użytkownikami
│   │   ├── UserModal.tsx            # Modal edycji użytkownika
│   │   ├── CoursesManagement.tsx    # Zarządzanie kursami
│   │   ├── QuizzesManagement.tsx    # Zarządzanie quizami
│   │   ├── ReportsManagement.tsx    # Moderacja treści
│   │   └── SettingsManagement.tsx   # Ustawienia systemu
│   └── ui/                          # Komponenty UI (shadcn/ui)
├── layouts/
│   └── AdminLayout.astro            # Layout dla panelu admina
├── pages/
│   ├── admin/
│   │   ├── dashboard.astro          # Dashboard
│   │   ├── users/
│   │   │   └── index.astro          # Lista użytkowników
│   │   ├── courses/
│   │   │   └── index.astro          # Lista kursów
│   │   ├── quizzes/
│   │   │   └── index.astro          # Lista quizów
│   │   ├── reports/
│   │   │   └── index.astro          # Zgłoszenia
│   │   └── settings/
│   │       └── index.astro          # Ustawienia
│   └── api/
│       └── admin/
│           ├── stats/
│           │   └── overview.ts      # API statystyk
│           ├── users/
│           │   ├── index.ts         # Lista użytkowników
│           │   ├── [id].ts          # Szczegóły/edycja
│           │   └── [id]/block.ts    # Blokowanie
│           ├── courses/
│           │   ├── index.ts         # Lista/tworzenie
│           │   └── [id].ts          # Szczegóły/edycja/usuwanie
│           ├── lessons/
│           │   ├── index.ts         # Lista/tworzenie
│           │   └── [id].ts          # Edycja/usuwanie
│           ├── quizzes/
│           │   ├── index.ts         # Lista/tworzenie
│           │   └── [id].ts          # Szczegóły/usuwanie
│           ├── reports/
│           │   ├── index.ts         # Lista zgłoszeń
│           │   └── [id].ts          # Aktualizacja statusu
│           └── settings/
│               └── index.ts         # Odczyt/zapis ustawień
├── middleware/
│   └── index.ts                     # Middleware autoryzacji
├── db/
│   ├── supabase.client.ts          # Klient Supabase
│   └── database.types.ts           # Typy bazy danych
└── types.ts                        # Typy TypeScript

supabase/
├── migrations/
│   ├── 001_initial_schema.sql      # Schemat bazy danych
│   ├── 002_row_level_security.sql  # Polityki RLS
│   └── 003_seed_data.sql           # Dane początkowe
└── README.md                       # Instrukcje setup Supabase
```

## 🚀 Rozpoczęcie pracy

### 1. Instalacja zależności

Wszystkie wymagane pakiety zostały już zainstalowane:

- @supabase/supabase-js
- recharts (dla wykresów)
- @tanstack/react-table (dla zaawansowanych tabel)
- react-hook-form + zod (dla formularzy)
- date-fns (dla dat)
- lucide-react (ikony)

### 2. Konfiguracja Supabase

Szczegółowe instrukcje znajdują się w `supabase/README.md`. W skrócie:

1. Utwórz projekt w Supabase
2. Dodaj zmienne środowiskowe do `.env`:

```env
PUBLIC_SUPABASE_URL=twój_url
PUBLIC_SUPABASE_ANON_KEY=twój_klucz
```

3. Uruchom migracje SQL w kolejności (001, 002, 003)
4. Utwórz pierwszego użytkownika admina

### 3. Uruchomienie aplikacji

```bash
npm run dev
```

Panel administracyjny będzie dostępny pod adresem `/admin/dashboard`.

## 🔒 Bezpieczeństwo

### Middleware

- Automatyczna weryfikacja sesji Supabase
- Sprawdzanie roli administratora dla ścieżek `/admin/*`
- Przekierowanie nieautoryzowanych użytkowników
- Blokowanie dostępu dla zablokowanych kont

### Row Level Security (RLS)

Wszystkie tabele mają włączone RLS z politykami:

- Admini: pełny dostęp do wszystkich danych
- Instructorzy: dostęp do swoich kursów
- Studenci: odczyt opublikowanych kursów
- Użytkownicy mogą edytować swoje profile (z ograniczeniami)

### Audit Log

Wszystkie ważne akcje administratora są logowane:

- Tworzenie/edycja/usuwanie kursów
- Modyfikacje użytkowników
- Zmiana ustawień systemu
- Moderacja treści

## 🎨 Design System

Panel admina wykorzystuje istniejący system kolorów z landing page:

- **Primary Blue:** `blue-600` (#3B82F6)
- **Primary Hover:** `blue-700` (#2563EB)
- **Background:** `slate-900`, `slate-950`
- **Cards:** `slate-800/50` z backdrop-blur (glass-morphism)
- **Borders:** `white/10`
- **Text:** `white`, `gray-300`, `gray-400`

### Komponenty UI

Wykorzystuje shadcn/ui:

- Button, Card, Input, Table
- Badge (dla statusów i ról)
- Dialog/Modal (dla formularzy)

## 📱 Responsywność

Panel jest w pełni responsywny:

- Desktop: pełny layout z sidebar
- Tablet: sidebar zwijany
- Mobile: hamburger menu, optymalizowane widoki tabel

## ♿ Dostępność

- Pełna obsługa klawiatury (Tab, Enter, Escape)
- ARIA labels dla wszystkich interaktywnych elementów
- Semantyczny HTML
- Focus states dla wszystkich kontrolek
- Kontrast kolorów zgodny z WCAG AA

## 🔧 Rozszerzanie panelu

### Dodawanie nowej sekcji

1. **Stwórz API endpoint:**

```typescript
// src/pages/api/admin/your-section/index.ts
export const GET: APIRoute = async ({ locals }) => {
  // implementacja
};
```

2. **Stwórz komponent React:**

```tsx
// src/components/admin/YourSection.tsx
export function YourSection() {
  // implementacja
}
```

3. **Stwórz stronę Astro:**

```astro
<!-- src/pages/admin/your-section/index.astro -->
<AdminLayout title="Your Section" user={user} currentPath={Astro.url.pathname}>
  <div id="your-section"></div>
  <script>
    // mount React component
  </script>
</AdminLayout>
```

4. **Dodaj do nawigacji:**

```tsx
// src/components/admin/Sidebar.tsx
const navigation = [
  // ... existing items
  { name: "Your Section", href: "/admin/your-section", icon: YourIcon },
];
```

## 📊 API Endpoints

Pełna dokumentacja API:

### Users

- `GET /api/admin/users` - lista użytkowników
- `GET /api/admin/users/[id]` - szczegóły użytkownika
- `PATCH /api/admin/users/[id]` - edycja użytkownika
- `POST /api/admin/users/[id]/block` - blokowanie/odblokowanie

### Courses

- `GET /api/admin/courses` - lista kursów
- `POST /api/admin/courses` - tworzenie kursu
- `GET /api/admin/courses/[id]` - szczegóły kursu
- `PATCH /api/admin/courses/[id]` - edycja kursu
- `DELETE /api/admin/courses/[id]` - usuwanie kursu

### Lessons

- `GET /api/admin/lessons` - lista lekcji
- `POST /api/admin/lessons` - tworzenie lekcji
- `PATCH /api/admin/lessons/[id]` - edycja lekcji
- `DELETE /api/admin/lessons/[id]` - usuwanie lekcji

### Quizzes

- `GET /api/admin/quizzes` - lista quizów
- `POST /api/admin/quizzes` - tworzenie quizu
- `GET /api/admin/quizzes/[id]` - szczegóły quizu
- `DELETE /api/admin/quizzes/[id]` - usuwanie quizu

### Reports

- `GET /api/admin/reports` - lista zgłoszeń
- `PATCH /api/admin/reports/[id]` - aktualizacja statusu

### Settings

- `GET /api/admin/settings` - wszystkie ustawienia
- `PATCH /api/admin/settings` - aktualizacja ustawień

### Stats

- `GET /api/admin/stats/overview` - statystyki dashboard

## 🐛 Debugging

W przypadku problemów:

1. **Sprawdź logi konsoli przeglądarki**
2. **Sprawdź logi terminala (dev server)**
3. **Zweryfikuj połączenie z Supabase:**
   - Sprawdź zmienne środowiskowe
   - Sprawdź RLS policies w Supabase Studio
4. **Sprawdź middleware:** czy użytkownik ma rolę admin

## 📝 Notatki

- Panel wymaga aktywnego połączenia z Supabase
- Wszystkie operacje są logowane w tabeli audit_log
- Dane są walidowane zarówno po stronie klienta (Zod) jak i serwera
- Implementacja obsługuje zarówno SSR (Astro) jak i CSR (React)

## 🤝 Contributing

Przy dodawaniu nowych funkcjonalności:

1. Zachowaj istniejący styl kodu
2. Dodaj odpowiednie typy TypeScript
3. Implementuj obsługę błędów
4. Zachowaj accessibility
5. Dodaj audit logging dla ważnych akcji
