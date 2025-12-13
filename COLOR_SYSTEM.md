# 🎨 System Kolorów - Przewodnik Użycia

Wszystkie kolory z landing page są dostępne globalnie jako zmienne CSS i klasy Tailwind.

## Dostępne Kolory

### 🌑 Tła (Backgrounds)

**CSS Variables:**
```css
var(--background)         /* #0F172A - slate-900 (główne tło) */
var(--background-darker)  /* #020617 - slate-950 (ciemniejsze tło) */
var(--background-purple)  /* #581C87 - purple-900 (akcentowe tło) */
```

**Tailwind Classes:**
```html
<div class="bg-background">Główne tło</div>
<div class="bg-slate-900">Równoważne slate-900</div>
<div class="bg-slate-950">Ciemniejsze tło</div>
<div class="bg-purple-900">Fioletowe tło</div>
```

**Gradienty (jak w Hero Section):**
```html
<div class="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
  Hero gradient
</div>
```

### 📝 Teksty (Foreground)

**CSS Variables:**
```css
var(--foreground)           /* white - główny tekst */
var(--foreground-secondary) /* #E2E8F0 - gray-300 */
var(--foreground-muted)     /* #94A3B8 - gray-400 */
```

**Tailwind Classes:**
```html
<p class="text-foreground">Główny tekst (biały)</p>
<p class="text-white">Równoważne white</p>
<p class="text-gray-300">Drugorzędny tekst</p>
<p class="text-gray-400">Wyciszony tekst</p>
```

### 🔵 Primary (Niebieski Akcent)

**CSS Variables:**
```css
var(--primary)       /* #3B82F6 - blue-600 */
var(--primary-hover) /* #2563EB - blue-700 */
var(--primary-light) /* #60A5FA - blue-400 */
var(--primary-glow)  /* blue-600 z opacity (dla efektów) */
```

**Tailwind Classes:**
```html
<!-- Tła -->
<button class="bg-primary">Primary button</button>
<button class="bg-blue-600">Równoważne blue-600</button>
<button class="bg-blue-600 hover:bg-blue-700">Z hover</button>

<!-- Teksty -->
<span class="text-primary">Niebieski tekst</span>
<span class="text-blue-600">Równoważne</span>

<!-- Gradienty -->
<h1 class="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-transparent bg-clip-text">
  Gradient text (jak w Hero)
</h1>
```

### 🃏 Karty (Cards)

**CSS Variables:**
```css
var(--card)        /* slate-800 z opacity */
var(--card-glass)  /* rgba(255,255,255,0.05) - glass-morphism */
var(--card-border) /* rgba(255,255,255,0.1) - border */
```

**Tailwind Classes - Glass-morphism (jak w Features):**
```html
<div class="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
  Glass-morphism card
</div>

<!-- Lub prościej: -->
<div class="bg-card border border-card-border rounded-lg p-6">
  Prosta karta
</div>
```

### 🔳 Borders & Inputs

**CSS Variables:**
```css
var(--border) /* rgba(255,255,255,0.1) */
var(--input)  /* rgba(255,255,255,0.15) */
```

**Tailwind Classes:**
```html
<div class="border border-white/10">Element z border</div>
<input class="border border-white/15 bg-transparent" />
```

## 📋 Przykłady Użycia

### 1. Button w stylu Landing Page

```astro
<!-- Primary Button -->
<button class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-blue-500/50">
  Wypróbuj za darmo
</button>

<!-- Secondary Button (Outline) -->
<button class="border-2 border-white/30 hover:border-white/60 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all backdrop-blur-sm">
  Zobacz więcej
</button>
```

### 2. Karta z Glass-morphism

```astro
<div class="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1">
  <div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
  
  <div class="relative z-10">
    <h3 class="text-2xl font-bold text-white mb-4">Tytuł karty</h3>
    <p class="text-gray-300">Opis karty...</p>
  </div>
</div>
```

### 3. Gradient Text (jak w Hero)

```astro
<h1 class="text-6xl font-bold text-white">
  TWÓJ TEKST<br />
  <span class="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-transparent bg-clip-text">
    Z AKCENTEM
  </span><br />
  TUTAJ
</h1>
```

### 4. Sekcja z Gradient Background

```astro
<section class="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-24">
  <div class="max-w-7xl mx-auto px-4">
    <h2 class="text-4xl font-bold text-white mb-8">Tytuł Sekcji</h2>
    <!-- Treść -->
  </div>
</section>
```

### 5. Link z Primary Color

```astro
<a href="/demo" class="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
  Zobacz więcej
  <svg class="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
  </svg>
</a>
```

### 6. Input Field

```astro
<input 
  type="text" 
  class="w-full bg-slate-800/50 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-colors"
  placeholder="Twój email..."
/>
```

### 7. Card z Hover Glow Effect

```astro
<div class="relative bg-slate-800/50 rounded-xl p-6 border border-white/10 transition-all hover:border-blue-500/50 group">
  <!-- Glow effect na hover -->
  <div class="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity -z-10"></div>
  
  <h3 class="text-xl font-bold text-white mb-2">Tytuł</h3>
  <p class="text-gray-300">Treść karty...</p>
</div>
```

## 🎨 Najczęściej Używane Kombinacje

### Hero Section Style
```html
<section class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
  <h1 class="text-7xl font-bold text-white">
    <span class="bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
      Gradient Text
    </span>
  </h1>
</section>
```

### Feature Card Style
```html
<div class="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-blue-500/50 transition-all">
  <!-- Content -->
</div>
```

### CTA Button Style
```html
<button class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-blue-500/50">
  Call to Action
</button>
```

### Stats/Numbers Style
```html
<div class="text-6xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
  10,000+
</div>
<div class="text-xl text-gray-300">Użytkowników</div>
```

## 🔧 Customowe Komponenty

### Przyciski

```astro
---
// src/components/ui/Button.astro
interface Props {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const { variant = 'primary', size = 'md' } = Astro.props;

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/50',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-white',
  outline: 'border-2 border-white/30 hover:border-white/60 text-white backdrop-blur-sm'
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg'
};
---

<button class={`rounded-lg font-semibold transition-all transform hover:scale-105 ${variants[variant]} ${sizes[size]}`}>
  <slot />
</button>
```

### Card Component

```astro
---
// src/components/ui/Card.astro
interface Props {
  glass?: boolean;
  hover?: boolean;
}

const { glass = false, hover = false } = Astro.props;
---

<div class={`
  rounded-2xl p-8 border transition-all
  ${glass ? 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border-white/10' : 'bg-slate-800 border-white/10'}
  ${hover ? 'hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1' : ''}
`}>
  <slot />
</div>
```

## 💡 Tips & Tricks

### 1. Używaj Opacity dla Subtelności
```html
<!-- Zamiast nowych kolorów, użyj opacity -->
<div class="bg-white/5">Subtelne tło</div>
<div class="border-white/10">Subtelny border</div>
<div class="text-white/70">Subtelny tekst</div>
```

### 2. Backdrop Blur dla Glass Effect
```html
<div class="backdrop-blur-sm bg-white/5">Glass morphism</div>
<div class="backdrop-blur-md bg-slate-800/50">Stronger blur</div>
```

### 3. Gradient Overlays
```html
<div class="relative">
  <!-- Gradient overlay -->
  <div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
  <!-- Content -->
  <div class="relative z-10">Content here</div>
</div>
```

### 4. Konsystentne Shadows
```html
<!-- Primary button shadow -->
<button class="shadow-lg hover:shadow-blue-500/50">Button</button>

<!-- Card shadow -->
<div class="shadow-2xl shadow-blue-500/20">Card</div>
```

## 📚 Referencje

- **Primary Blue:** `blue-600` (#3B82F6)
- **Primary Hover:** `blue-700` (#2563EB)
- **Primary Light:** `blue-400` (#60A5FA)
- **Background Dark:** `slate-900` (#0F172A)
- **Background Darker:** `slate-950` (#020617)
- **Accent Purple:** `purple-900` (#581C87)
- **Text Primary:** `white` (#FFFFFF)
- **Text Secondary:** `gray-300` (#E2E8F0)
- **Text Muted:** `gray-400` (#94A3B8)

## 🎯 Best Practices

1. **Używaj zmiennych CSS** dla wartości które mogą się zmienić
2. **Używaj klas Tailwind** dla statycznych stylów
3. **Zachowaj spójność** z landing page używając tych samych kombinacji
4. **Nie mieszaj** zbyt wielu kolorów - trzymaj się palety
5. **Testuj w dark mode** - wszystkie kolory są zoptymalizowane pod ciemny motyw
6. **Używaj opacity** (`/10`, `/50`, `/70`) dla subtelnych efektów
7. **Dodawaj transitions** dla lepszego UX (`transition-all`, `transition-colors`)

---

**Wszystkie kolory są dostępne zarówno jako:**
- CSS Variables (`var(--primary)`)
- Tailwind Classes (`bg-blue-600`)
- Inline styles (gdy potrzebne)

**Spójność jest kluczem!** Używaj tych samych kombinacji co na landing page dla profesjonalnego wyglądu całej aplikacji.
