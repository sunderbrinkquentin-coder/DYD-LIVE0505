// supabase/functions/academy-certificate/index.ts
//
// Stellt das Zertifikat eines Lernpfads aus – als prüfbaren Datensatz in
// academy_certificates. Das PDF rendert weiterhin der Browser, aber alle
// Angaben (Name, Skill, Ergebnis, Datum) kommen von hier und sind über die
// öffentliche Prüfseite (QR-Code) gegen den Datensatz prüfbar.
//
// POST { action: "issue", learning_path_id, recipient_name? }   (Nutzer-Token)
// Antwort: { success, certificate: {...} } oder { error, code: "MISSING_NAME" | "NOT_PASSED" }
//
// Secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PASSING_SCORE = 80;
/** Richtwert je Lerneinheit, wenn keine Angabe vorliegt */

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function parseLoose(raw: unknown): any {
  if (raw == null) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw !== "string") return null;
  let s = raw.trim();
  if (!s) return null;
  for (let i = 0; i < 3; i++) {
    try {
      const parsed = JSON.parse(s);
      if (typeof parsed === "string") { s = parsed.trim(); continue; }
      return parsed;
    } catch {
      if (!s.startsWith("[")) { try { return JSON.parse(`[${s}]`); } catch { return null; } }
      return null;
    }
  }
  return null;
}

function cleanName(raw: unknown): string {
  return String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
}

/** Unit-Titel aus allen learning_results-Zeilen (eine Zeile mit Array oder fünf Zeilen) */
function unitTitles(rows: any[]): Map<number, string> {
  const titles = new Map<number, string>();
  let positional = 0;
  for (const row of rows) {
    const parsed = parseLoose(row?.content);
    const units = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
    const col = Number(row?.unit_id);
    for (const u of units) {
      const f = Number(u?.unit_id);
      const id = Number.isFinite(col) && col > 0 ? col : Number.isFinite(f) && f > 0 ? f : ++positional;
      const t = String(u?.mobile_title || u?.title || "").trim();
      if (t && !titles.has(id)) titles.set(id, t);
    }
  }
  return titles;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "Bitte melde dich an." }, 401);

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Ungültige Anfrage" }, 400); }
  if (body?.action !== "issue") return json({ error: "Unbekannte Aktion" }, 400);

  const pathId = String(body.learning_path_id ?? "");
  const { data: path } = await db.from("learning_paths")
    .select("id, user_id, skill, target_job, created_at, final_exam_score, final_exam_completed_at, certificate_id, curriculum")
    .eq("id", pathId).maybeSingle();
  if (!path || path.user_id !== user.id) return json({ error: "Lernpfad nicht gefunden." }, 404);

  // ── 1. Bestanden? Maßgeblich ist der serverseitige Versuch ─────────────────
  const { data: passedAttempt } = await db.from("academy_exam_attempts")
    .select("score, total, created_at")
    .eq("learning_path_id", path.id).eq("passed", true)
    .order("score", { ascending: false }).limit(1).maybeSingle();

  // Vor der Umstellung bestandene Prüfungen bleiben gültig
  const legacyScore = typeof path.final_exam_score === "number" ? path.final_exam_score : null;
  const score = passedAttempt?.score ?? (legacyScore != null && legacyScore >= PASSING_SCORE ? legacyScore : null);
  if (score == null) {
    return json({ error: "Die Abschlussprüfung ist noch nicht bestanden.", code: "NOT_PASSED" }, 409);
  }
  const passedAt: string = passedAttempt?.created_at ?? path.final_exam_completed_at ?? new Date().toISOString();

  // ── 2. Name ────────────────────────────────────────────────────────────────
  const { data: existingCert } = await db.from("academy_certificates")
    .select("*").eq("learning_path_id", path.id).maybeSingle();

  const typedName = cleanName(body.recipient_name);
  let name = typedName;
  if (!name) {
    const { data: profile } = await db.from("profiles").select("full_name").eq("user_id", user.id).limit(1).maybeSingle();
    name = cleanName(profile?.full_name) || cleanName(existingCert?.recipient_name) || cleanName(user.user_metadata?.full_name);
  }
  // Selbst eingegebene Namen werden übernommen; automatisch gefundene nur,
  // wenn sie nach Vor- und Nachname aussehen (kein E-Mail-Kürzel o. Ä.)
  if (typedName ? typedName.length < 2 : (name.length < 3 || !name.includes(" "))) {
    return json({ error: "Bitte gib deinen Vor- und Nachnamen an.", code: "MISSING_NAME", suggestion: name }, 400);
  }

  // Name fürs nächste Mal im Profil speichern
  if (typedName) {
    const { data: prof } = await db.from("profiles").select("id").eq("user_id", user.id).limit(1).maybeSingle();
    if (prof?.id) await db.from("profiles").update({ full_name: name, updated_at: new Date().toISOString() }).eq("id", prof.id);
  }

  // ── 3. Inhalte: Skill, Lerneinheiten, Umfang ──────────────────────────────
  const [{ data: resultRows }, { data: completions }] = await Promise.all([
    db.from("learning_results").select("content, unit_id, certificate_metadata, selected_skill").eq("learning_path_id", path.id),
    db.from("unit_completions").select("unit_index").eq("learning_path_id", path.id).order("unit_index"),
  ]);
  const rows = resultRows ?? [];
  const meta = parseLoose(rows.find((r: any) => r.certificate_metadata != null)?.certificate_metadata) ?? {};
  const skill = String(path.skill || rows.find((r: any) => r.selected_skill)?.selected_skill || meta?.skill || path.target_job || "Lernpfad").trim();

  const titles = unitTitles(rows);
  const doneUnits: number[] = [...new Set<number>((completions ?? []).map((c: any) => Number(c.unit_index)))].sort((a, b) => a - b);
  const unitList = (doneUnits.length ? doneUnits : [...titles.keys()].sort((a, b) => a - b))
    .map((i) => titles.get(i) || `Lerneinheit ${i}`)
    .slice(0, 8);

  // ── 4. Datensatz anlegen / aktualisieren ──────────────────────────────────
  const year = new Date(passedAt).getFullYear();
  const certId: string = existingCert?.id || path.certificate_id || `DYD-${year}-${String(path.id).replace(/-/g, "").slice(0, 8).toUpperCase()}`;

  const record = {
    id: certId,
    learning_path_id: path.id,
    user_id: user.id,
    recipient_name: name,
    skill,
    score,
    question_count: passedAttempt?.total ?? existingCert?.question_count ?? null,
    passed_at: existingCert?.passed_at ?? passedAt,
    issued_at: existingCert?.issued_at ?? new Date().toISOString(),
    unit_titles: unitList,
    // Kein Stundenumfang: Das Zertifikat nennt nur das Abschlussdatum
    total_hours: null,
    hours_estimated: false,
  };

  const { error: upsertError } = await db.from("academy_certificates").upsert(record, { onConflict: "learning_path_id" });
  if (upsertError) {
    console.error("[academy-certificate] upsert:", upsertError.message);
    return json({ error: "Das Zertifikat konnte nicht gespeichert werden." }, 500);
  }

  await db.from("learning_paths").update({
    certificate_id: certId,
    certificate_issued_at: record.issued_at,
    final_exam_status: "done",
    updated_at: new Date().toISOString(),
  }).eq("id", path.id);

  return json({
    success: true,
    certificate: {
      ...record,
      period_start: path.created_at,
      period_end: record.passed_at,
      dqr_reference: meta?.dqr_reference ?? null,
    },
  });
});