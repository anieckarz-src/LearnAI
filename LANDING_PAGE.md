# LearnAI Landing Page

Landing page dla platformy edukacyjnej LearnAI, zbudowany przy użyciu Astro, React i Tailwind CSS.

## 🎨 Design

Landing page został zaprojektowany w oparciu o nowoczesną, ciemną estetykę z inspiracją z platformy TEST IO. Wykorzystuje:

- **Ciemny motyw** z gradientami (granat, fiolet, niebieski)
- **Glass-morphism effects** na kartach funkcji
- **Płynne animacje** i transitions
- **Responsywny design** od mobile do desktop
- **Accessibility first** - semantic HTML, ARIA labels, keyboard navigation

## 📁 Struktura

```
src/
├── components/
│   └── landing/
│       ├── Navbar.astro           # Sticky navigation z hamburger menu
│       ├── HeroSection.astro      # Hero z animowanym tłem
│       ├── ScrollingBanner.astro  # Infinite scroll banner
│       ├── ValueSection.astro     # Sekcja wartości z mockiem chatbota
│       ├── StatsSection.astro     # Statystyki z animowanymi licznikami
│       ├── FeaturesSection.astro  # Grid z funkcjami platformy
│       ├── ControlSection.astro   # Jasna sekcja z CTA
│       └── Footer.astro           # Footer z linkami i social media
├── pages/
│   └── index.astro                # Główna strona landing page
├── layouts/
│   └── Layout.astro               # Layout z SEO meta tags
└── styles/
    └── global.css                 # Custom animations i utility classes
```

## 🚀 Sekcje Landing Page

### 1. Navigation
- Sticky navbar z backdrop blur
- Logo i menu (Desktop: horizontal, Mobile: hamburger)
- CTA buttons: "Zaloguj się" i "Wypróbuj za darmo"

### 2. Hero Section
- Wielka typografia: "UCZĄC SIĘ Z AI. SZYBCIEJ."
- Animowane gradient background
- Dwa główne CTA buttons
- Scroll indicator

### 3. Scrolling Banner
- Infinite horizontal scroll
- Key benefits: "NOWOCZESNA EDUKACJA Z AI • PERSONALIZOWANA NAUKA • DOSTĘPNA 24/7 • INTELIGENTNE WSPARCIE"

### 4. Value Proposition
- Two-column layout (tekst + mockup chatbota)
- Opis platformy i jej możliwości
- Wizualizacja konwersacji z AI

### 5. Key Facts
- 3 statystyki w grid layout:
  - 5,000+ Aktywnych Studentów
  - 50+ Dostępnych Kursów
  - 100,000+ Wygenerowanych Odpowiedzi AI
- Animowane liczniki przy scroll into view

### 6. Features
- Grid 2x2 z 4 funkcjami:
  - Chatbot Edukacyjny 24/7
  - Personalizowana Ścieżka Nauki
  - Bogata Biblioteka Kursów
  - Śledzenie Postępów
- Glass-morphism cards z hover effects
- SVG icons

### 7. Control Section
- Jasna sekcja (kontrast)
- Tytuł: "PLATFORMA która daje Ci pełną kontrolę"
- 3 feature highlights
- CTA button
- Dekoracyjne ukośne pasy (desktop only)

### 8. Footer
- Logo i opis
- Linki do: Funkcje, Dla kogo, O platformie, Demo
- Linki prawne: O nas, Kontakt, Polityka prywatności, Regulamin
- Social media icons (Twitter, LinkedIn, GitHub)
- Copyright

## 🎨 Paleta Kolorów

```css
/* Główne kolory */
--dark-bg: #0f172a (slate-900)
--darker-bg: #020617 (slate-950)
--purple-accent: #581c87 (purple-900)

/* Akcenty */
--blue-primary: #3B82F6 (blue-600)
--blue-hover: #2563EB (blue-700)
--blue-light: #60A5FA (blue-400)

/* Tekst */
--text-primary: #FFFFFF
--text-secondary: #E2E8F0 (gray-300)
--text-muted: #94A3B8 (gray-400)

/* Jasna sekcja */
--light-bg: #F8FAFC (slate-50)
--light-text: #1E293B (slate-900)
```

## ✨ Animacje

### CSS Animations
- `animate-gradient` - tło hero section
- `animate-scroll` - infinite scroll banner
- `animate-bounce` - scroll indicator
- `fadeInUp` - fade in with slide up
- Hover effects na kartach (scale, glow)

### JavaScript Animations
- **Counter animation** w StatsSection - liczniki zliczają od 0 do target przy scroll into view
- **Mobile menu toggle** - smooth expand/collapse

## 📱 Responsywność

### Breakpoints
- `sm: 640px` - małe tablety
- `md: 768px` - tablety
- `lg: 1024px` - małe desktopy
- `xl: 1280px` - duże desktopy

### Mobile Optimizations
- Hamburger menu < 768px
- Stack columns vertically
- Adjust font sizes (text-4xl → text-3xl na mobile)
- Hide decorative elements on small screens
- Touch-friendly button sizes (py-4)

## ♿ Accessibility

### Implementowane Features
- **Semantic HTML** - nav, main, section, footer
- **ARIA labels** - aria-label, aria-labelledby, aria-expanded
- **Screen reader only text** - .sr-only class dla ukrytych opisów
- **Keyboard navigation** - pełna dostępność z klawiatury
- **Focus visible styles** - widoczny outline na :focus-visible
- **Alt text** - odpowiednie opisy dla wszystkich grafik
- **Color contrast** - WCAG AA zgodność

## 🛠️ Development

### Uruchomienie
```bash
npm install
npm run dev
```

Strona dostępna pod: `http://localhost:3000/`

### Build
```bash
npm run build
npm run preview
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## 📝 Customization

### Zmiana nazwy platformy
Znajdź i zamień "LearnAI" w następujących plikach:
- `src/components/landing/Navbar.astro`
- `src/components/landing/Footer.astro`
- `src/layouts/Layout.astro`

### Aktualizacja statystyk
Edytuj `src/components/landing/StatsSection.astro`:
- Zmień `data-counter` attribute na nową wartość
- Zaktualizuj wyświetlany tekst

### Dodanie nowych funkcji
Dodaj nowy card w `src/components/landing/FeaturesSection.astro`:
```html
<div class="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 ...">
  <!-- Icon -->
  <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 ...">
    <!-- SVG icon -->
  </div>
  <!-- Title -->
  <h3 class="text-2xl font-bold text-white mb-4">Twoja funkcja</h3>
  <!-- Description -->
  <p class="text-gray-300 leading-relaxed">Opis funkcji...</p>
</div>
```

### Zmiana linków
Wszystkie linki (np. `/demo`, `/login`) są placeholderami. Zaktualizuj je zgodnie z Twoją strukturą routingu.

## 🎯 SEO

Landing page zawiera:
- **Meta tags** w Layout.astro (title, description, keywords)
- **Open Graph tags** dla social media
- **Twitter Card tags**
- **Semantic HTML** dla lepszej indeksacji
- **Smooth scroll** dla lepszego UX

## 📦 Dependencies

- **Astro** v5.13.7 - framework
- **React** v19.1.1 - dla potencjalnych interaktywnych komponentów
- **Tailwind CSS** v4.1.13 - styling
- **lucide-react** - icons (opcjonalne, jeśli użyjesz React icons)

## 🔮 Przyszłe Rozszerzenia

Możliwe rozszerzenia landing page:
- [ ] Sekcja z opiniami użytkowników (testimonials)
- [ ] Demo video lub interactive demo
- [ ] Sekcja FAQ
- [ ] Porównanie z konkurencją
- [ ] Blog integration
- [ ] Newsletter signup form
- [ ] Live chat widget
- [ ] Dark/Light mode toggle
- [ ] Multi-language support (i18n)

## 📄 License

MIT

---

**Autor:** Adrian Nieckarz  
**Projekt:** Platforma edukacyjna LearnAI  
**Rok:** 2025
