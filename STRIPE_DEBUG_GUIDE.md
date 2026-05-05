# Stripe Integration Debug Guide

## 🔍 Häufigste Fehlerquellen

### 1. ❌ FEHLER: "Failed to authenticate user" oder "No valid session/token found"

**Problem:** Der Benutzer ist nicht eingeloggt oder die Session ist abgelaufen.

**Lösung:**
```typescript
// Prüfe in der Browser Console:
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

**Fix:** Benutzer muss sich einloggen bevor er zur Paywall kommt.

---

### 2. ❌ FEHLER: "Missing required parameter" oder 400 Error vom Edge Function

**Problem:** Die Stripe Secret Keys sind nicht in Supabase konfiguriert.

**Lösung:**
1. Gehe zu: https://supabase.com/dashboard/project/vuumqarzylewhzvtbtcl/settings/functions
2. Klicke auf "Edge Function Secrets"
3. Füge hinzu:
   ```
   STRIPE_SECRET_KEY=sk_test_51SXOItKwYb6WaX5I... (dein echter Secret Key)
   STRIPE_WEBHOOK_SECRET=whsec_... (dein Webhook Secret)
   ```

**Wichtig:** Die Secret Keys dürfen NICHT mit dem Frontend geteilt werden!

---

### 3. ❌ FEHLER: "Keine Stripe Price ID konfiguriert"

**Problem:** Die Price IDs in der `.env` stimmen nicht mit den Paketen überein.

**Aktuell konfiguriert:**
```env
VITE_STRIPE_PRICE_5_EUR=price_1SZbVG3Sd9dZl64SLJPFwfk3  # Single (5€)
VITE_STRIPE_PRICE_20_EUR=price_1SZbVs3Sd9dZl64SpcjlM7vG # Five (20€)
VITE_STRIPE_PRICE_30_EUR=price_1SZbWQ3Sd9dZl64SFdf1QsGm # Ten (30€)
```

**Lösung:** Prüfe im Stripe Dashboard unter Products, ob diese Price IDs existieren.

---

### 4. ❌ FEHLER: Webhook Events kommen nicht an

**Problem:** Der Webhook Endpoint ist nicht korrekt konfiguriert.

**Lösung:**
1. Gehe zu: https://dashboard.stripe.com/test/webhooks
2. Klicke auf "Add endpoint"
3. Endpoint URL: `https://vuumqarzylewhzvtbtcl.supabase.co/functions/v1/stripe-webhook`
4. Events auswählen: `checkout.session.completed`
5. Kopiere den "Signing secret" (beginnt mit `whsec_`)
6. Füge ihn als `STRIPE_WEBHOOK_SECRET` in Supabase Edge Function Secrets hinzu

---

### 5. ❌ FEHLER: CORS Error beim Aufruf der Edge Function

**Problem:** Der Edge Function hat CORS-Header Probleme.

**Aktueller Status:** ✅ CORS ist korrekt konfiguriert in beiden Edge Functions

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};
```

---

### 6. ❌ FEHLER: "User not found" oder "Customer not found" im Webhook

**Problem:** Die Verknüpfung zwischen Stripe Customer und Supabase User fehlt.

**Debug:**
```sql
-- Prüfe stripe_customers Tabelle
SELECT * FROM stripe_customers WHERE user_id = 'deine-user-id';
```

**Lösung:** Die Edge Function `stripe-checkout` erstellt automatisch einen Stripe Customer beim ersten Checkout.

---

### 7. ❌ FEHLER: Credits werden nicht gutgeschrieben

**Problem:** Der Webhook kann die Price ID nicht zuordnen oder user_tokens nicht updaten.

**Debug:**
```sql
-- Prüfe user_tokens
SELECT * FROM user_tokens WHERE user_id = 'deine-user-id';

-- Prüfe stripe_orders
SELECT * FROM stripe_orders ORDER BY created_at DESC LIMIT 5;
```

**Lösung:** Prüfe die Edge Function Logs:
1. Gehe zu: https://supabase.com/dashboard/project/vuumqarzylewhzvtbtcl/functions/stripe-webhook
2. Klicke auf "Logs"
3. Suche nach Fehlern

---

## 🧪 Testing Checklist

### Vor dem Testen:
- [ ] Benutzer ist eingeloggt
- [ ] `STRIPE_SECRET_KEY` ist in Supabase konfiguriert
- [ ] `STRIPE_WEBHOOK_SECRET` ist in Supabase konfiguriert
- [ ] Webhook Endpoint ist in Stripe eingerichtet
- [ ] Browser Console ist offen (F12)
- [ ] Supabase Edge Function Logs sind offen

### Test-Ablauf:
1. ✅ Gehe zu `/cv-check` und lade ein CV hoch
2. ✅ Warte auf Analyse-Ergebnis
3. ✅ Klicke auf "Jetzt freischalten" → Sollte zu `/cv-paywall` redirecten
4. ✅ Prüfe, ob cvId in der URL ist: `/cv-paywall?cvId=xxx`
5. ✅ Wähle ein Paket (z.B. "1 Optimierung" für 5€)
6. ✅ Prüfe Browser Console auf Errors
7. ✅ Sollte zu Stripe Checkout redirecten
8. ✅ Nutze Test-Kreditkarte: `4242 4242 4242 4242`
9. ✅ Bestätige Zahlung
10. ✅ Sollte zurück zu `/cv-paywall?cvId=xxx&payment=success` redirecten
11. ✅ Sollte automatisch zu `/cv-wizard` oder `/cv-live-editor` weiterleiten

### Was prüfen bei Fehlern:
```javascript
// In Browser Console:

// 1. Prüfe Session
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

// 2. Prüfe CV Payment Status
const { data: cvRecord } = await supabase
  .from('cv_records')
  .select('*')
  .eq('id', 'deine-cv-id')
  .single();
console.log('CV Record:', cvRecord);

// 3. Prüfe User Tokens
const { data: { user } } = await supabase.auth.getUser();
const { data: tokens } = await supabase
  .from('user_tokens')
  .select('*')
  .eq('user_id', user.id)
  .single();
console.log('Tokens:', tokens);
```

---

## 🚨 Kritische Fehler & Schnelle Fixes

### Error: "relation user_tokens does not exist"
**Status:** ✅ BEHOBEN - Tabelle wurde erstellt

### Error: "relation cv_records does not exist"
**Status:** ✅ BEHOBEN - Tabelle wurde erstellt

### Error: "Failed to fetch customer information"
**Status:** ⚠️ Kann auftreten wenn stripe_customers Eintrag fehlt
**Fix:** Edge Function erstellt automatisch einen Customer beim ersten Checkout

### Error: "Webhook signature verification failed"
**Status:** ⚠️ STRIPE_WEBHOOK_SECRET fehlt oder ist falsch
**Fix:** Korrekten Signing Secret aus Stripe Dashboard kopieren

---

## 📞 Support & Logs

### Supabase Logs ansehen:
```bash
# Edge Function Logs
https://supabase.com/dashboard/project/vuumqarzylewhzvtbtcl/functions/stripe-checkout
https://supabase.com/dashboard/project/vuumqarzylewhzvtbtcl/functions/stripe-webhook

# Database Logs
https://supabase.com/dashboard/project/vuumqarzylewhzvtbtcl/logs/postgres-logs
```

### Stripe Logs ansehen:
```bash
# Webhook Events
https://dashboard.stripe.com/test/events

# Payments
https://dashboard.stripe.com/test/payments

# Customers
https://dashboard.stripe.com/test/customers
```

---

## ✅ Wenn alles funktioniert:

Nach erfolgreicher Zahlung solltest du sehen:
1. ✅ Stripe zeigt "Payment successful"
2. ✅ Redirect zurück zur App
3. ✅ `is_paid=true` in cv_records/stored_cvs
4. ✅ Credits wurden zu user_tokens hinzugefügt
5. ✅ CV ist im Editor freigeschaltet
6. ✅ Download-Buttons sind sichtbar
