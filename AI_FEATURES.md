# Funkcje AI w Platformie LMS

Ten dokument opisuje funkcje sztucznej inteligencji zaimplementowane w platformie LMS, w tym chatbota edukacyjnego i generowanie quizów AI.

## Spis treści

- [Przegląd](#przegląd)
- [Konfiguracja](#konfiguracja)
- [Chatbot AI Edukacyjny](#chatbot-ai-edukacyjny)
- [Generowanie Quizów AI](#generowanie-quizów-ai)
- [Rate Limiting](#rate-limiting)
- [Rozwiązywanie Problemów](#rozwiązywanie-problemów)
- [Koszty API](#koszty-api)

## Przegląd

Platforma wykorzystuje OpenAI API do dwóch głównych funkcji:

1. **Chatbot AI Edukacyjny** - Asystent, który pomaga użytkownikom w nauce, odpowiada na pytania o treść kursów i dostosowuje się do postępów użytkownika
2. **Generowanie Quizów AI** - Automatyczne tworzenie pytań quizowych na podstawie treści lekcji lub własnych tematów

### Wykorzystywane Modele

- **Chatbot**: GPT-4o-mini (szybki, ekonomiczny)
- **Generowanie Quizów**: GPT-4o (wyższa jakość pytań)

## Konfiguracja

### 1. Uzyskanie Klucza API OpenAI

1. Zaloguj się na [platform.openai.com](https://platform.openai.com)
2. Przejdź do sekcji API Keys
3. Utwórz nowy klucz API
4. Skopiuj klucz (nie będziesz mógł go ponownie zobaczyć!)

### 2. Zmienne Środowiskowe

Dodaj następujące zmienne do pliku `.env`:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_QUIZ_MODEL=gpt-4o
OPENAI_CHAT_MAX_TOKENS=1000
OPENAI_QUIZ_MAX_TOKENS=4000
```

**Opis zmiennych:**

- `OPENAI_API_KEY` - Twój klucz API OpenAI (wymagany)
- `OPENAI_CHAT_MODEL` - Model używany dla chatbota (domyślnie: gpt-4o-mini)
- `OPENAI_QUIZ_MODEL` - Model używany do generowania quizów (domyślnie: gpt-4o)
- `OPENAI_CHAT_MAX_TOKENS` - Maksymalna długość odpowiedzi chatbota (domyślnie: 1000)
- `OPENAI_QUIZ_MAX_TOKENS` - Maksymalna długość dla generowania quizów (domyślnie: 4000)

### 3. Migracja Bazy Danych

Uruchom migrację, aby dodać wymagane tabele:

```bash
# Jeśli używasz Supabase CLI
supabase db push

# Lub zastosuj migrację 016_ai_features.sql ręcznie
```

Migracja tworzy:
- Tabelę `chat_messages` - historia konwersacji
- Tabelę `api_rate_limits` - limity użycia API
- Funkcje pomocnicze i indeksy

## Chatbot AI Edukacyjny

### Lokalizacja i Dostępność

Chatbot jest dostępny jako floating button (w prawym dolnym rogu) na następujących stronach:

- **Widok lekcji** (`/courses/[courseId]/lessons/[lessonId]`) - z kontekstem lekcji
- **Dashboard użytkownika** (`/dashboard`) - z kontekstem ogólnym

### Funkcjonalność

#### Kontekst Konwersacji

Chatbot automatycznie dostosowuje się do kontekstu:

1. **Kontekst Lekcji** (w widoku lekcji):
   - Zna tytuł i treść bieżącej lekcji
   - Wie, czy użytkownik ukończył lekcję
   - Zna moduł, do którego należy lekcja

2. **Kontekst Kursu**:
   - Zna postępy użytkownika w kursie
   - Wie, ile lekcji zostało ukończonych
   - Zna strukturę modułów

3. **Kontekst Użytkownika**:
   - Liczba zapisanych kursów
   - Całkowita liczba ukończonych lekcji
   - Średni wynik z quizów
   - Ostatnio ukończone lekcje

#### Historia Konwersacji

- Historia jest przechowywana w localStorage (sessionId)
- Backup historii w bazie danych Supabase
- Użytkownik może wyczyścić historię w dowolnym momencie
- Historia jest ograniczona do ostatnich 10 wiadomości (dla optymalizacji)

#### Formatowanie Wiadomości

Chatbot obsługuje Markdown w odpowiedziach:
- **Pogrubienie** - `**tekst**`
- *Kursywa* - `*tekst*`
- `Kod inline` - \`kod\`
- Bloki kodu - \`\`\`język\nkod\n\`\`\`
- Listy (wypunktowane i numerowane)

### Przykłady Użycia

**Pytania o treść lekcji:**
```
"Wyjaśnij mi koncept hooks w React"
"Jakie są różnice między useState a useEffect?"
```

**Pomoc w zrozumieniu:**
```
"Czy możesz podać przykład użycia useCallback?"
"Nie rozumiem, jak działa zamknięcie - wyjaśnij prościej"
```

**Pytania o postępy:**
```
"Ile lekcji mi zostało w tym kursie?"
"Jakie tematy powinienem powtórzyć?"
```

## Generowanie Quizów AI

### Dostęp

Generowanie quizów jest dostępne tylko dla administratorów w panelu administracyjnym:
- Panel zarządzania quizami (`/admin/quizzes`)
- Przycisk "Generuj quiz przez AI"

### Tryby Generowania

#### 1. Z Lekcji

Generuje quiz na podstawie treści istniejącej lekcji.

**Parametry:**
- Wybór lekcji
- Liczba pytań (3-15)
- Poziom trudności (łatwy/średni/trudny)

**Wymagania:**
- Lekcja musi mieć co najmniej 100 znaków treści
- Maksymalna długość treści: 50,000 znaków

#### 2. Własny Temat

Generuje quiz na podstawie podanego tematu (bez powiązania z lekcją).

**Parametry:**
- Temat quizu (wymagany, min. 3 znaki)
- Dodatkowy kontekst (opcjonalny)
- Liczba pytań (3-15)
- Poziom trudności (łatwy/średni/trudny)

**Przykład:**
```
Temat: "Zaawansowane wzorce React"
Kontekst: "Skupić się na HOC, Render Props i Compound Components"
```

### Poziomy Trudności

- **Łatwy** - Podstawowe pytania sprawdzające znajomość kluczowych pojęć i faktów
- **Średni** - Pytania wymagające zrozumienia materiału i umiejętności jego zastosowania
- **Trudny** - Pytania wymagające głębokiej analizy, syntezy wiedzy i rozwiązywania problemów

### Proces Generowania

1. Kliknij "Generuj quiz przez AI" w panelu quizów
2. Wybierz tryb (z lekcji lub własny temat)
3. Ustaw parametry
4. Kliknij "Generuj quiz"
5. Poczekaj 10-30 sekund
6. Przejrzyj i edytuj wygenerowane pytania
7. Zapisz quiz

**Uwaga:** Po wygenerowaniu pytania nie są od razu zapisywane w bazie - możesz je przejrzeć i edytować przed zapisaniem.

## Rate Limiting

System limituje liczbę zapytań do API, aby kontrolować koszty i zapobiegać nadużyciom.

### Limity dla Użytkowników

- **Chatbot**: 50 wiadomości dziennie
- **Generowanie Quizów**: 10 generacji dziennie (tylko admini)

### Limity dla Adminów

- **Bez limitów** - Admini mają nieograniczony dostęp do obu funkcji

### Resetowanie Limitów

Limity resetują się codziennie o północy UTC.

### Sprawdzanie Statusu

Pozostała liczba zapytań jest wyświetlana:
- W interfejsie chatbota (pod nagłówkiem)
- Po wygenerowaniu quizu (w odpowiedzi API)

## Rozwiązywanie Problemów

### Błąd: "OPENAI_API_KEY is not configured"

**Przyczyna:** Brak klucza API w zmiennych środowiskowych

**Rozwiązanie:**
1. Sprawdź, czy plik `.env` zawiera `OPENAI_API_KEY`
2. Zrestartuj serwer deweloperski
3. Upewnij się, że klucz jest prawidłowy

### Błąd: "Rate limit exceeded"

**Przyczyna:** Przekroczono dzienny limit zapytań

**Rozwiązanie:**
1. Poczekaj do północy UTC (limit się zresetuje)
2. Jeśli jesteś adminem, sprawdź czy rola jest prawidłowo ustawiona
3. Rozważ zwiększenie limitów w `src/lib/rate-limiter.ts`

### Chatbot nie odpowiada / długi czas oczekiwania

**Możliwe przyczyny:**
1. Problemy z połączeniem do OpenAI API
2. Bardzo długa treść lekcji (przekroczenie limitu tokenów)
3. Wysoki ruch na API OpenAI

**Rozwiązanie:**
1. Sprawdź połączenie internetowe
2. Sprawdź status OpenAI: [status.openai.com](https://status.openai.com)
3. Zmniejsz `OPENAI_CHAT_MAX_TOKENS` w .env
4. Sprawdź logi serwera pod kątem błędów

### Quiz generuje pytania niskiej jakości

**Rozwiązanie:**
1. Upewnij się, że używasz modelu GPT-4 (`OPENAI_QUIZ_MODEL=gpt-4o`)
2. Dodaj więcej kontekstu w opisie (dla trybu "Własny temat")
3. Zmień poziom trudności
4. Sprawdź, czy treść lekcji jest wystarczająco obszerna i merytoryczna

### Błąd: "Failed to save chat message"

**Przyczyna:** Problem z bazą danych Supabase

**Rozwiązanie:**
1. Sprawdź, czy migracja 016_ai_features.sql została zastosowana
2. Sprawdź uprawnienia RLS w Supabase
3. Sprawdź połączenie z bazą danych

## Koszty API

### Szacowanie Kosztów

Przy użyciu domyślnych modeli (GPT-4o-mini dla chatu, GPT-4o dla quizów):

**Koszty na użytkownika dziennie:**
- Chat: ~500 tokenów/wiadomość × 50 wiadomości = 25,000 tokenów
- Koszt: ~$0.01-0.02/dzień/użytkownik

**Koszty generowania quizów:**
- ~3,000 tokenów/quiz × 10 quizów = 30,000 tokenów
- Koszt: ~$0.15-0.30/dzień/admin

**Przykład dla 100 aktywnych użytkowników:**
- Całkowite zużycie: ~3.1M tokenów/dzień
- Szacowany koszt: **$2-3/dzień** (~$60-90/miesiąc)

### Optymalizacja Kosztów

1. **Użyj tańszych modeli:**
   - Zmień `OPENAI_CHAT_MODEL` na `gpt-3.5-turbo` (tańszy, ale mniej dokładny)

2. **Zmniejsz limity tokenów:**
   - Zmniejsz `OPENAI_CHAT_MAX_TOKENS` i `OPENAI_QUIZ_MAX_TOKENS`

3. **Zmniejsz rate limiting:**
   - Edytuj limity w `src/lib/rate-limiter.ts`

4. **Ogranicz kontekst:**
   - Zmień `maxHistory` w wywołaniach chatbota (domyślnie 10)

### Monitoring Kosztów

1. **Dashboard OpenAI:**
   - [platform.openai.com/usage](https://platform.openai.com/usage)
   - Sprawdzaj regularne zużycie tokenów

2. **Ustaw limity:**
   - W ustawieniach OpenAI możesz ustawić monthly spending limit

3. **Alerty:**
   - Skonfiguruj email notifications dla przekroczenia budżetu

## Architektura Techniczna

### Komponenty

```
Frontend (React)
├── ChatWidget - Floating button i obsługa sesji
├── ChatDialog - Główny interfejs chatu
└── MessageBubble - Renderowanie pojedynczej wiadomości

API Endpoints
├── /api/chat - Wysyłanie wiadomości, pobieranie historii
└── /api/admin/quizzes/generate - Generowanie quizów

Services
├── ai-chat-service.ts - Logika chatbota
├── ai-quiz-generator.ts - Generowanie quizów
├── context-builder.ts - Budowanie kontekstu
└── rate-limiter.ts - Zarządzanie limitami

Database (Supabase)
├── chat_messages - Historia konwersacji
├── api_rate_limits - Limity użycia
└── RLS Policies - Bezpieczeństwo danych
```

### Flow Danych - Chatbot

```
User → ChatWidget → /api/chat
         ↓
    Rate Limiting Check
         ↓
    Context Builder (lesson, course, user progress)
         ↓
    OpenAI API (GPT-4o-mini)
         ↓
    Save to Database (chat_messages)
         ↓
    Return Response → ChatDialog → User
```

### Flow Danych - Quiz Generation

```
Admin → QuizGeneratorModal → /api/admin/quizzes/generate
           ↓
      Rate Limiting Check
           ↓
      Fetch Lesson Content OR Use Custom Topic
           ↓
      OpenAI API (GPT-4o)
           ↓
      Parse & Validate Questions
           ↓
      Return to Admin (not saved yet)
           ↓
      Admin Reviews & Saves
```

## Bezpieczeństwo

### Ochrona Klucza API

- Klucz API jest przechowywany wyłącznie w zmiennych środowiskowych
- Nigdy nie jest eksponowany do frontendu
- Wszystkie wywołania API przechodzą przez backend

### Row Level Security (RLS)

- Użytkownicy widzą tylko swoje wiadomości
- Admini mają dostęp do wszystkich danych
- RLS policies są zdefiniowane w migracji

### Walidacja Danych

- Wszystkie dane wejściowe są walidowane
- Maksymalna długość wiadomości: 2000 znaków
- Sanityzacja treści przed wysłaniem do AI

### Rate Limiting

- Ochrona przed nadużyciami
- Śledzenie per-użytkownik
- Różne limity dla użytkowników i adminów

## Dalszy Rozwój

### Możliwe Usprawnienia

1. **Multimodal AI:**
   - Obsługa obrazów w chatbocie
   - Generowanie quizów z diagramów/grafik

2. **Głos:**
   - Text-to-Speech dla odpowiedzi chatbota
   - Speech-to-Text dla pytań użytkownika

3. **Personalizacja:**
   - Dostosowanie stylu odpowiedzi do poziomu użytkownika
   - Rekomendacje materiałów na podstawie historii

4. **Analytics:**
   - Dashboard z metrykami użycia AI
   - Analiza najpopularniejszych pytań
   - Ocena jakości wygenerowanych quizów

5. **Integracje:**
   - Własny fine-tuned model
   - Inne providery AI (Anthropic Claude, Google Gemini)

## Wsparcie

W razie problemów:
1. Sprawdź ten dokument
2. Sprawdź logi serwera
3. Sprawdź status OpenAI API
4. Skontaktuj się z zespołem developmentu

---

**Ostatnia aktualizacja:** Grudzień 2024
**Wersja dokumentacji:** 1.0
