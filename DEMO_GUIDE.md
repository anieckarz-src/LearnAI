# 🎓 Przewodnik po Prezentacji - Uniwersytet AI

## 📋 Spis treści

1. [Dane logowania](#dane-logowania)
2. [Scenariusz prezentacji](#scenariusz-prezentacji)
3. [Kluczowe funkcje do pokazania](#kluczowe-funkcje-do-pokazania)
4. [Różnice między rolami](#różnice-między-rolami)
5. [Troubleshooting](#troubleshooting)

---

## 🔐 Dane logowania

### Administrator
- **Email:** `admin@demo.wsiiz.pl`
- **Hasło:** `Demo123!`
- **Uprawnienia:** Pełny dostęp do wszystkich funkcji platformy

### Prowadzący (Instructors)

**Dr Anna Nowak**
- **Email:** `dr.nowak@demo.wsiiz.pl`
- **Hasło:** `Demo123!`
- **Kursy:** Podstawy Programowania w Pythonie, Inżynieria Oprogramowania

**Prof. Piotr Wiśniewski**
- **Email:** `prof.wisniewski@demo.wsiiz.pl`
- **Hasło:** `Demo123!`
- **Kursy:** Bazy Danych i SQL, Programowanie Aplikacji Webowych

**Mgr Katarzyna Kamińska**
- **Email:** `mgr.kaminska@demo.wsiiz.pl`
- **Hasło:** `Demo123!`
- **Kursy:** Algorytmy i Struktury Danych

### Studenci

**Tomasz Lewandowski** (zaawansowany)
- **Email:** `student1@demo.wsiiz.pl`
- **Hasło:** `Demo123!`
- **Status:** Ukończył kurs Pythona, w trakcie kursu Baz Danych

**Maria Zielińska** (aktywna)
- **Email:** `student2@demo.wsiiz.pl`
- **Hasło:** `Demo123!`
- **Status:** Zapisana na 3 kursy, różny stopień zaawansowania

**Paweł Szymański**
- **Email:** `student3@demo.wsiiz.pl`
- **Hasło:** `Demo123!`
- **Status:** Kurs Algorytmów

---

## 🎬 Scenariusz prezentacji

### Część 1: Landing Page i Rejestracja (2-3 min)

1. **Pokaż stronę główną** (`http://localhost:3000`)
   - Nowoczesny design z gradientami
   - Profesjonalny branding (Uniwersytet AI)
   - Responsywność (pokaż na różnych szerokościach)

2. **Nawigacja**
   - Sticky navbar z efektem blur
   - Mobile menu (zmniejsz okno przeglądarki)

3. **Sekcje landing page**
   - Hero z animowanym tłem
   - Scrolling banner z kluczowymi informacjami
   - Sekcja funkcji (glass-morphism cards)
   - Statystyki z licznikami

### Część 2: Panel Studenta (5-7 min)

1. **Zaloguj się jako Maria Zielińska** (`student2@demo.wsiiz.pl`)
   
2. **Dashboard studenta** (`/dashboard`)
   - Przegląd zapisanych kursów
   - Postęp w kursach (progress bars)
   - Statystyki osobiste
   - Quick actions (kontynuuj naukę, przeglądaj kursy)

3. **Katalog kursów** (`/courses`)
   - Lista dostępnych kursów
   - Filtry i wyszukiwanie
   - Podgląd kursu (preview bez logowania)
   - Zapis na kurs

4. **Widok kursu** (wejdź w "Podstawy Programowania w Pythonie")
   - Struktura kursu (moduły i lekcje)
   - Progress tracking
   - Nawigacja między lekcjami

5. **Lekcja z treścią**
   - Wyświetlanie contentu HTML
   - Oznaczanie jako ukończone
   - Przejście do następnej lekcji

6. **Quiz**
   - Rozwiązywanie quizu
   - Timer (jeśli ustawiony)
   - Feedback po zakończeniu
   - Wyniki i statystyki

7. **AI Chatbot** (jeśli skonfigurowany)
   - Otwórz widget chatu
   - Zadaj pytanie związane z lekcją
   - Pokaż kontekstowe odpowiedzi

### Część 3: Panel Prowadzącego (5-7 min)

1. **Wyloguj się i zaloguj jako Dr Anna Nowak** (`dr.nowak@demo.wsiiz.pl`)

2. **Dashboard prowadzącego** (`/admin/dashboard`)
   - Statystyki **tylko własnych kursów**
   - Liczba studentów w swoich kursach
   - Średnie wyniki z quizów
   - Wykresy aktywności

3. **Zarządzanie kursami** (`/admin/courses`)
   - Lista **tylko własnych kursów**
   - Tworzenie nowego kursu
   - Edycja istniejącego kursu

4. **Edycja kursu - Moduły i Lekcje**
   - **Dodawanie modułu** (inline form)
   - **Dodawanie lekcji** do modułu
   - **Drag & Drop** - zmiana kolejności modułów
   - **Drag & Drop lekcji** między modułami (podświetlenie drop zone)
   - **Edycja inline** - kliknij edit na lekcji
   - **Context menu** - prawy przycisk na module/lekcji

5. **Keyboard shortcuts**
   - `Ctrl+M` - Dodaj nowy moduł
   - `Escape` - Anuluj formularz

6. **Zarządzanie quizami** (`/admin/quizzes`)
   - Lista quizów z własnych kursów
   - Tworzenie quizu
   - Generowanie quizu z AI (jeśli skonfigurowane)
   - Podgląd wyników studentów

7. **Ograniczenia prowadzącego**
   - Brak dostępu do "Użytkownicy" (ukryte w menu)
   - Brak dostępu do "Ustawienia" (ukryte w menu)
   - Próba dostępu do `/admin/users` → przekierowanie/błąd 403

### Część 4: Panel Administratora (5-7 min)

1. **Wyloguj się i zaloguj jako Admin** (`admin@demo.wsiiz.pl`)

2. **Dashboard administratora** (`/admin/dashboard`)
   - Statystyki **wszystkich kursów**
   - Wszystkie użytkownicy
   - Wykresy globalne
   - Porównaj z dashboardem prowadzącego

3. **Zarządzanie użytkownikami** (`/admin/users`)
   - Lista wszystkich użytkowników
   - Filtry (rola, status)
   - Tworzenie nowego użytkownika
   - Zmiana roli użytkownika (user → instructor)
   - Blokowanie/odblokowanie konta

4. **Zarządzanie wszystkimi kursami** (`/admin/courses`)
   - Widzi **wszystkie kursy** (różnych prowadzących)
   - Może edytować każdy kurs
   - Może usunąć każdy kurs

5. **Ustawienia systemowe** (`/admin/settings`)
   - Nazwa platformy
   - Ustawienia AI (model, temperatura)
   - Ustawienia quizów (domyślna liczba pytań)
   - Rate limiting

6. **Audit Log** (jeśli zaimplementowany)
   - Historia akcji administratorów
   - Kto, co, kiedy zmienił

### Część 5: Zaawansowane Funkcje (3-5 min)

1. **File Upload**
   - Wróć do edycji kursu jako prowadzący
   - Dodaj lekcję z plikiem PDF/obrazem
   - Drag & drop upload
   - Podgląd uploaded files

2. **Video Lessons**
   - Dodaj lekcję z video URL (Vimeo/YouTube)
   - Automatyczne embedding

3. **Quiz Generation z AI** (jeśli skonfigurowane)
   - Wygeneruj quiz z contentu lekcji
   - Wybierz poziom trudności
   - Edytuj wygenerowane pytania

4. **Bulk Operations**
   - Zaznacz wiele lekcji
   - Bulk move do innego modułu
   - Bulk delete

5. **Responsive Design**
   - Zmień szerokość okna przeglądarki
   - Pokaż mobile menu
   - Pokaż responsywne tabele

---

## 🎯 Kluczowe funkcje do pokazania

### Must-Have (koniecznie pokaż)

- ✅ **3 role użytkowników** (admin, instructor, student)
- ✅ **Drag & Drop** modułów i lekcji (nawet między modułami!)
- ✅ **Inline editing** - formularze bez przeładowania strony
- ✅ **Context menu** - prawy przycisk myszy
- ✅ **Keyboard shortcuts** - Ctrl+M, Escape
- ✅ **Progress tracking** - postęp studenta w kursach
- ✅ **Quizy** - tworzenie, rozwiązywanie, wyniki
- ✅ **Filtrowanie danych** dla instructor (tylko własne kursy)
- ✅ **Profesjonalny branding** - spójny design w całej aplikacji

### Nice-to-Have (jeśli starczy czasu)

- ⭐ **AI Chatbot** - kontekstowa pomoc
- ⭐ **AI Quiz Generation** - automatyczne generowanie pytań
- ⭐ **File Upload** - materiały do lekcji
- ⭐ **Video Embedding** - Vimeo/YouTube
- ⭐ **Animacje** - smooth transitions, glass-morphism
- ⭐ **Mobile responsiveness** - działanie na telefonie
- ⭐ **Audit Log** - historia zmian

---

## 🔄 Różnice między rolami

### Tabela porównawcza

| Funkcja | Student | Instructor | Admin |
|---------|---------|------------|-------|
| Przeglądanie kursów | ✅ Wszystkie opublikowane | ✅ Wszystkie | ✅ Wszystkie |
| Zapisywanie się na kursy | ✅ | ❌ | ❌ |
| Rozwiązywanie quizów | ✅ | ❌ | ❌ |
| Tworzenie kursów | ❌ | ✅ Własne | ✅ Wszystkie |
| Edycja kursów | ❌ | ✅ Tylko własne | ✅ Wszystkie |
| Usuwanie kursów | ❌ | ✅ Tylko własne | ✅ Wszystkie |
| Zarządzanie modułami/lekcjami | ❌ | ✅ W swoich kursach | ✅ We wszystkich |
| Tworzenie quizów | ❌ | ✅ W swoich kursach | ✅ We wszystkich |
| Generowanie quizów AI | ❌ | ✅ | ✅ |
| Przeglądanie wyników studentów | ❌ | ✅ Tylko swoje kursy | ✅ Wszystkie |
| Zarządzanie użytkownikami | ❌ | ❌ | ✅ |
| Zmiana ról użytkowników | ❌ | ❌ | ✅ |
| Blokowanie kont | ❌ | ❌ | ✅ |
| Ustawienia systemowe | ❌ | ❌ | ✅ |
| Dostęp do Audit Log | ❌ | ❌ | ✅ |

### Różnice w UI

**Sidebar:**
- **Student:** Widzi "Dashboard", "Moje kursy", "Katalog", "Profil"
- **Instructor:** Widzi "Dashboard", "Kursy", "Quizy" (bez "Użytkownicy" i "Ustawienia")
- **Admin:** Widzi wszystko: "Dashboard", "Użytkownicy", "Kursy", "Quizy", "Ustawienia"

**Dashboard:**
- **Student:** Własne kursy, własne postępy, własne wyniki quizów
- **Instructor:** Statystyki tylko swoich kursów, studenci w swoich kursach
- **Admin:** Globalne statystyki, wszyscy użytkownicy, wszystkie kursy

**Lista kursów:**
- **Instructor:** Widzi tylko kursy gdzie `instructor_id = user.id`
- **Admin:** Widzi wszystkie kursy

---

## 🐛 Troubleshooting

### Problem: Nie mogę się zalogować

**Rozwiązanie:**
1. Sprawdź czy użytkownicy zostali utworzeni w Supabase Auth
2. Seed data tworzy tylko rekordy w tabeli `users`, ale nie w `auth.users`
3. Musisz ręcznie utworzyć użytkowników w Supabase Dashboard → Authentication
4. Lub użyj funkcji rejestracji i potem zmień rolę w bazie danych

### Problem: Instructor widzi wszystkie kursy

**Rozwiązanie:**
1. Sprawdź czy migracja `018_restore_instructor_role.sql` została wykonana
2. Sprawdź czy kursy mają poprawnie ustawione `instructor_id`
3. Sprawdź logi w konsoli przeglądarki - może być błąd w API

### Problem: Brak danych demo

**Rozwiązanie:**
1. Uruchom migrację `019_demo_seed_data.sql`:
   ```bash
   # W Supabase Dashboard → SQL Editor
   # Skopiuj i wykonaj zawartość pliku
   ```
2. Lub użyj Supabase CLI:
   ```bash
   supabase db reset
   ```

### Problem: Drag & Drop nie działa

**Rozwiązanie:**
1. Sprawdź czy zainstalowane są zależności `@dnd-kit/*`
2. Sprawdź konsolę przeglądarki - mogą być błędy JS
3. Upewnij się że używasz najnowszej wersji React 19

### Problem: AI Chatbot nie odpowiada

**Rozwiązanie:**
1. Sprawdź czy ustawiony jest `OPENAI_API_KEY` w `.env`
2. Sprawdź rate limiting - może być przekroczony limit
3. Sprawdź logi serwera - mogą być błędy API

### Problem: Quizy nie zapisują wyników

**Rozwiązanie:**
1. Sprawdź czy użytkownik jest zapisany na kurs (`course_enrollments`)
2. Sprawdź RLS policies w Supabase
3. Sprawdź logi w konsoli - mogą być błędy 403

### Problem: Animacje nie działają płynnie

**Rozwiązanie:**
1. Sprawdź czy używasz najnowszej wersji Tailwind 4
2. Wyłącz DevTools w przeglądarce (spowalniają animacje)
3. Sprawdź czy nie ma zbyt wielu elementów na stronie

---

## 📊 Statystyki Demo Data

- **Użytkownicy:** 9 (1 admin, 3 instructors, 5 students)
- **Kursy:** 5 (4 published, 1 draft)
- **Moduły:** 20 (4-5 na kurs)
- **Lekcje:** ~15 (przykładowe w pierwszych modułach)
- **Quizy:** 2 (z pytaniami wielokrotnego wyboru)
- **Enrollments:** 10 (studenci zapisani na różne kursy)
- **Quiz Attempts:** 6 (różne wyniki 60-100%)
- **Lesson Progress:** ~10 (niektóre ukończone)

---

## 🎓 Technologie użyte

### Frontend
- **Astro 5.13.7** - Framework
- **React 19.1.1** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4.1.13** - Styling
- **shadcn/ui** - UI components

### Backend
- **Supabase** - BaaS (Auth, Database, Storage)
- **PostgreSQL** - Database z RLS
- **Astro API Routes** - Server endpoints

### Biblioteki
- **@dnd-kit** - Drag & Drop
- **react-hook-form + zod** - Walidacja formularzy
- **recharts** - Wykresy
- **lucide-react** - Ikony
- **OpenAI API** - AI features (opcjonalnie)

---

## 📝 Notatki dla prezentacji

### Mocne strony do podkreślenia

1. **Architektura 3-warstwowa:**
   - Frontend (Astro + React)
   - Backend (Supabase + API Routes)
   - Database (PostgreSQL z RLS)

2. **Bezpieczeństwo:**
   - Row Level Security (RLS) w bazie
   - Middleware authorization
   - Role-based access control (RBAC)
   - Walidacja danych (zod)

3. **UX/UI:**
   - Smooth animations
   - Drag & Drop
   - Inline editing (bez przeładowań)
   - Context menu
   - Keyboard shortcuts
   - Responsive design

4. **Skalowalność:**
   - Optimistic UI updates
   - Lazy loading
   - Pagination
   - Efficient queries

5. **Funkcje AI:**
   - Kontekstowy chatbot
   - Automatyczne generowanie quizów
   - Rate limiting dla AI

### Potencjalne pytania

**Q: Dlaczego Astro zamiast Next.js?**
A: Astro oferuje lepszą wydajność (partial hydration), prostszą integrację z różnymi frameworkami, i mniejszy bundle size. Idealny dla content-heavy aplikacji jak LMS.

**Q: Jak działa system uprawnień?**
A: Trzy warstwy: middleware (routing), RLS policies (database), API checks (business logic). Instructor może tylko swoje kursy, admin wszystko.

**Q: Czy to gotowe do produkcji?**
A: Architektura tak, ale potrzebne są: testy E2E, monitoring, backup strategy, GDPR compliance, email notifications.

**Q: Jak skaluje się z liczbą użytkowników?**
A: Supabase skaluje automatycznie, optimistic updates redukują load, pagination i lazy loading dla dużych zbiorów danych.

---

## ✅ Checklist przed prezentacją

- [ ] Uruchom `npm run dev`
- [ ] Sprawdź czy wszystkie migracje zostały wykonane
- [ ] Sprawdź czy dane demo są w bazie
- [ ] Przetestuj logowanie wszystkimi kontami
- [ ] Sprawdź czy nie ma błędów w konsoli
- [ ] Przygotuj 2-3 okna przeglądarki (różne role)
- [ ] Wyłącz notyfikacje systemowe
- [ ] Zwiększ zoom w przeglądarce dla lepszej widoczności
- [ ] Przygotuj backup plan (screenshoty/video)

---

**Powodzenia na prezentacji! 🎉**
