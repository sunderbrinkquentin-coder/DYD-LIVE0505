// src/services/academyCatalogService.ts
//
// Lernpfad-Katalog der Career Academy.
// Sobald jemand einen personalisierten Lernpfad zu einem Skill kauft, legt der
// Stripe-Webhook einmalig eine neutrale Version (ohne Lebenslauf, Firma,
// Vision) an. Diese ist danach für alle sofort und 20 % günstiger erhältlich.

import { supabase } from '../lib/supabase';

/** Stripe-Preis für Katalog-Lernpfade (3,99 €). Ohne Preis werden keine Angebote gezeigt. */
export const CATALOG_PRICE_ID: string = (import.meta.env.VITE_STRIPE_PRICE_LEARNING_PATH_CATALOG as string | undefined) || '';
export const CATALOG_PRICE_LABEL = '3,99 €';
export const REGULAR_PRICE_LABEL = '5 €';
export const CATALOG_DISCOUNT_LABEL = '−20 %';
/** Gleiche Zielgruppe wie die Vorlage im Stripe-Webhook */
const CATALOG_TARGET_JOB = 'Berufstätige aller Branchen';

const STRIPE_CHECKOUT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;

export interface CatalogEntry {
  id: string;
  skill_key: string;
  skill: string;
  description: string | null;
  unit_count: number;
  purchases: number;
  ready_at: string | null;
}

export function isCatalogEnabled(): boolean {
  return !!CATALOG_PRICE_ID;
}

/** Gleiche Normalisierung wie public.academy_skill_key() in der Datenbank. */
export function skillKey(skill: string): string {
  return skill.trim().replace(/\s+/g, ' ').replace(/[.,;:!?]+$/, '').toLowerCase();
}

export const academyCatalogService = {
  /** Beliebteste fertige Katalog-Pfade */
  async list(limit = 6): Promise<CatalogEntry[]> {
    if (!isCatalogEnabled()) return [];
    const { data, error } = await supabase
      .from('academy_catalog')
      .select('id, skill_key, skill, description, unit_count, purchases, ready_at')
      .eq('status', 'ready')
      .order('purchases', { ascending: false })
      .order('ready_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.warn('[Catalog] list:', error.message);
      return [];
    }
    return (data as CatalogEntry[]) ?? [];
  },

  /** Katalog-Pfade zu bestimmten Skills (z. B. aus einer Gap-Analyse) */
  async findForSkills(skills: string[]): Promise<Map<string, CatalogEntry>> {
    const map = new Map<string, CatalogEntry>();
    if (!isCatalogEnabled()) return map;
    const keys = [...new Set(skills.map(skillKey).filter(Boolean))];
    if (!keys.length) return map;
    const { data } = await supabase
      .from('academy_catalog')
      .select('id, skill_key, skill, description, unit_count, purchases, ready_at')
      .eq('status', 'ready')
      .in('skill_key', keys);
    for (const entry of (data as CatalogEntry[]) ?? []) map.set(entry.skill_key, entry);
    return map;
  },

  /**
   * Startet den Kauf eines Katalog-Pfads. Legt (falls nötig) die eigene,
   * noch nicht bezahlte Lernpfad-Zeile an und leitet zu Stripe weiter.
   * Ist der Pfad schon gekauft, wird stattdessen seine id zurückgegeben.
   */
  async startCheckout(entry: CatalogEntry, cancelPath: string): Promise<{ redirected: true } | { ownedPathId: string } | { needsLogin: true }> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!session || !user) return { needsLogin: true };

    const { data: own } = await supabase
      .from('learning_paths')
      .select('id, is_paid')
      .eq('user_id', user.id)
      .eq('catalog_id', entry.id)
      .order('created_at', { ascending: false })
      .limit(5);
    const paid = (own ?? []).find((p: any) => p.is_paid);
    if (paid) return { ownedPathId: paid.id };

    let pathId: string | undefined = (own ?? [])[0]?.id;
    if (!pathId) {
      const { data: created, error } = await supabase
        .from('learning_paths')
        .insert({
          user_id: user.id,
          skill: entry.skill,
          catalog_id: entry.id,
          target_job: CATALOG_TARGET_JOB,
          missing_skills: [entry.skill],
          current_skills: [],
          status: 'gap_analysis_complete',
          is_paid: false,
          progress: {},
        })
        .select('id')
        .single();
      if (error || !created?.id) throw new Error('Der Lernpfad konnte nicht vorbereitet werden. Bitte versuche es erneut.');
      pathId = created.id;
    }

    const origin = window.location.origin;
    const resp = await fetch(STRIPE_CHECKOUT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        price_id: CATALOG_PRICE_ID,
        success_url: `${origin}/#/learning-path-waiting/${pathId}?session_id={CHECKOUT_SESSION_ID}&catalog=1`,
        cancel_url: `${origin}/#${cancelPath}`,
        metadata: {
          learning_path_id: pathId,
          catalog_id: entry.id,
          source: 'learning_path_catalog',
          selected_skill: entry.skill,
        },
      }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.url) throw new Error(data.error || 'Der Checkout konnte nicht gestartet werden.');
    window.location.href = data.url;
    return { redirected: true };
  },
};

export default academyCatalogService;
