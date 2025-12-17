# Enterprise-Grade Alert System - Dokumentacja

## Filozofia: Inline Alerts > Toasty

W aplikacjach enterprise lepszym podejściem jest pokazywanie komunikatów **w kontekście akcji**, a nie jako "latające" toasty.

### Dlaczego Inline Alerts?

✅ **Kontekst** - Użytkownik widzi komunikat tam gdzie wykonał akcję  
✅ **Nie rozpraszają** - Nie zakłócają pracy w innych częściach aplikacji  
✅ **Persystencja** - Komunikat pozostaje widoczny dopóki użytkownik go nie odczyta  
✅ **Accessibility** - Lepsze dla screen readerów (aria-live regions)  
✅ **Professional** - Standardowe podejście w systemach enterprise (SAP, Salesforce, ServiceNow)

❌ **Czemu unikamy toastów:**
- Rozpraszają uwagę
- Znikają zanim użytkownik zdąży przeczytać
- Mogą zakrywać ważne elementy UI
- Trudne do testowania automatycznie
- Słabe dla accessibility

## Implementacja

### 1. Alert Provider (Tylko Confirm)

```typescript
// src/components/providers/AlertProvider.tsx
interface AlertContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  // BEZ toast!
}
```

### 2. Inline Alerts w Komponentach

```typescript
export function ModulesManager() {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { confirm } = useAlert();

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({...});
    if (!confirmed) return;

    try {
      setError(null);
      setSuccessMessage(null);
      
      await deleteModule(id);
      
      setSuccessMessage("Moduł został pomyślnie usunięty");
      // Auto-hide after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      {/* Inline Success Alert */}
      {successMessage && (
        <Alert className="bg-green-900/20 border-green-500/20 text-green-400">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      
      {/* Inline Error Alert */}
      {error && (
        <Alert className="bg-red-900/20 border-red-500/20 text-red-400">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Rest of component */}
    </div>
  );
}
```

### 3. Typy Komunikatów

#### ✅ Success (Zielony)
```tsx
<Alert className="bg-green-900/20 border-green-500/20 text-green-400">
  <CheckCircle className="h-4 w-4" />
  <AlertDescription>Operacja zakończona sukcesem</AlertDescription>
</Alert>
```

#### ❌ Error (Czerwony)
```tsx
<Alert className="bg-red-900/20 border-red-500/20 text-red-400">
  <XCircle className="h-4 w-4" />
  <AlertDescription>Wystąpił błąd</AlertDescription>
</Alert>
```

#### ⚠️ Warning (Żółty)
```tsx
<Alert className="bg-yellow-900/20 border-yellow-500/20 text-yellow-400">
  <AlertTriangle className="h-4 w-4" />
  <AlertDescription>Uwaga: ważna informacja</AlertDescription>
</Alert>
```

#### ℹ️ Info (Niebieski)
```tsx
<Alert className="bg-blue-900/20 border-blue-500/20 text-blue-400">
  <Info className="h-4 w-4" />
  <AlertDescription>Informacja dla użytkownika</AlertDescription>
</Alert>
```

## Best Practices

### 1. Auto-hide dla Success
```typescript
setSuccessMessage("Zapisano pomyślnie");
setTimeout(() => setSuccessMessage(null), 5000); // 5 sekund
```

### 2. Error pozostaje dopóki nie rozwiązany
```typescript
// Error nie znika automatycznie
setError("Nie można zapisać");
// Użytkownik musi wykonać akcję lub zamknąć ręcznie
```

### 3. Clear przed nową akcją
```typescript
const handleAction = async () => {
  setError(null);         // Wyczyść stare komunikaty
  setSuccessMessage(null);
  
  try {
    await doSomething();
    setSuccessMessage("OK!");
  } catch (err) {
    setError(err.message);
  }
};
```

### 4. Pozycja w UI
- **Na górze komponentu** - Dla komunikatów o całym komponencie
- **Nad formularzem** - Dla błędów walidacji
- **W sekcji** - Dla komunikatów o konkretnej sekcji

### 5. Animacje
```tsx
<Alert className="... animate-in fade-in duration-300">
```

## Przykłady z Real-World

### SAP Fiori
- Wszystkie komunikaty inline
- "Message Strip" na górze ekranu
- Brak toastów

### Salesforce Lightning
- Inline alerts w kontekście
- Toast tylko dla background jobs
- Clear visual hierarchy

### ServiceNow
- Inline messages
- Fixed position dla system notifications
- Contextual alerts

## Migracja z Toastów

| Toast | → | Inline Alert |
|-------|---|-------------|
| `toast.success("OK")` | → | `setSuccessMessage("OK")` |
| `toast.error("Error")` | → | `setError("Error")` |
| Znika auto | → | Auto-hide 5s (success) lub manual (error) |
| Globalny | → | Lokalny w komponencie |

## Komponenty Zaktualizowane

✅ ModulesManager - Inline alerts dla CRUD operacji
🔄 CoursesManagement - Do zaktualizowania  
🔄 UsersManagement - Do zaktualizowania  
🔄 QuizzesManagement - Do zaktualizowania  
🔄 LessonsManager - Do zaktualizowania  
🔄 CourseCreator - Do zaktualizowania  

## Podsumowanie

**Enterprise approach:**
- ✅ Confirm dialogi dla potwierdzenia akcji
- ✅ Inline alerts dla feedback
- ❌ NO toasty!

**Rezultat:**
- Lepsza UX
- Mniej rozpraszania
- Profesjonalny wygląd
- Łatwiejsze testowanie

