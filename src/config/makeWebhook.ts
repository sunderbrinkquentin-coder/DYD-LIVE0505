// src/config/makeWebhook.ts

const PLACEHOLDER_PATTERNS = ["placeholder", "your-webhook", "example.com", "localhost"];

function isPlaceholderUrl(url: string): boolean {
  return PLACEHOLDER_PATTERNS.some((p) => url.toLowerCase().includes(p));
}

function maskWebhookUrlInternal(url: string): string {
  if (!url) return "[no-url]";
  try {
    const parts = url.split("/");
    if (parts.length >= 2) {
      const hash = parts[parts.length - 1];
      return `https://hook.eu2.make.com/${hash.substring(0, 8)}...${hash.slice(-8)}`;
    }
    return url.substring(0, 30) + "...";
  } catch {
    return "[masked-url]";
  }
}

function getWebhookUrl(envKey: string, name: string): string {
  const url = import.meta.env[envKey];

  if (!url || url.trim() === "") {
    console.error(
      `[${name}] FATAL: ${envKey} is missing or empty. ` +
        `CV processing will not work until this is configured.`
    );
    throw new Error(
      `Make.com Webhook nicht konfiguriert: ${envKey} fehlt. ` +
        `Bitte setze ${envKey} in der .env-Datei.`
    );
  }

  if (isPlaceholderUrl(url)) {
    console.error(
      `[${name}] FATAL: ${envKey} contains a placeholder URL: ${maskWebhookUrlInternal(url)}`
    );
    throw new Error(
      `Make.com Webhook ist ein Platzhalter (${envKey}). ` +
        `Bitte ersetze den Platzhalter durch die echte Webhook-URL.`
    );
  }

  if (!url.startsWith("https://hook.")) {
    console.warn(
      `[${name}] WARNING: ${envKey} does not look like a valid Make.com URL: ${maskWebhookUrlInternal(url)}`
    );
  }

  return url;
}

function getSafeWebhookUrl(envKey: string): string | null {
  try {
    const url = import.meta.env[envKey];
    if (!url || url.trim() === "") {
      return null;
    }
    if (isPlaceholderUrl(url)) {
      console.warn(`[WEBHOOK] ${envKey} contains placeholder - ignoring`);
      return null;
    }
    return url;
  } catch (error) {
    console.warn(`[WEBHOOK] Error reading ${envKey}:`, error);
    return null;
  }
}

let cvCheckUrl: string | null = null;
export function getMakeWebhookUrl(): string {
  if (!cvCheckUrl) {
    cvCheckUrl = getWebhookUrl("VITE_MAKE_WEBHOOK_CVCHECK", "CV-CHECK");
  }
  return cvCheckUrl;
}

let cvGeneratorUrl: string | null = null;
export function getMakeGeneratorWebhookUrl(): string {
  if (!cvGeneratorUrl) {
    cvGeneratorUrl = getWebhookUrl("VITE_MAKE_WEBHOOK_CVGENERATOR", "CV-GENERATOR");
  }
  return cvGeneratorUrl;
}

let skillGapUrl: string | null = null;
export function getMakeSkillGapWebhookUrl(): string {
  if (!skillGapUrl) {
    skillGapUrl = getWebhookUrl("VITE_MAKE_WEBHOOK_SKILLGAP", "SKILL-GAP");
  }
  return skillGapUrl;
}

export function getSkillGapWebhookUrlSafe(): string | null {
  return getSafeWebhookUrl("VITE_MAKE_WEBHOOK_SKILLGAP");
}

export function isMakeWebhookConfigured(): boolean {
  try {
    getMakeWebhookUrl();
    return true;
  } catch {
    return false;
  }
}

export function assertMakeWebhookConfigured(): void {
  if (!isMakeWebhookConfigured()) {
    throw new Error(
      "Make.com Webhooks sind nicht konfiguriert. " +
        "Bitte setze VITE_MAKE_WEBHOOK_CVCHECK in der .env-Datei."
    );
  }
}

export interface WebhookValidation {
  ok: boolean;
  message: string;
}

export function validateMakeWebhookUrl(): WebhookValidation {
  try {
    const url = getMakeWebhookUrl();
    console.log(
      "[CV-CHECK] Webhook konfiguriert:",
      maskWebhookUrlInternal(url)
    );
    return {
      ok: true,
      message: `CV-Check Webhook OK: ${maskWebhookUrlInternal(url)}`,
    };
  } catch (error: any) {
    console.error("[CV-CHECK] Webhook-Validierung fehlgeschlagen:", error.message);
    const fallback = getSafeWebhookUrl("VITE_MAKE_WEBHOOK_CVCHECK");
    if (fallback) {
      console.warn("[CV-CHECK] Fallback-URL gefunden, aber Fehler aufgetreten");
    }
    return {
      ok: false,
      message: error.message,
    };
  }
}

export function validateMakeGeneratorWebhookUrl(): WebhookValidation {
  try {
    const url = getMakeGeneratorWebhookUrl();
    console.log(
      "[CV-GENERATOR] Webhook konfiguriert:",
      maskWebhookUrlInternal(url)
    );
    return {
      ok: true,
      message: `CV-Generator Webhook OK: ${maskWebhookUrlInternal(url)}`,
    };
  } catch (error: any) {
    console.error("[CV-GENERATOR] Webhook-Validierung fehlgeschlagen:", error.message);
    return {
      ok: false,
      message: error.message,
    };
  }
}

export function maskWebhookUrl(url: string): string {
  return maskWebhookUrlInternal(url);
}

export function getSafeWebhookUrlForService(): string | null {
  return getSafeWebhookUrl("VITE_MAKE_WEBHOOK_CVCHECK");
}

export function logWebhookConfigStatus(): void {
  const cvCheckRaw = import.meta.env.VITE_MAKE_WEBHOOK_CVCHECK;
  const cvGenRaw = import.meta.env.VITE_MAKE_WEBHOOK_CVGENERATOR;

  console.group("[WEBHOOK CONFIG] Startup check");
  if (!cvCheckRaw) {
    console.error("  VITE_MAKE_WEBHOOK_CVCHECK: MISSING");
  } else if (isPlaceholderUrl(cvCheckRaw)) {
    console.error("  VITE_MAKE_WEBHOOK_CVCHECK: PLACEHOLDER DETECTED");
  } else {
    console.log("  VITE_MAKE_WEBHOOK_CVCHECK:", maskWebhookUrlInternal(cvCheckRaw));
  }

  if (!cvGenRaw) {
    console.warn("  VITE_MAKE_WEBHOOK_CVGENERATOR: MISSING");
  } else if (isPlaceholderUrl(cvGenRaw)) {
    console.warn("  VITE_MAKE_WEBHOOK_CVGENERATOR: PLACEHOLDER DETECTED");
  } else {
    console.log("  VITE_MAKE_WEBHOOK_CVGENERATOR:", maskWebhookUrlInternal(cvGenRaw));
  }
  console.groupEnd();
}
