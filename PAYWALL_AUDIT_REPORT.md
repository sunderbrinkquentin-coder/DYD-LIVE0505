# Paywall-Implementierung: Vollständige Analyse & Audit

**Datum:** 2025-12-03
**Status:** ⚠️ KRITISCHE INKONSISTENZEN GEFUNDEN

---

## 📋 Executive Summary

Das Payment-System ist im **Backend unified** (Stripe Webhook), aber im **Frontend inkonsistent** implementiert. Es gibt zwei verschiedene Ansätze, die zu Verwirrung und potenziellen Bugs führen.

### ✅ Was funktioniert:
- Stripe Webhook verarbeitet alle Zahlungen korrekt
- Token werden zur `user_tokens` Tabelle hinzugefügt
- CVs werden als `is_paid` markiert wenn cvId in metadata
- Alle Stripe Price IDs sind korrekt konfiguriert

### ❌ Was nicht funktioniert:
1. **Inkonsistente Frontend-Logik** zwischen CV Check und CV Wizard Flows
2. **Falsche Environment-Variable** in CV Check Flow (`VITE_STRIPE_PRICE_2_EUR` sollte 5€ sein)
3. **Fehlende cvId** im CV Check Payment-Flow
4. **Doppelte Prüflogik** (Token vs. download_unlocked)

---

## 🔄 Aktuelle Flow-Implementierung

### Flow 1: CV Check → Save to Dashboard

**Komponente:** `src/components/AtsResultDisplay.tsx`

```typescript
// ✅ KORREKT: Token-basierte Prüfung
const handleSaveToDashboard = async () => {
  if (!user) {
    navigate(`/login?redirect=${encodeURIComponent(currentPath)}&action=save`);
    return;
  }

  const hasTokens = await tokenService.hasTokens(user.id);
  if (!hasTokens) {
    setShowPaywall(true); // Zeigt Paywall Modal
    return;
  }

  await performSave(); // Konsumiert Token
};
```

**Paywall-Logik:**
- Prüft `user_tokens.credits > 0`
- Bei Klick auf "Jetzt kaufen":
  - ❌ **PROBLEM:** Verwendet `VITE_STRIPE_PRICE_2_EUR` (price_1SZc133Sd9dZl64SYr82cZcX)
  - ❌ **PROBLEM:** Sendet **keine cvId** im metadata
  - ✅ Success URL: `/cv-result/${uploadId}?payment=success`

**Was passiert nach Zahlung:**
1. Stripe Webhook fügt 1 Token hinzu (weil Legacy Price ID)
2. User wird zu Result Page redirected mit `?payment=success`
3. **ABER:** CV wird nicht als paid markiert (keine cvId!)
4. Manuelles Speichern erforderlich

---

### Flow 2: CV Wizard → Download

**Komponenten:**
- `src/pages/CVLiveEditorPage.tsx`
- `src/pages/CvPaywallPage.tsx`

```typescript
// ❌ INKONSISTENT: Prüft nur download_unlocked, nicht Token
const handleDownloadClick = async () => {
  if (!user) {
    navigate(`/login?redirect=${encodeURIComponent(`/cv-paywall?cvId=${cvId}`)}`);
    return;
  }

  if (!isDownloadUnlocked) {
    navigate(`/cv-paywall?cvId=${cvId}`);
    return;
  }

  // Download PDF
};
```

**Paywall-Logik:**
- Prüft `stored_cvs.download_unlocked` Flag
- Zeigt Pakete (1/5/10 Optimierungen)
- Bei Auswahl:
  - ✅ Verwendet korrekte Price IDs (5€/20€/30€)
  - ✅ Sendet cvId im metadata
  - ✅ Success URL: `/cv-paywall?cvId=${cvId}&payment=success`

**Was passiert nach Zahlung:**
1. Stripe Webhook fügt Token hinzu (1/5/10)
2. Stripe Webhook setzt `is_paid = true` und `download_unlocked = true`
3. User wird zu Paywall Page redirected
4. Paywall Page prüft `is_paid` und redirected zu Editor
5. Download ist freigeschaltet

---

## 💾 Backend: Stripe Webhook (UNIFIED)

**Datei:** `supabase/functions/stripe-webhook/index.ts`

### Token-Mapping nach Price ID:

| Price ID | Preis | Token | Variable |
|----------|-------|-------|----------|
| `price_1SZbVG3Sd9dZl64SLJPFwfk3` | 5€ | 1 | `VITE_STRIPE_PRICE_5_EUR` |
| `price_1SZbVs3Sd9dZl64SpcjlM7vG` | 20€ | 5 | `VITE_STRIPE_PRICE_20_EUR` |
| `price_1SZbWQ3Sd9dZl64SFdf1QsGm` | 30€ | 10 | `VITE_STRIPE_PRICE_30_EUR` |
| `price_1SZc133Sd9dZl64SYr82cZcX` | 5€ | 1 | `VITE_STRIPE_PRICE_2_EUR` ⚠️ **FALSCHER NAME** |

### Webhook-Logik:

```typescript
if (event.type === 'checkout.session.completed') {
  // 1️⃣ Token hinzufügen zu user_tokens
  if (tokensToAdd > 0) {
    await supabase.from('user_tokens').upsert({
      user_id: userId,
      credits: newBalance,
    });
  }

  // 2️⃣ CV als paid markieren (wenn cvId vorhanden)
  if (cvId) {
    // Versuche cv_records
    await supabase.from('cv_records')
      .update({ is_paid: true, payment_date: now })
      .eq('id', cvId);

    // Fallback: stored_cvs
    await supabase.from('stored_cvs')
      .update({ is_paid: true, download_unlocked: true, payment_date: now })
      .eq('id', cvId);
  }

  // 3️⃣ Order-Record erstellen
  await supabase.from('stripe_orders').insert({...});
}
```

**✅ Das Backend ist perfekt implementiert!**

---

## 🗄️ Datenbank-Tabellen

### 1. `user_tokens`
```sql
CREATE TABLE user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Verwendung:**
- Speichert Token-Balance pro User
- Wird von `tokenService.ts` verwaltet
- ✅ Wird im CV Check Flow verwendet
- ❌ Wird NICHT im CV Wizard Flow verwendet

---

### 2. `stored_cvs`
```sql
CREATE TABLE stored_cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  file_name TEXT,
  cv_data JSONB,
  ats_json JSONB,
  status TEXT DEFAULT 'pending',
  is_paid BOOLEAN DEFAULT false,
  download_unlocked BOOLEAN DEFAULT false,
  payment_date TIMESTAMPTZ,
  ...
);
```

**Felder für Payment:**
- `is_paid`: Wurde Zahlung durchgeführt?
- `download_unlocked`: Download freigeschaltet?
- `payment_date`: Zeitpunkt der Zahlung

**Verwendung:**
- ✅ Wird im CV Wizard Flow verwendet
- ❌ Wird NICHT im CV Check Flow verwendet (cvId fehlt!)

---

### 3. `cv_records`
```sql
CREATE TABLE cv_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  payment_date TIMESTAMPTZ,
  ...
);
```

**Verwendung:**
- Alternative zu stored_cvs
- Webhook versucht beide Tabellen
- Wird aktuell kaum genutzt

---

### 4. `stripe_orders`
```sql
CREATE TABLE stripe_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_session_id TEXT UNIQUE NOT NULL,
  payment_intent_id TEXT,
  customer_id TEXT,
  amount_subtotal BIGINT,
  amount_total BIGINT,
  currency TEXT DEFAULT 'eur',
  payment_status TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Verwendung:**
- Tracking aller Bestellungen
- ✅ Wird von Webhook gefüllt

---

### 5. `stripe_customers`
```sql
CREATE TABLE stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users UNIQUE NOT NULL,
  customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Verwendung:**
- Mapping user_id ↔ Stripe Customer ID
- ✅ Wird von Webhook verwendet
- ✅ Wird von stripe-checkout Edge Function erstellt

---

## 🔴 Kritische Probleme

### Problem 1: Inkonsistente Frontend-Logik

**CV Check Flow:**
```typescript
// Prüft Token
const hasTokens = await tokenService.hasTokens(user.id);
```

**CV Wizard Flow:**
```typescript
// Prüft download_unlocked Flag
if (!isDownloadUnlocked) { ... }
```

**❌ PROBLEM:** Zwei verschiedene Ansätze für das gleiche Ziel!

**✅ LÖSUNG:** Alle Flows sollten Token-basiert sein:
```typescript
// Konsistenter Ansatz
const hasTokens = await tokenService.hasTokens(user.id);
if (!hasTokens) {
  navigate(`/cv-paywall?cvId=${cvId}`);
  return;
}

// Bei Download: Token konsumieren
await tokenService.consumeToken(user.id);
```

---

### Problem 2: Falsche Environment-Variable

**In `.env`:**
```bash
VITE_STRIPE_PRICE_2_EUR=price_1SZc133Sd9dZl64SYr82cZcX
```

**In Dokumentation (`CV_CHECK_PAYWALL_INTEGRATION.md`):**
```
Price ID: price_1SZc133Sd9dZl64SYr82cZcX
Preis: 5,00 EUR  # ← NICHT 2 EUR!
```

**❌ PROBLEM:** Variable heißt `_2_EUR` aber Preis ist 5 EUR!

**✅ LÖSUNG:** Umbenennen in `.env`:
```bash
# Alt (falsch):
VITE_STRIPE_PRICE_2_EUR=price_1SZc133Sd9dZl64SYr82cZcX

# Neu (korrekt):
VITE_STRIPE_PRICE_5_EUR_TOKEN=price_1SZc133Sd9dZl64SYr82cZcX  # CV Check Token
VITE_STRIPE_PRICE_5_EUR=price_1SZbVG3Sd9dZl64SLJPFwfk3      # Wizard 1x Package
```

**Oder besser:** CV Check sollte die gleiche 5€ Price ID verwenden wie Wizard!

---

### Problem 3: Fehlende cvId im CV Check Flow

**In `AtsResultDisplay.tsx`:**
```typescript
const response = await fetch(STRIPE_CHECKOUT_URL, {
  method: 'POST',
  body: JSON.stringify({
    price_id: import.meta.env.VITE_STRIPE_PRICE_2_EUR,
    success_url: successUrl,
    cancel_url: cancelUrl,
    mode: 'payment',
    metadata: {
      // ❌ cvId fehlt hier!
    },
  }),
});
```

**❌ PROBLEM:** Webhook kann CV nicht als paid markieren!

**✅ LÖSUNG:** cvId mitschicken:
```typescript
metadata: {
  cv_id: uploadId,
  source: 'cv-check',
}
```

---

### Problem 4: Doppelte Download-Prüfung

**Aktuell:**
```typescript
// CVLiveEditorPage.tsx
if (!isDownloadUnlocked) {
  navigate(`/cv-paywall?cvId=${cvId}`);
  return;
}
```

**✅ BESSER:**
```typescript
// Kombinierte Prüfung
const hasTokens = await tokenService.hasTokens(user.id);
const isPaid = cvData?.is_paid || cvData?.download_unlocked;

if (!hasTokens && !isPaid) {
  navigate(`/cv-paywall?cvId=${cvId}`);
  return;
}

// Bei Download: Token konsumieren (wenn nicht bereits paid)
if (!isPaid) {
  await tokenService.consumeToken(user.id);
}
```

**Logik:**
- Wenn CV bereits paid → Direkter Download (kein Token-Konsum)
- Wenn CV nicht paid → Token prüfen → Token konsumieren → Download

---

## ✅ Empfohlene Lösung: Unified Token-System

### Konzept:

**Alle Flows verwenden Token-basierte Paywall mit cvId-Tracking:**

1. **User kauft Token** (5€/20€/30€ Pakete)
2. **cvId wird im metadata** mitgeschickt
3. **Webhook fügt Token hinzu** UND **markiert CV als paid**
4. **Frontend prüft Token** beim Speichern/Download
5. **Token wird konsumiert** beim Speichern/Download
6. **download_unlocked** dient als Fallback für bereits bezahlte CVs

### Vorteile:

✅ **Einheitliche Logik** in allen Flows
✅ **Klare Token-Verwaltung** für User
✅ **Flexibilität** (User kann mit 1 Paket mehrere CVs erstellen)
✅ **Transparenz** (User sieht Token-Balance im Dashboard)
✅ **Fallback** (download_unlocked für Legacy-CVs)

---

## 🛠️ Erforderliche Änderungen

### 1. `.env` aktualisieren
```bash
# Token-System (CV Check)
VITE_STRIPE_PRICE_5_EUR_TOKEN=price_1SZc133Sd9dZl64SYr82cZcX

# Package-System (CV Wizard) - ODER gleiche ID nutzen!
VITE_STRIPE_PRICE_5_EUR=price_1SZbVG3Sd9dZl64SLJPFwfk3
VITE_STRIPE_PRICE_20_EUR=price_1SZbVs3Sd9dZl64SpcjlM7vG
VITE_STRIPE_PRICE_30_EUR=price_1SZbWQ3Sd9dZl64SFdf1QsGm
```

---

### 2. `AtsResultDisplay.tsx` fixen

**Füge cvId im metadata hinzu:**
```typescript
metadata: {
  cv_id: uploadId,
  source: 'cv-check',
}
```

**Verwende korrekte Price ID:**
```typescript
price_id: import.meta.env.VITE_STRIPE_PRICE_5_EUR_TOKEN || import.meta.env.VITE_STRIPE_PRICE_5_EUR
```

---

### 3. `CVLiveEditorPage.tsx` auf Token umstellen

**Ersetze:**
```typescript
if (!isDownloadUnlocked) {
  navigate(`/cv-paywall?cvId=${cvId}`);
  return;
}
```

**Mit:**
```typescript
// Kombinierte Prüfung
const { data: cvData } = await supabase
  .from('stored_cvs')
  .select('is_paid, download_unlocked')
  .eq('id', cvId)
  .single();

const isPaid = cvData?.is_paid || cvData?.download_unlocked;

if (!isPaid) {
  const hasTokens = await tokenService.hasTokens(user.id);
  if (!hasTokens) {
    navigate(`/cv-paywall?cvId=${cvId}`);
    return;
  }

  // Token konsumieren
  await tokenService.consumeToken(user.id);

  // CV als paid markieren
  await supabase
    .from('stored_cvs')
    .update({ is_paid: true, download_unlocked: true })
    .eq('id', cvId);
}

// Download
```

---

### 4. Dashboard: Token-Balance anzeigen

**In `DashboardPage.tsx`:**
```typescript
const [tokenBalance, setTokenBalance] = useState(0);

useEffect(() => {
  if (user) {
    tokenService.getUserTokens(user.id).then(tokens => {
      setTokenBalance(tokens?.credits || 0);
    });
  }
}, [user]);

// UI
<div className="bg-white/5 rounded-xl p-4">
  <div className="text-sm text-white/60">Verfügbare Token</div>
  <div className="text-2xl font-bold text-[#66c0b6]">{tokenBalance}</div>
  <button onClick={() => navigate('/cv-paywall')} className="...">
    Token kaufen
  </button>
</div>
```

---

## 📊 Vergleich: Vorher vs. Nachher

### Vorher (Aktuell):

| Flow | Prüfung | Token-Konsum | cvId metadata | Problem |
|------|---------|--------------|---------------|---------|
| CV Check | ✅ Token | ✅ Ja | ❌ Nein | CV wird nicht paid markiert |
| CV Wizard | ❌ download_unlocked | ❌ Nein | ✅ Ja | Inkonsistent, keine Token-Balance |

### Nachher (Empfohlen):

| Flow | Prüfung | Token-Konsum | cvId metadata | Vorteil |
|------|---------|--------------|---------------|---------|
| CV Check | ✅ Token | ✅ Ja | ✅ Ja | Konsistent, CV wird paid markiert |
| CV Wizard | ✅ Token (+Fallback) | ✅ Ja | ✅ Ja | Konsistent, Token-Balance klar |

---

## 🎯 Zusammenfassung

### Status Quo:
- ⚠️ Backend ist perfekt (Webhook unified)
- ❌ Frontend ist inkonsistent
- ❌ Environment-Variablen falsch benannt
- ❌ cvId fehlt in CV Check Flow
- ❌ Zwei verschiedene Paywall-Logiken

### Empfehlung:
1. **Unified Token-System** im Frontend implementieren
2. **cvId immer mitschicken** in metadata
3. **Environment-Variablen** umbenennen
4. **Token-Balance** im Dashboard anzeigen
5. **download_unlocked als Fallback** für Legacy-CVs

### Aufwand:
- 🟡 **Mittlerer Aufwand** (~4-6 Stunden)
- Hauptsächlich Frontend-Änderungen
- Backend funktioniert bereits perfekt
- Keine Breaking Changes (Fallback-Logik)

### Priorität:
- 🔴 **HOCH** - Aktuell können User verwirrt sein
- 🔴 **HOCH** - Token-System wird nicht voll genutzt
- 🔴 **HOCH** - Inkonsistenz führt zu Bugs

---

**Ende des Audit-Reports**
