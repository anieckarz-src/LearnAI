# Przewodnik Customizacji Landing Page LearnAI

Ten przewodnik pomoże Ci dostosować landing page do Twojej platformy edukacyjnej.

## 1. 🏷️ Zmiana Nazwy Platformy

### Pliki do edycji:

**src/components/landing/Navbar.astro**
```astro
<!-- Linia 10-14 -->
<a href="/" class="flex items-center space-x-2" aria-label="TwojaNazwa - Strona główna">
  <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
    <span class="text-white font-bold text-xl" aria-hidden="true">T</span>
  </div>
  <span class="text-white font-bold text-xl">TwojaNazwa</span>
</a>
```

**src/components/landing/Footer.astro**
```astro
<!-- Linia 9-14 -->
<div class="flex items-center space-x-2 mb-4">
  <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
    <span class="text-white font-bold text-xl">T</span>
  </div>
  <span class="text-white font-bold text-2xl">TwojaNazwa</span>
</div>

<!-- Linia 85 -->
© 2025 TwojaNazwa. Wszystkie prawa zastrzeżone.
```

**src/layouts/Layout.astro**
```astro
<!-- Linia 9-10 -->
const { 
  title = "TwojaNazwa - Platforma Edukacyjna z AI",
  description = "Opis Twojej platformy..."
} = Astro.props;
```

## 2. 📊 Aktualizacja Statystyk

**src/components/landing/StatsSection.astro**

Zmień wartości `data-counter` i teksty:

```astro
<!-- Statystyka 1 -->
<div class="text-4xl sm:text-5xl lg:text-6xl font-bold ... mb-3 sm:mb-4" data-counter="10000">
  10,000+
</div>
<div class="text-lg sm:text-xl text-gray-300 font-semibold mb-1 sm:mb-2">Aktywnych</div>
<div class="text-base sm:text-lg text-gray-400">Użytkowników</div>

<!-- Statystyka 2 -->
<div class="text-4xl sm:text-5xl lg:text-6xl font-bold ... mb-3 sm:mb-4" data-counter="100">
  100+
</div>
<div class="text-lg sm:text-xl text-gray-300 font-semibold mb-1 sm:mb-2">Dostępnych</div>
<div class="text-base sm:text-lg text-gray-400">Kursów Premium</div>

<!-- Statystyka 3 -->
<div class="text-4xl sm:text-5xl lg:text-6xl font-bold ... mb-3 sm:mb-4" data-counter="500000">
  500,000+
</div>
<div class="text-lg sm:text-xl text-gray-300 font-semibold mb-1 sm:mb-2">Ukończonych</div>
<div class="text-base sm:text-lg text-gray-400">Lekcji</div>
```

## 3. 🎯 Zmiana Głównego Hasła (Hero)

**src/components/landing/HeroSection.astro**

```astro
<!-- Linia 12-16 -->
<h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-6 sm:mb-8 leading-tight">
  TWOJE HASŁO<br />
  <span class="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-transparent bg-clip-text">GŁÓWNE.</span><br />
  TUTAJ.
</h1>

<!-- Linia 18-23 -->
<p class="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto px-4">
  Twój opis platformy.
  <span class="hidden sm:inline"><br /></span>
  <span class="sm:hidden"> </span>
  Dodatkowa linia opisu.
</p>
```

## 4. 🎨 Zmiana Funkcji Platformy

**src/components/landing/FeaturesSection.astro**

Możesz zmienić istniejące funkcje lub dodać nowe:

```astro
<!-- Funkcja 1 -->
<div class="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1">
  <div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
  
  <div class="relative z-10">
    <!-- Ikona -->
    <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
      <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <!-- Twoja ikona SVG -->
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="..."></path>
      </svg>
    </div>
    
    <!-- Tytuł i opis -->
    <h3 class="text-2xl font-bold text-white mb-4">Nazwa Funkcji</h3>
    <p class="text-gray-300 leading-relaxed">
      Opis funkcji Twojej platformy...
    </p>
  </div>
</div>
```

### Ikony do użycia:

Możesz użyć ikon z Heroicons lub innych bibliotek SVG. Przykłady:

**Książka:**
```html
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
```

**Wykres:**
```html
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
```

**Użytkownik:**
```html
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
```

## 5. 🌐 Aktualizacja Linków

Wszystkie linki są obecnie placeholderami. Zaktualizuj je w:

**src/components/landing/Navbar.astro**
```astro
<!-- Desktop CTA buttons -->
<a href="/twoja-strona-logowania" class="...">Zaloguj się</a>
<a href="/twoja-strona-demo" class="...">Wypróbuj za darmo</a>

<!-- Menu links -->
<a href="#features">Funkcje</a>
<a href="#dla-kogo">Dla kogo</a>
<a href="#o-platformie">O platformie</a>
<a href="#kontakt">Kontakt</a>
```

**src/components/landing/Footer.astro**
```astro
<!-- Social media links -->
<a href="https://twitter.com/twoj_profil" target="_blank" rel="noopener noreferrer">Twitter</a>
<a href="https://linkedin.com/company/twoja-firma" target="_blank" rel="noopener noreferrer">LinkedIn</a>
<a href="https://github.com/twoj-profil" target="_blank" rel="noopener noreferrer">GitHub</a>
```

## 6. 🎨 Zmiana Kolorów

Jeśli chcesz zmienić paletę kolorów, edytuj classes Tailwind:

### Kolor Primary (obecnie niebieski):

Zamień wszystkie wystąpienia:
- `blue-500` → `purple-500` (lub inny kolor)
- `blue-600` → `purple-600`
- `blue-400` → `purple-400`
- `blue-700` → `purple-700`

### Przykład w plikach:
```bash
# Użyj find & replace w edytorze:
blue-500 → purple-500
blue-600 → purple-600
```

### Dostępne kolory Tailwind:
- `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`

## 7. 📝 Zmiana Tekstów

**src/components/landing/ValueSection.astro**
```astro
<!-- Nagłówek -->
<h2 id="value-heading" class="...">
  Twój nagłówek<br />
  <span class="...">z akcentem</span>
</h2>

<!-- Opisy -->
<p class="...">
  Twój opis platformy...
</p>

<p class="...">
  Dodatkowe informacje...
</p>
```

**src/components/landing/ScrollingBanner.astro**
```astro
<!-- Zmień teksty w bannerze -->
<span class="...">TWÓJ TEKST 1</span>
<span class="...">TWÓJ TEKST 2</span>
<span class="...">TWÓJ TEKST 3</span>
<span class="...">TWÓJ TEKST 4</span>

<!-- Pamiętaj o duplikacji dla seamless loop -->
```

## 8. 🖼️ Dodanie Logo

### Przygotuj logo:
- Format: PNG lub SVG
- Rozmiar: 512x512px (zalecane)
- Umieść w: `public/logo.png`

### Zamień placeholder w Navbar:
```astro
<!-- Stare (placeholder) -->
<div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
  <span class="text-white font-bold text-xl" aria-hidden="true">L</span>
</div>

<!-- Nowe (z logo) -->
<img src="/logo.png" alt="Logo" class="w-8 h-8 rounded-lg" />
```

## 9. 🔍 SEO i Meta Tags

**src/layouts/Layout.astro**
```astro
const { 
  title = "Twoja Platforma - Opis",
  description = "Pełny opis Twojej platformy do 160 znaków..."
} = Astro.props;

<!-- Dodaj więcej meta tags -->
<meta name="keywords" content="twoje, słowa, kluczowe, tutaj" />
<meta name="author" content="Twoje Imię / Firma" />
```

## 10. 📱 Social Media Cards

**src/layouts/Layout.astro**
```astro
<!-- Open Graph -->
<meta property="og:image" content="/og-image.png" />
<meta property="og:url" content="https://twoja-domena.pl" />

<!-- Twitter -->
<meta name="twitter:site" content="@twoj_twitter" />
<meta name="twitter:creator" content="@twoj_twitter" />
<meta name="twitter:image" content="/twitter-card.png" />
```

Przygotuj obrazy:
- `public/og-image.png` - 1200x630px dla Facebook/LinkedIn
- `public/twitter-card.png` - 1200x600px dla Twitter

## 11. 🎬 Dodanie Sekcji z Video

Możesz dodać sekcję z video demo między Features i Control Section:

```astro
<!-- src/components/landing/VideoSection.astro -->
<section class="bg-slate-900 py-16 sm:py-20 lg:py-24">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
      Zobacz <span class="bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">jak to działa</span>
    </h2>
    
    <div class="max-w-4xl mx-auto">
      <div class="relative rounded-2xl overflow-hidden shadow-2xl" style="padding-bottom: 56.25%; /* 16:9 */">
        <iframe 
          class="absolute top-0 left-0 w-full h-full"
          src="https://www.youtube.com/embed/TWOJ_VIDEO_ID"
          title="Demo video"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    </div>
  </div>
</section>
```

Dodaj w `src/pages/index.astro`:
```astro
import VideoSection from "../components/landing/VideoSection.astro";

<!-- ... -->
<FeaturesSection />
<VideoSection />
<ControlSection />
```

## 12. 💬 Dodanie Sekcji Testimonials

```astro
<!-- src/components/landing/TestimonialsSection.astro -->
<section class="bg-slate-950 py-16 sm:py-20 lg:py-24">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-center mb-12">
      Co mówią <span class="bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">nasi użytkownicy</span>
    </h2>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Testimonial 1 -->
      <div class="bg-slate-900 rounded-2xl p-8 border border-white/10">
        <p class="text-gray-300 mb-6">"Cytat od użytkownika..."</p>
        <div class="flex items-center">
          <img src="/avatar1.jpg" alt="Jan Kowalski" class="w-12 h-12 rounded-full mr-4" />
          <div>
            <div class="font-semibold text-white">Jan Kowalski</div>
            <div class="text-sm text-gray-400">Student</div>
          </div>
        </div>
      </div>
      
      <!-- Powtórz dla więcej testimonials -->
    </div>
  </div>
</section>
```

## 🎉 Gotowe!

Po dokonaniu customizacji:

1. Sprawdź stronę w przeglądarce: `http://localhost:3000`
2. Przetestuj responsywność (DevTools → Toggle device toolbar)
3. Sprawdź accessibility (Lighthouse w Chrome DevTools)
4. Uruchom `npm run build` aby upewnić się, że nie ma błędów
5. Deploy na Vercel/Netlify

## 📚 Dodatkowe Zasoby

- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)
- [Heroicons](https://heroicons.com/) - darmowe ikony SVG
- [Unsplash](https://unsplash.com/) - darmowe zdjęcia
- [Coolors](https://coolors.co/) - generator palet kolorów
