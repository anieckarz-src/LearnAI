# System Logowania - Dokumentacja

## 🔐 Jak działa logowanie

System wykorzystuje Supabase Authentication do zarządzania sesjami użytkowników.

## 📝 Proces logowania

### 1. Strona logowania (`/login`)

- Formularz z emailem i hasłem
- POST do `/api/auth/signin`

### 2. API Endpoint (`/api/auth/signin`)

- Wysyła request do Supabase Auth API
- Otrzymuje access_token i refresh_token
- Zapisuje tokeny w cookies (httpOnly, secure)
- Przekierowuje do panelu admina

### 3. Middleware (`src/middleware/index.ts`)

- Na każdym requestcie sprawdza cookies
- Waliduje sesję w Supabase
- Ładuje profil użytkownika z tabeli `users`
- Sprawdza czy użytkownik ma rolę 'admin'
- Blokuje dostęp jeśli brak uprawnień

### 4. Wylogowanie (`/api/auth/signout`)

- Usuwa cookies z tokenami
- Przekierowuje do `/login`

## 🚀 Pierwsze logowanie

### Krok 1: Utwórz użytkownika w Supabase Auth

W Supabase Dashboard → Authentication → Users → Add user

```
Email: admin@example.com
Password: TwojeMocneHaslo123!
```

Skopiuj UUID użytkownika!

### Krok 2: Dodaj do tabeli users z rolą admin

W SQL Editor:

```sql
INSERT INTO public.users (id, email, full_name, role)
VALUES (
  'UUID-Z-AUTH-USERS',
  'admin@example.com',
  'Administrator',
  'admin'
);
```

### Krok 3: Zaloguj się

1. Uruchom aplikację: `npm run dev`
2. Otwórz: http://localhost:3000/login
3. Wprowadź email i hasło
4. Zostaniesz przekierowany do `/admin/dashboard`

## 🔧 Konfiguracja

### Cookies

Tokeny są przechowywane w cookies:

- `sb-access-token` - ważny 7 dni
- `sb-refresh-token` - ważny 30 dni

Ustawienia cookies:

- `httpOnly: true` - zabezpieczenie przed XSS
- `secure: true` (produkcja) - tylko HTTPS
- `sameSite: 'lax'` - zabezpieczenie przed CSRF
- `path: '/'` - dostępne w całej aplikacji

### Environment Variables

Wymagane w `.env`:

```
PUBLIC_SUPABASE_URL=https://zcpdsrpyiprtcdsxuprk.supabase.co
PUBLIC_SUPABASE_ANON_KEY=twoj-anon-key
```

## 🐛 Rozwiązywanie problemów

### "Invalid credentials"

- Sprawdź czy użytkownik istnieje w Authentication → Users
- Sprawdź czy hasło jest poprawne
- Sprawdź czy Email Confirmation jest wyłączone w Supabase

### "Unauthorized" po zalogowaniu

- Sprawdź czy użytkownik ma rekord w tabeli `public.users`
- Sprawdź czy UUID się zgadza:

```sql
SELECT u.id, u.email, u.role
FROM public.users u
WHERE u.email = 'admin@example.com';
```

### "User not found"

- Użytkownik istnieje w auth.users ale nie w public.users
- Uruchom INSERT do dodania użytkownika z rolą admin

### Przekierowanie do `/api/auth/signin`

- Ten problem został naprawiony
- Endpoint `/api/auth/signin` został utworzony

### Cookies nie działają

- Sprawdź czy `npm run dev` działa na http://localhost:3000
- W produkcji upewnij się że używasz HTTPS
- Sprawdź DevTools → Application → Cookies

## 🔒 Bezpieczeństwo

### Implementowane zabezpieczenia:

✅ **HttpOnly Cookies** - tokeny niedostępne dla JavaScript
✅ **Secure flag** - cookies tylko przez HTTPS (prod)
✅ **SameSite** - ochrona przed CSRF
✅ **Row Level Security** - ograniczenia na poziomie bazy
✅ **Middleware protection** - sprawdzanie roli przed każdym requestem
✅ **Token validation** - automatyczne odświeżanie tokenów przez Supabase

### Rekomendacje dodatkowe:

🔸 **Rate limiting** - ogranicz liczbę prób logowania
🔸 **2FA** - dwuskładnikowa autentykacja (Supabase wspiera)
🔸 **IP whitelisting** - dla panelu admina (opcjonalne)
🔸 **Session timeout** - automatyczne wylogowanie po bezczynności
🔸 **Audit logging** - wszystkie akcje admina są logowane

## 📚 API Endpoints

### POST /api/auth/signin

Logowanie użytkownika

**Body (form-data):**

```
email: string
password: string
redirect?: string (opcjonalne, domyślnie /admin/dashboard)
```

**Response:**

- Success: Redirect 302 do dashboard
- Error: Redirect 302 do /login?error=...

**Error codes:**

- `missing_credentials` - brak email/hasła
- `invalid_credentials` - złe dane logowania
- `server_error` - błąd serwera

### POST /api/auth/signout

### GET /api/auth/signout

Wylogowanie użytkownika

**Response:**

- Redirect 302 do /login

## 🎯 Następne kroki

Po prawidłowym zalogowaniu możesz:

1. **Zarządzać użytkownikami** (`/admin/users`)
   - Dodawać nowych użytkowników
   - Zmieniać role
   - Blokować konta

2. **Tworzyć kursy** (`/admin/courses`)
   - Dodawać nowe kursy
   - Zarządzać lekcjami
   - Publikować kursy

3. **Konfigurować system** (`/admin/settings`)
   - Ustawienia platformy
   - Konfiguracja AI
   - Parametry bezpieczeństwa

## 💡 Tips

- Pierwszym użytkownikiem powinien być admin
- Możesz mieć wielu adminów
- Role: admin > instructor > student
- Tylko admin może zmieniać role innych użytkowników
- Zablokowany użytkownik nie może się zalogować

---

**Sukces!** Jeśli widzisz panel admina, wszystko działa poprawnie! 🎉
