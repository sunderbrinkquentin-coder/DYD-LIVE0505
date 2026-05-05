# CV-Check Paywall Integration

## Übersicht

Nach dem CV-Check wird beim Klick auf "Im Dashboard speichern" eine Paywall angezeigt, wenn der User keine Token hat. Der User kann für 5 EUR einen Token kaufen, um die Analyse im Dashboard zu speichern.

## Stripe Price ID

**Price ID**: `price_1SZc133Sd9dZl64SYr82cZcX`
- **Preis**: 5,00 EUR
- **Token**: 1 Token pro Kauf
- **Modus**: Payment (Einmalzahlung)

## Implementierung

### 1. Paywall Modal (AtsResultDisplay.tsx)

- Prüft beim Klick auf "Im Dashboard speichern", ob User Token hat
- Zeigt Paywall-Modal an, wenn keine Token vorhanden
- Leitet zu Stripe Checkout weiter
- Nach erfolgreichem Kauf wird User zurück zur Result-Page geleitet

### 2. Stripe Checkout Edge Function

**URL**: `/functions/v1/stripe-checkout`

Erstellt eine Stripe Checkout Session mit:
- Price ID: `price_1SZc133Sd9dZl64SYr82cZcX`
- Success URL: `/cv-result/{uploadId}?payment=success`
- Cancel URL: `/cv-result/{uploadId}?payment=canceled`

### 3. Stripe Webhook Edge Function

**URL**: `/functions/v1/stripe-webhook`

Verarbeitet `checkout.session.completed` Events:
1. Findet User anhand der Stripe Customer ID
2. Fügt 1 Token zum User-Konto hinzu
3. Speichert Bestellung in `stripe_orders` Tabelle

### 4. Token Management

**Service**: `tokenService.ts`

Funktionen:
- `getUserTokens(userId)` - Holt Token-Balance
- `hasTokens(userId)` - Prüft ob Token vorhanden
- `consumeToken(userId)` - Verbraucht 1 Token
- `addTokens(userId, amount)` - Fügt Token hinzu

## Webhook-Konfiguration

In Stripe Dashboard muss ein Webhook eingerichtet werden:

**Webhook URL**: `https://vuumqarzylewhzvtbtcl.supabase.co/functions/v1/stripe-webhook`

**Events**:
- `checkout.session.completed`

**Wichtig**: Der Webhook Secret muss als `STRIPE_WEBHOOK_SECRET` in Supabase konfiguriert werden.

## Ablauf

1. User führt CV-Check durch
2. Ergebnis wird angezeigt
3. User klickt auf "Im Dashboard speichern"
4. System prüft Token-Balance
5. Keine Token → Paywall wird angezeigt
6. User klickt auf "Jetzt kaufen"
7. Weiterleitung zu Stripe Checkout
8. Nach Zahlung → Webhook fügt Token hinzu
9. User wird zurück zur Result-Page geleitet
10. Erfolgs-Benachrichtigung wird angezeigt
11. User kann nun Analyse im Dashboard speichern

## Datenbank-Tabellen

### user_tokens
- `user_id` (UUID) - Referenz zu auth.users
- `credits` (INTEGER) - Anzahl verfügbarer Token
- `created_at` / `updated_at` (TIMESTAMP)

### stripe_customers
- `user_id` (UUID) - Referenz zu auth.users
- `customer_id` (TEXT) - Stripe Customer ID

### stripe_orders
- `checkout_session_id` (TEXT)
- `payment_intent_id` (TEXT)
- `customer_id` (TEXT)
- `amount_total` (BIGINT)
- `status` (ENUM: pending, completed, canceled)

## Umgebungsvariablen

**.env**:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Supabase Secrets** (automatisch konfiguriert):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
