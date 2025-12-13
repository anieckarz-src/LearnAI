# Konfiguracja Supabase - Instrukcje

## ✅ Krok 1: Plik .env

Utwórz plik `.env` w głównym katalogu projektu i dodaj:

```env
PUBLIC_SUPABASE_URL=https://zcpdsrpyiprtcdsxuprk.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjcGRzcnB5aXBydGNkc3h1cHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MTU0NTEsImV4cCI6MjA4MTE5MTQ1MX0.alPXogbyNbzObVN-nRLzvBLP4v6QXs2_wemHKe5QnWo
```

## ✅ Krok 2: Uruchomienie migracji SQL w Supabase

### Opcja A: Przez Supabase Dashboard (ZALECANE)

1. Przejdź do https://supabase.com/dashboard
2. Wybierz swój projekt
3. W menu bocznym kliknij **SQL Editor**
4. Kliknij **New query**
5. Skopiuj i uruchom każdą migrację w kolejności:

#### Migracja 1: Schema (001_initial_schema.sql)
Skopiuj zawartość z `supabase/migrations/001_initial_schema.sql` i uruchom.

#### Migracja 2: Row Level Security (002_row_level_security.sql)
Skopiuj zawartość z `supabase/migrations/002_row_level_security.sql` i uruchom.

#### Migracja 3: Seed Data (003_seed_data.sql)
Skopiuj zawartość z `supabase/migrations/003_seed_data.sql` i uruchom.

### Opcja B: Przez Supabase CLI

```bash
# Zainstaluj Supabase CLI (jeśli nie masz)
npm install -g supabase

# Link do projektu
supabase link --project-ref zcpdsrpyiprtcdsxuprk

# Uruchom migracje
supabase db push
```

## ✅ Krok 3: Utworzenie pierwszego użytkownika Admin

### 3.1 Zarejestruj użytkownika przez Supabase Auth

1. W Supabase Dashboard → **Authentication** → **Users**
2. Kliknij **Add user** → **Create new user**
3. Wprowadź email i hasło (np. admin@example.com)
4. Skopiuj **UUID** nowo utworzonego użytkownika

### 3.2 Dodaj użytkownika do tabeli users z rolą admin

W **SQL Editor** uruchom (zamień UUID):

```sql
INSERT INTO public.users (id, email, full_name, role)
VALUES (
  'WKLEJ-TUTAJ-UUID-Z-AUTH-USERS',
  'admin@example.com',
  'Admin User',
  'admin'
);
```

Przykład z prawdziwym UUID:
```sql
INSERT INTO public.users (id, email, full_name, role)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'admin@example.com',
  'Admin User',
  'admin'
);
```

## ✅ Krok 4: Weryfikacja

### Sprawdź czy tabele zostały utworzone:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Powinny być widoczne:
- users
- courses
- lessons
- quizzes
- quiz_attempts
- content_reports
- system_settings
- course_enrollments
- audit_log

### Sprawdź ustawienia systemowe:

```sql
SELECT * FROM public.system_settings;
```

Powinno być ~10 rekordów z domyślnymi ustawieniami.

### Sprawdź użytkownika admin:

```sql
SELECT * FROM public.users WHERE role = 'admin';
```

## ✅ Krok 5: Uruchomienie aplikacji

```bash
npm run dev
```

## ✅ Krok 6: Test logowania

1. Otwórz http://localhost:3000/login
2. Zaloguj się emailem i hasłem użytkownika admin
3. Zostaniesz przekierowany do http://localhost:3000/admin/dashboard

## 🔒 Bezpieczeństwo

✅ Row Level Security (RLS) jest włączone na wszystkich tabelach
✅ Tylko administratorzy mają dostęp do /admin/*
✅ API endpoints są chronione middleware

## 🐛 Rozwiązywanie problemów

### Problem: "Missing Supabase environment variables"
**Rozwiązanie:** Sprawdź czy plik `.env` istnieje i zawiera poprawne klucze

### Problem: "User not found" po zalogowaniu
**Rozwiązanie:** Upewnij się, że UUID w tabeli `users` odpowiada UUID z `auth.users`

### Problem: "Unauthorized" przy dostępie do /admin
**Rozwiązanie:** Sprawdź czy użytkownik ma rolę 'admin' w tabeli users:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'twoj@email.com';
```

### Problem: Tabele nie istnieją
**Rozwiązanie:** Uruchom ponownie migracje w kolejności 001 → 002 → 003

## 📚 Następne kroki

Po skonfigurowaniu możesz:
1. Dodać więcej użytkowników z rolami instructor/student
2. Utworzyć kursy w panelu admina
3. Skonfigurować ustawienia w /admin/settings
4. Dostosować platformę do swoich potrzeb

---

**Potrzebujesz pomocy?** Sprawdź `ADMIN_PANEL.md` lub `QUICK_START.md`
