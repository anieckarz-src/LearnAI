-- Demo Seed Data for University LMS Platform
-- This migration creates realistic demo data for presentation purposes

-- WARNING: This will delete existing data. Only run in development/demo environments!

-- Step 1: Clean existing demo data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE public.quiz_attempts CASCADE;
-- TRUNCATE TABLE public.lesson_progress CASCADE;
-- TRUNCATE TABLE public.course_enrollments CASCADE;
-- TRUNCATE TABLE public.quizzes CASCADE;
-- TRUNCATE TABLE public.lessons CASCADE;
-- TRUNCATE TABLE public.modules CASCADE;
-- TRUNCATE TABLE public.courses CASCADE;
-- DELETE FROM public.users WHERE email LIKE '%@demo.wsiiz.pl';

-- Step 2: Insert demo users
-- Note: Passwords are hashed for 'Demo123!' 
-- In production, users should be created through Supabase Auth

-- Admin user
INSERT INTO public.users (id, email, full_name, role, is_blocked, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@demo.university.edu', 'Jan Kowalski', 'admin', false, NOW() - INTERVAL '6 months')
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Instructor users
INSERT INTO public.users (id, email, full_name, role, is_blocked, created_at) VALUES
('22222222-2222-2222-2222-222222222222', 'dr.nowak@demo.university.edu', 'Dr Anna Nowak', 'instructor', false, NOW() - INTERVAL '5 months'),
('33333333-3333-3333-3333-333333333333', 'prof.wisniewski@demo.university.edu', 'Prof. Piotr Wiśniewski', 'instructor', false, NOW() - INTERVAL '5 months'),
('44444444-4444-4444-4444-444444444444', 'mgr.kaminska@demo.university.edu', 'Mgr Katarzyna Kamińska', 'instructor', false, NOW() - INTERVAL '4 months')
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Student users
INSERT INTO public.users (id, email, full_name, role, is_blocked, created_at) VALUES
('55555555-5555-5555-5555-555555555555', 'student1@demo.university.edu', 'Tomasz Lewandowski', 'user', false, NOW() - INTERVAL '4 months'),
('66666666-6666-6666-6666-666666666666', 'student2@demo.university.edu', 'Maria Zielińska', 'user', false, NOW() - INTERVAL '3 months'),
('77777777-7777-7777-7777-777777777777', 'student3@demo.university.edu', 'Paweł Szymański', 'user', false, NOW() - INTERVAL '3 months'),
('88888888-8888-8888-8888-888888888888', 'student4@demo.university.edu', 'Aleksandra Dąbrowska', 'user', false, NOW() - INTERVAL '2 months'),
('99999999-9999-9999-9999-999999999999', 'student5@demo.university.edu', 'Michał Woźniak', 'user', false, NOW() - INTERVAL '2 months')
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Step 3: Insert courses
-- Course 1: Python Programming (Dr Anna Nowak)
INSERT INTO public.courses (id, title, description, instructor_id, status, created_at, updated_at) VALUES
('c1111111-1111-1111-1111-111111111111', 
 'Podstawy Programowania w Pythonie',
 'Kompleksowy kurs wprowadzający do programowania w języku Python. Nauczysz się podstaw składni, struktur danych, programowania obiektowego oraz praktycznych zastosowań Pythona.',
 '22222222-2222-2222-2222-222222222222',
 'published',
 NOW() - INTERVAL '4 months',
 NOW() - INTERVAL '1 month')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  instructor_id = EXCLUDED.instructor_id,
  status = EXCLUDED.status;

-- Course 2: Databases and SQL (Prof. Piotr Wiśniewski)
INSERT INTO public.courses (id, title, description, instructor_id, status, created_at, updated_at) VALUES
('c2222222-2222-2222-2222-222222222222',
 'Bazy Danych i SQL',
 'Kurs obejmuje projektowanie relacyjnych baz danych, język SQL, normalizację, indeksowanie oraz optymalizację zapytań. Praktyczne projekty z PostgreSQL.',
 '33333333-3333-3333-3333-333333333333',
 'published',
 NOW() - INTERVAL '3 months',
 NOW() - INTERVAL '2 weeks')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  instructor_id = EXCLUDED.instructor_id,
  status = EXCLUDED.status;

-- Course 3: Software Engineering (Dr Anna Nowak)
INSERT INTO public.courses (id, title, description, instructor_id, status, created_at, updated_at) VALUES
('c3333333-3333-3333-3333-333333333333',
 'Inżynieria Oprogramowania',
 'Metodyki tworzenia oprogramowania, Agile, Scrum, testowanie, CI/CD, wzorce projektowe oraz zarządzanie projektami IT.',
 '22222222-2222-2222-2222-222222222222',
 'published',
 NOW() - INTERVAL '3 months',
 NOW() - INTERVAL '1 week')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  instructor_id = EXCLUDED.instructor_id,
  status = EXCLUDED.status;

-- Course 4: Algorithms and Data Structures (Mgr Katarzyna Kamińska)
INSERT INTO public.courses (id, title, description, instructor_id, status, created_at, updated_at) VALUES
('c4444444-4444-4444-4444-444444444444',
 'Algorytmy i Struktury Danych',
 'Zaawansowany kurs algorytmów: sortowanie, wyszukiwanie, grafy, drzewa, programowanie dynamiczne. Analiza złożoności obliczeniowej.',
 '44444444-4444-4444-4444-444444444444',
 'published',
 NOW() - INTERVAL '2 months',
 NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  instructor_id = EXCLUDED.instructor_id,
  status = EXCLUDED.status;

-- Course 5: Web Programming (Prof. Piotr Wiśniewski)
INSERT INTO public.courses (id, title, description, instructor_id, status, created_at, updated_at) VALUES
('c5555555-5555-5555-5555-555555555555',
 'Programowanie Aplikacji Webowych',
 'Tworzenie nowoczesnych aplikacji webowych: HTML5, CSS3, JavaScript, React, Node.js, REST API, bezpieczeństwo aplikacji webowych.',
 '33333333-3333-3333-3333-333333333333',
 'draft',
 NOW() - INTERVAL '1 month',
 NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  instructor_id = EXCLUDED.instructor_id,
  status = EXCLUDED.status;

-- Step 4: Insert modules for Course 1 (Python Programming)
INSERT INTO public.modules (id, course_id, title, description, order_index, created_at) VALUES
('m1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 
 'Wprowadzenie do Pythona', 
 'Podstawy języka Python, instalacja środowiska, pierwsze programy', 
 0, NOW() - INTERVAL '4 months'),
('m1111112-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111',
 'Typy danych i operatory',
 'Zmienne, typy danych, operatory arytmetyczne i logiczne',
 1, NOW() - INTERVAL '4 months'),
('m1111113-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111',
 'Struktury kontrolne',
 'Instrukcje warunkowe, pętle, obsługa wyjątków',
 2, NOW() - INTERVAL '3 months'),
('m1111114-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111',
 'Funkcje i moduły',
 'Definiowanie funkcji, parametry, zasięg zmiennych, importowanie modułów',
 3, NOW() - INTERVAL '3 months'),
('m1111115-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111',
 'Programowanie obiektowe',
 'Klasy, obiekty, dziedziczenie, polimorfizm',
 4, NOW() - INTERVAL '2 months')
ON CONFLICT (id) DO NOTHING;

-- Modules for Course 2 (Databases and SQL)
INSERT INTO public.modules (id, course_id, title, description, order_index, created_at) VALUES
('m2222221-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222',
 'Wprowadzenie do baz danych',
 'Modele danych, SZBD, relacyjne bazy danych',
 0, NOW() - INTERVAL '3 months'),
('m2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222',
 'Podstawy SQL',
 'SELECT, INSERT, UPDATE, DELETE, WHERE, ORDER BY',
 1, NOW() - INTERVAL '3 months'),
('m2222223-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222',
 'Zaawansowane zapytania SQL',
 'JOIN, GROUP BY, HAVING, podzapytania, funkcje agregujące',
 2, NOW() - INTERVAL '2 months'),
('m2222224-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222',
 'Projektowanie baz danych',
 'Normalizacja, klucze, relacje, diagramy ER',
 3, NOW() - INTERVAL '2 months'),
('m2222225-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222',
 'Optymalizacja i indeksy',
 'Indeksy, plany wykonania, optymalizacja zapytań',
 4, NOW() - INTERVAL '1 month')
ON CONFLICT (id) DO NOTHING;

-- Modules for Course 3 (Software Engineering)
INSERT INTO public.modules (id, course_id, title, description, order_index, created_at) VALUES
('m3333331-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333',
 'Wprowadzenie do inżynierii oprogramowania',
 'Cykl życia oprogramowania, metodyki, role w zespole',
 0, NOW() - INTERVAL '3 months'),
('m3333332-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333',
 'Metodyki Agile i Scrum',
 'Zasady Agile, Scrum framework, sprinty, daily standups',
 1, NOW() - INTERVAL '2 months'),
('m3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333',
 'Testowanie oprogramowania',
 'Testy jednostkowe, integracyjne, E2E, TDD, BDD',
 2, NOW() - INTERVAL '2 months'),
('m3333334-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333',
 'Wzorce projektowe',
 'Design patterns: Singleton, Factory, Observer, Strategy',
 3, NOW() - INTERVAL '1 month'),
('m3333335-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333',
 'CI/CD i DevOps',
 'Continuous Integration, Continuous Deployment, Docker, Git',
 4, NOW() - INTERVAL '1 month')
ON CONFLICT (id) DO NOTHING;

-- Modules for Course 4 (Algorithms)
INSERT INTO public.modules (id, course_id, title, description, order_index, created_at) VALUES
('m4444441-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444',
 'Analiza algorytmów',
 'Notacja Big O, złożoność czasowa i pamięciowa',
 0, NOW() - INTERVAL '2 months'),
('m4444442-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444',
 'Algorytmy sortowania',
 'Bubble sort, Quick sort, Merge sort, Heap sort',
 1, NOW() - INTERVAL '2 months'),
('m4444443-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444',
 'Struktury danych',
 'Listy, stosy, kolejki, drzewa, grafy',
 2, NOW() - INTERVAL '1 month'),
('m4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444',
 'Algorytmy grafowe',
 'BFS, DFS, Dijkstra, algorytm Kruskala',
 3, NOW() - INTERVAL '1 month'),
('m4444445-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444',
 'Programowanie dynamiczne',
 'Memoizacja, problemy optymalizacyjne',
 4, NOW() - INTERVAL '2 weeks')
ON CONFLICT (id) DO NOTHING;

-- Step 5: Insert lessons (sample for each module - first module of each course)
-- Python Course - Module 1 lessons
INSERT INTO public.lessons (id, course_id, module_id, title, type, content, video_url, files, order_index, created_at) VALUES
('l1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'm1111111-1111-1111-1111-111111111111',
 'Czym jest Python?',
 'content',
 '<h2>Python - język programowania</h2><p>Python to interpretowany, wysokopoziomowy język programowania o dynamicznej semantyce. Został stworzony przez Guido van Rossuma i po raz pierwszy wydany w 1991 roku.</p><h3>Cechy Pythona:</h3><ul><li>Czytelna składnia</li><li>Bogata biblioteka standardowa</li><li>Wieloplatformowość</li><li>Duża społeczność</li></ul>',
 null,
 '[]'::jsonb,
 0,
 NOW() - INTERVAL '4 months'),
('l1111112-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'm1111111-1111-1111-1111-111111111111',
 'Instalacja środowiska Python',
 'content',
 '<h2>Instalacja Pythona</h2><p>W tej lekcji nauczysz się jak zainstalować Python na swoim komputerze oraz skonfigurować środowisko programistyczne.</p><h3>Kroki instalacji:</h3><ol><li>Pobierz Python z python.org</li><li>Uruchom instalator</li><li>Zaznacz "Add Python to PATH"</li><li>Zweryfikuj instalację: python --version</li></ol>',
 null,
 '[]'::jsonb,
 1,
 NOW() - INTERVAL '4 months'),
('l1111113-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'm1111111-1111-1111-1111-111111111111',
 'Pierwszy program w Pythonie',
 'content',
 '<h2>Hello World!</h2><p>Tradycyjnie zaczynamy od programu "Hello World".</p><pre><code>print("Hello, World!")</code></pre><p>To najprostszy program w Pythonie. Funkcja print() wyświetla tekst na ekranie.</p>',
 null,
 '[]'::jsonb,
 2,
 NOW() - INTERVAL '4 months'),
('l1111114-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'm1111111-1111-1111-1111-111111111111',
 'Quiz: Wprowadzenie do Pythona',
 'quiz',
 null,
 null,
 '[]'::jsonb,
 3,
 NOW() - INTERVAL '4 months')
ON CONFLICT (id) DO NOTHING;

-- Database Course - Module 1 lessons
INSERT INTO public.lessons (id, course_id, module_id, title, type, content, video_url, files, order_index, created_at) VALUES
('l2222221-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'm2222221-2222-2222-2222-222222222222',
 'Co to jest baza danych?',
 'content',
 '<h2>Bazy danych</h2><p>Baza danych to uporządkowany zbiór danych przechowywanych elektronicznie w systemie komputerowym.</p><h3>Rodzaje baz danych:</h3><ul><li>Relacyjne (SQL)</li><li>NoSQL (dokumentowe, klucz-wartość)</li><li>Grafowe</li><li>Kolumnowe</li></ul>',
 null,
 '[]'::jsonb,
 0,
 NOW() - INTERVAL '3 months'),
('l2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'm2222221-2222-2222-2222-222222222222',
 'Model relacyjny',
 'content',
 '<h2>Model relacyjny bazy danych</h2><p>Model relacyjny organizuje dane w tabele (relacje) składające się z wierszy i kolumn.</p><h3>Kluczowe pojęcia:</h3><ul><li>Tabela (relacja)</li><li>Wiersz (krotka)</li><li>Kolumna (atrybut)</li><li>Klucz główny</li><li>Klucz obcy</li></ul>',
 null,
 '[]'::jsonb,
 1,
 NOW() - INTERVAL '3 months'),
('l2222223-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'm2222221-2222-2222-2222-222222222222',
 'Quiz: Podstawy baz danych',
 'quiz',
 null,
 null,
 '[]'::jsonb,
 2,
 NOW() - INTERVAL '3 months')
ON CONFLICT (id) DO NOTHING;

-- Software Engineering Course - Module 1 lessons
INSERT INTO public.lessons (id, course_id, module_id, title, type, content, video_url, files, order_index, created_at) VALUES
('l3333331-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'm3333331-3333-3333-3333-333333333333',
 'Cykl życia oprogramowania',
 'content',
 '<h2>Software Development Life Cycle (SDLC)</h2><p>SDLC to proces tworzenia oprogramowania od pomysłu do wdrożenia i utrzymania.</p><h3>Fazy SDLC:</h3><ol><li>Analiza wymagań</li><li>Projektowanie</li><li>Implementacja</li><li>Testowanie</li><li>Wdrożenie</li><li>Utrzymanie</li></ol>',
 null,
 '[]'::jsonb,
 0,
 NOW() - INTERVAL '3 months'),
('l3333332-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'm3333331-3333-3333-3333-333333333333',
 'Metodyki wytwarzania oprogramowania',
 'content',
 '<h2>Metodyki</h2><p>Różne podejścia do procesu tworzenia oprogramowania.</p><h3>Popularne metodyki:</h3><ul><li>Waterfall (kaskadowa)</li><li>Agile (zwinne)</li><li>Scrum</li><li>Kanban</li><li>DevOps</li></ul>',
 null,
 '[]'::jsonb,
 1,
 NOW() - INTERVAL '3 months')
ON CONFLICT (id) DO NOTHING;

-- Algorithms Course - Module 1 lessons
INSERT INTO public.lessons (id, course_id, module_id, title, type, content, video_url, files, order_index, created_at) VALUES
('l4444441-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 'm4444441-4444-4444-4444-444444444444',
 'Notacja Big O',
 'content',
 '<h2>Analiza złożoności algorytmów</h2><p>Notacja Big O opisuje górne ograniczenie złożoności czasowej lub pamięciowej algorytmu.</p><h3>Typowe złożoności:</h3><ul><li>O(1) - stała</li><li>O(log n) - logarytmiczna</li><li>O(n) - liniowa</li><li>O(n log n) - liniowo-logarytmiczna</li><li>O(n²) - kwadratowa</li></ul>',
 null,
 '[]'::jsonb,
 0,
 NOW() - INTERVAL '2 months'),
('l4444442-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 'm4444441-4444-4444-4444-444444444444',
 'Analiza najgorszego przypadku',
 'content',
 '<h2>Worst Case Analysis</h2><p>Analiza najgorszego przypadku pozwala określić maksymalny czas wykonania algorytmu.</p>',
 null,
 '[]'::jsonb,
 1,
 NOW() - INTERVAL '2 months')
ON CONFLICT (id) DO NOTHING;

-- Step 6: Insert quizzes
INSERT INTO public.quizzes (id, lesson_id, title, questions, ai_generated, passing_score, max_attempts, time_limit_minutes, created_at) VALUES
('q1111111-1111-1111-1111-111111111111', 'l1111114-1111-1111-1111-111111111111',
 'Quiz: Wprowadzenie do Pythona',
 '[
   {
     "id": "q1",
     "question": "Kto stworzył język Python?",
     "options": ["Dennis Ritchie", "Guido van Rossum", "James Gosling", "Bjarne Stroustrup"],
     "correct_answer": 1
   },
   {
     "id": "q2",
     "question": "W którym roku Python został po raz pierwszy wydany?",
     "options": ["1989", "1991", "1995", "2000"],
     "correct_answer": 1
   },
   {
     "id": "q3",
     "question": "Która cecha NIE charakteryzuje Pythona?",
     "options": ["Interpretowany", "Wysokopoziomowy", "Statycznie typowany", "Wieloplatformowy"],
     "correct_answer": 2
   },
   {
     "id": "q4",
     "question": "Jaka funkcja służy do wyświetlania tekstu w Pythonie?",
     "options": ["echo()", "print()", "display()", "show()"],
     "correct_answer": 1
   },
   {
     "id": "q5",
     "question": "Czy Python jest językiem kompilowanym?",
     "options": ["Tak", "Nie", "Czasami", "Zależy od wersji"],
     "correct_answer": 1
   }
 ]'::jsonb,
 false,
 70,
 3,
 10,
 NOW() - INTERVAL '4 months'),

('q2222221-2222-2222-2222-222222222222', 'l2222223-2222-2222-2222-222222222222',
 'Quiz: Podstawy baz danych',
 '[
   {
     "id": "q1",
     "question": "Co to jest relacyjna baza danych?",
     "options": ["Baza przechowująca dane w plikach", "Baza organizująca dane w tabele", "Baza bez struktury", "Baza tylko do odczytu"],
     "correct_answer": 1
   },
   {
     "id": "q2",
     "question": "Jak nazywa się wiersz w tabeli relacyjnej?",
     "options": ["Kolumna", "Krotka", "Rekord", "Zarówno B jak i C"],
     "correct_answer": 3
   },
   {
     "id": "q3",
     "question": "Co to jest klucz główny?",
     "options": ["Hasło do bazy", "Unikalny identyfikator wiersza", "Nazwa tabeli", "Typ danych"],
     "correct_answer": 1
   },
   {
     "id": "q4",
     "question": "Który z poniższych NIE jest systemem zarządzania bazą danych?",
     "options": ["PostgreSQL", "MySQL", "MongoDB", "JavaScript"],
     "correct_answer": 3
   },
   {
     "id": "q5",
     "question": "Co łączy klucz obcy?",
     "options": ["Dwie kolumny w tej samej tabeli", "Dwie różne tabele", "Bazę z aplikacją", "Użytkownika z bazą"],
     "correct_answer": 1
   }
 ]'::jsonb,
 false,
 70,
 3,
 15,
 NOW() - INTERVAL '3 months')
ON CONFLICT (id) DO NOTHING;

-- Step 7: Insert course enrollments
INSERT INTO public.course_enrollments (id, course_id, user_id, enrolled_at, completed_at) VALUES
-- Student 1 (Tomasz) - enrolled in Python and Databases
('e1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 month'),
('e1111112-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '2 months', NULL),

-- Student 2 (Maria) - enrolled in Python, Databases, and Software Engineering
('e2222221-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '3 months', NULL),
('e2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '2 months', NULL),
('e2222223-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '1 month', NULL),

-- Student 3 (Paweł) - enrolled in Algorithms
('e3333331-3333-3333-3333-333333333333', 'c4444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777777', NOW() - INTERVAL '1 month', NULL),

-- Student 4 (Aleksandra) - enrolled in Python and Software Engineering
('e4444441-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', NOW() - INTERVAL '2 months', NULL),
('e4444442-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333', '88888888-8888-8888-8888-888888888888', NOW() - INTERVAL '1 month', NULL),

-- Student 5 (Michał) - enrolled in Databases and Algorithms
('e5555551-5555-5555-5555-555555555555', 'c2222222-2222-2222-2222-222222222222', '99999999-9999-9999-9999-999999999999', NOW() - INTERVAL '2 months', NULL),
('e5555552-5555-5555-5555-555555555555', 'c4444444-4444-4444-4444-444444444444', '99999999-9999-9999-9999-999999999999', NOW() - INTERVAL '1 month', NULL)
ON CONFLICT (id) DO NOTHING;

-- Step 8: Insert lesson progress
-- Student 1 progress (completed Python course)
INSERT INTO public.lesson_progress (id, user_id, lesson_id, course_id, completed, completed_at, created_at) VALUES
('p1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'l1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', true, NOW() - INTERVAL '3 months', NOW() - INTERVAL '3 months'),
('p1111112-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'l1111112-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', true, NOW() - INTERVAL '3 months', NOW() - INTERVAL '3 months'),
('p1111113-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'l1111113-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', true, NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months'),

-- Student 2 progress (in progress)
('p2222221-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'l1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', true, NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months'),
('p2222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'l1111112-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', true, NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months'),
('p2222223-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'l2222221-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', true, NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month'),

-- Student 4 progress
('p4444441-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888', 'l1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', true, NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month')
ON CONFLICT (id) DO NOTHING;

-- Step 9: Insert quiz attempts
INSERT INTO public.quiz_attempts (id, quiz_id, user_id, score, answers, time_spent_seconds, passed, completed_at) VALUES
-- Student 1 quiz attempts
('a1111111-1111-1111-1111-111111111111', 'q1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 
 80, '{"q1": 1, "q2": 1, "q3": 2, "q4": 1, "q5": 1}'::jsonb, 420, true, NOW() - INTERVAL '2 months'),
 
-- Student 2 quiz attempts (multiple attempts)
('a2222221-2222-2222-2222-222222222222', 'q1111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666',
 60, '{"q1": 1, "q2": 0, "q3": 2, "q4": 1, "q5": 1}'::jsonb, 380, false, NOW() - INTERVAL '2 months'),
('a2222222-2222-2222-2222-222222222222', 'q1111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666',
 100, '{"q1": 1, "q2": 1, "q3": 2, "q4": 1, "q5": 1}'::jsonb, 450, true, NOW() - INTERVAL '2 months'),
('a2222223-2222-2222-2222-222222222222', 'q2222221-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666',
 80, '{"q1": 1, "q2": 3, "q3": 1, "q4": 3, "q5": 1}'::jsonb, 600, true, NOW() - INTERVAL '1 month'),

-- Student 4 quiz attempt
('a4444441-4444-4444-4444-444444444444', 'q1111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888',
 80, '{"q1": 1, "q2": 1, "q3": 2, "q4": 1, "q5": 1}'::jsonb, 390, true, NOW() - INTERVAL '1 month'),

-- Student 5 quiz attempt
('a5555551-5555-5555-5555-555555555555', 'q2222221-2222-2222-2222-222222222222', '99999999-9999-9999-9999-999999999999',
 60, '{"q1": 1, "q2": 3, "q3": 1, "q4": 0, "q5": 1}'::jsonb, 550, false, NOW() - INTERVAL '1 month')
ON CONFLICT (id) DO NOTHING;

-- Step 10: Update system settings for university branding
UPDATE public.system_settings
SET value = '{"value": "Uniwersytet AI"}'
WHERE key = 'platform_name';

UPDATE public.system_settings 
SET value = '{"value": "kontakt@eduportal.edu"}'
WHERE key = 'platform_email';

-- Insert or update additional settings
INSERT INTO public.system_settings (key, value) VALUES
('academic_year', '{"value": "2024/2025"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Summary
DO $$
BEGIN
  RAISE NOTICE '=== Demo Data Seeding Complete ===';
  RAISE NOTICE 'Users created: 9 (1 admin, 3 instructors, 5 students)';
  RAISE NOTICE 'Courses created: 5';
  RAISE NOTICE 'Modules created: 20';
  RAISE NOTICE 'Lessons created: ~15 (sample)';
  RAISE NOTICE 'Quizzes created: 2';
  RAISE NOTICE 'Enrollments: 10';
  RAISE NOTICE 'Quiz attempts: 6';
  RAISE NOTICE '';
  RAISE NOTICE 'Demo Login Credentials:';
  RAISE NOTICE 'Admin: admin@demo.university.edu';
  RAISE NOTICE 'Instructor 1: dr.nowak@demo.university.edu';
  RAISE NOTICE 'Instructor 2: prof.wisniewski@demo.university.edu';
  RAISE NOTICE 'Student 1: student1@demo.university.edu';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: Users must be created in Supabase Auth first!';
END $$;
