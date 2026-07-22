import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Download, Loader2, Lock, Play, ShieldCheck, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { careerService } from '../../services/careerVisionService';
import { certificateService } from '../../services/certificateService';
import { LearningPath } from '../../types/learningPath';

/**
 * "Deine Zertifikate" — Dashboard-Sektion.
 *
 * Vier Zustände pro Skill-Pfad, jeder mit genau EINER nächsten Handlung:
 *   issued    → herunterladen / teilen
 *   ready     → Prüfung bestanden, Zertifikat noch nicht erstellt  → erstellen
 *   exam      → alle Einheiten fertig, Prüfung offen               → Prüfung starten
 *   learning  → mitten im Lernpfad                                 → weiterlernen
 *
 * Die Sektion ist bewusst auch dann sichtbar, wenn noch nichts erreicht wurde:
 * das leere Regal ist der stärkste Grund, den ersten Skill freizuschalten.
 */

const UNITS_PER_PATH = 5;

type CertState = 'issued' | 'ready' | 'exam' | 'learning';

interface CertRow {
  path: LearningPath & Record<string, any>;
  skill: string;
  state: CertState;
  unitsDone: number;
}

interface Props {
  userId: string;
  /** Anzahl noch nicht freigeschalteter Skills — für den Upsell-Streifen */
  lockedSkillCount?: number;
  onOpenPath?: (pathId: string) => void;
  onUnlockMore?: () => void;
}

function stateOf(path: any, unitsDone: number): CertState {
  if (path.certificate_url) return 'issued';
  if (typeof path.final_exam_score === 'number' && path.final_exam_score >= 80) return 'ready';
  if (unitsDone >= UNITS_PER_PATH) return 'exam';
  return 'learning';
}

export function MyCertificatesSection({
  userId,
  lockedSkillCount = 0,
  onOpenPath,
  onUnlockMore,
}: Props) {
  const [rows, setRows] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const paths = await careerService.getCertificateOverview(userId);

      const { data: completions } = await supabase
        .from('unit_completions')
        .select('learning_path_id, unit_index')
        .in('learning_path_id', paths.map((p) => p.id));

      const doneByPath = new Map<string, Set<number>>();
      (completions ?? []).forEach((c: any) => {
        const set = doneByPath.get(c.learning_path_id) ?? new Set<number>();
        set.add(c.unit_index);
        doneByPath.set(c.learning_path_id, set);
      });

      setRows(
        paths.map((p: any) => {
          const unitsDone = doneByPath.get(p.id)?.size ?? 0;
          return {
            path: p,
            skill: p.skill ?? 'Lernpfad',
            unitsDone,
            state: stateOf(p, unitsDone),
          };
        })
      );
    } catch (e: any) {
      setError(e?.message ?? 'Zertifikate konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const issued = useMemo(() => rows.filter((r) => r.state === 'issued'), [rows]);
  const ready = useMemo(() => rows.filter((r) => r.state === 'ready'), [rows]);

  const handleIssue = async (row: CertRow) => {
    setBusyId(row.path.id);
    setError(null);
    try {
      await careerService.generateCertificate(row.path.id);
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Das Zertifikat konnte nicht erstellt werden.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDownload = async (row: CertRow) => {
    setBusyId(row.path.id);
    try {
      await certificateService.downloadCertificate(
        row.path.certificate_url as string,
        `Zertifikat_${row.skill.replace(/\s+/g, '_')}.pdf`
      );
    } finally {
      setBusyId(null);
    }
  };

  const shareOnLinkedIn = (row: CertRow) => {
    const params = new URLSearchParams({
      name: `${row.skill} — DYD Career Academy`,
      organizationName: 'DYD — Decide Your Dream',
      issueYear: String(new Date(row.path.certificate_issued_at ?? Date.now()).getFullYear()),
      issueMonth: String(new Date(row.path.certificate_issued_at ?? Date.now()).getMonth() + 1),
      certId: row.path.certificate_id ?? '',
      certUrl: row.path.certificate_url ?? '',
    });
    window.open(
      `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&${params}`,
      '_blank',
      'noopener'
    );
  };

  return (
    <section className="mt-10">
      {/* Kopf */}
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="font-poppins text-xl font-semibold text-[#0A192F] flex items-center gap-2">
            <Award className="h-5 w-5 text-[#38BDF8]" />
            Deine Zertifikate
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {issued.length > 0
              ? `${issued.length} ${issued.length === 1 ? 'Zertifikat' : 'Zertifikate'} erhalten${
                  ready.length > 0 ? ` · ${ready.length} wartet auf dich` : ''
                }`
              : 'Schließe einen Lernpfad ab und halte dein erstes Zertifikat in der Hand.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState onUnlockMore={onUnlockMore} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Fertige Zertifikate zuerst — Erfolg nach oben */}
          {[...rows].sort((a, b) => order(a.state) - order(b.state)).map((row) => (
            <CertificateCard
              key={row.path.id}
              row={row}
              busy={busyId === row.path.id}
              onIssue={() => handleIssue(row)}
              onDownload={() => handleDownload(row)}
              onShare={() => shareOnLinkedIn(row)}
              onOpen={() => onOpenPath?.(row.path.id)}
            />
          ))}
        </div>
      )}

      {/* Upsell-Streifen */}
      {lockedSkillCount > 0 && (
        <button
          onClick={onUnlockMore}
          className="mt-4 flex w-full items-center justify-between gap-4 rounded-2xl border border-[#DEFF9A] bg-[#F7FCE9] px-5 py-4 text-left transition hover:border-[#38BDF8]"
        >
          <span className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 shrink-0 text-[#0A192F]" />
            <span>
              <span className="block font-medium text-[#0A192F]">
                Noch {lockedSkillCount} {lockedSkillCount === 1 ? 'Skill' : 'Skills'} aus deiner
                Analyse
              </span>
              <span className="block text-sm text-slate-600">
                Jeder abgeschlossene Skill ergibt ein eigenes Zertifikat.
              </span>
            </span>
          </span>
          <span className="shrink-0 rounded-lg bg-[#0A192F] px-4 py-2 text-sm font-medium text-white">
            Ansehen
          </span>
        </button>
      )}
    </section>
  );
}

function order(state: CertState): number {
  return { issued: 0, ready: 1, exam: 2, learning: 3 }[state];
}

function CertificateCard({
  row, busy, onIssue, onDownload, onShare, onOpen,
}: {
  row: CertRow;
  busy: boolean;
  onIssue: () => void;
  onDownload: () => void;
  onShare: () => void;
  onOpen: () => void;
}) {
  const { state, skill, unitsDone, path } = row;
  const issuedAt = path.certificate_issued_at
    ? new Date(path.certificate_issued_at).toLocaleDateString('de-DE')
    : null;

  return (
    <article
      className={`rounded-2xl border p-5 transition ${
        state === 'issued'
          ? 'border-[#38BDF8] bg-white shadow-sm'
          : state === 'ready'
          ? 'border-[#DEFF9A] bg-[#FCFFF4]'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-poppins font-semibold leading-snug text-[#0A192F]">{skill}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {state === 'issued' && issuedAt && `Ausgestellt am ${issuedAt}`}
            {state === 'issued' && path.certificate_id && ` · Nr. ${path.certificate_id}`}
            {state === 'ready' && 'Prüfung bestanden'}
            {state === 'exam' && 'Alle Lerneinheiten abgeschlossen'}
            {state === 'learning' && `${unitsDone} von ${UNITS_PER_PATH} Lerneinheiten`}
          </p>
        </div>
        {state === 'issued' ? (
          <ShieldCheck className="h-5 w-5 shrink-0 text-[#38BDF8]" />
        ) : state === 'learning' ? (
          <Lock className="h-4 w-4 shrink-0 text-slate-300" />
        ) : null}
      </div>

      {state === 'learning' && (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#38BDF8] transition-all"
            style={{ width: `${Math.round((unitsDone / UNITS_PER_PATH) * 100)}%` }}
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {state === 'issued' && (
          <>
            <button
              onClick={onDownload}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0A192F] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#132a4d] disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              PDF herunterladen
            </button>
            <button
              onClick={onShare}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-[#0A192F] transition hover:border-[#38BDF8]"
            >
              Zu LinkedIn hinzufügen
            </button>
          </>
        )}

        {state === 'ready' && (
          <button
            onClick={onIssue}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0A192F] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#132a4d] disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
            Zertifikat erstellen
          </button>
        )}

        {state === 'exam' && (
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0A192F] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#132a4d]"
          >
            <Play className="h-4 w-4" />
            Abschlussprüfung starten
          </button>
        )}

        {state === 'learning' && (
          <button
            onClick={onOpen}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-[#0A192F] transition hover:border-[#38BDF8]"
          >
            Weiterlernen
          </button>
        )}
      </div>
    </article>
  );
}

function EmptyState({ onUnlockMore }: { onUnlockMore?: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
      <Award className="mx-auto h-8 w-8 text-slate-300" />
      <h3 className="mt-3 font-poppins font-semibold text-[#0A192F]">
        Hier steht bald dein erstes Zertifikat
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        Schalte einen Skill aus deiner Analyse frei, arbeite die fünf Lerneinheiten durch und
        bestehe die Abschlussprüfung — das Zertifikat kannst du danach jederzeit hier herunterladen.
      </p>
      <button
        onClick={onUnlockMore}
        className="mt-5 rounded-lg bg-[#0A192F] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#132a4d]"
      >
        Skill freischalten
      </button>
    </div>
  );
}

export default MyCertificatesSection;