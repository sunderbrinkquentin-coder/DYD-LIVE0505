import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { useSearchParams } from 'react-router-dom';
import { Archive, ChevronDown, Plus, Search, Sparkles, X } from 'lucide-react';
import type {
  ApplicationEvent, ApplicationStatus, ApplicationUpdate, TrackedApplication,
} from '../../../types/applications';
import { ARCHIVE_STATUSES, BOARD_STATUSES } from '../../../types/applications';
import { applicationService } from '../../../services/applicationService';
import { ApplicationCard, CoverLetterState } from './ApplicationCard';
import { coverLetterService } from '../../../services/coverLetterService';
import { COVER_LETTER_PRICE, formatEuro } from '../../../types/coverLetter';
import { ApplicationColumn } from './ApplicationColumn';
import { ApplicationDrawer, Tab as DrawerTab } from './ApplicationDrawer';
import { ApplicationInsights } from './ApplicationInsights';
import { AddApplicationModal } from './AddApplicationModal';
import { StatusCelebrationModal } from '../StatusCelebrationModal';

interface ApplicationBoardProps {
  /** CV, der gerade neu erstellt wurde → zugehörige Bewerbung hervorheben */
  highlightedCvId?: string | null;
}

type Celebration = { status: 'interview' | 'offer' | 'rejected'; jobTitle?: string; company?: string };

const CELEBRATE: Partial<Record<ApplicationStatus, Celebration['status']>> = {
  interview: 'interview',
  offer: 'offer',
  accepted: 'offer',
  rejected: 'rejected',
};

export function ApplicationBoard({ highlightedCvId }: ApplicationBoardProps) {
  const [apps, setApps] = useState<TrackedApplication[]>([]);
  const [interviews, setInterviews] = useState<ApplicationEvent[]>([]);
  const [firstResponses, setFirstResponses] = useState<{ application_id: string; occurred_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [showArchive, setShowArchive] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openTab, setOpenTab] = useState<DrawerTab>('details');
  const [awaitingLetterPayment, setAwaitingLetterPayment] = useState(false);
  const [letterStates, setLetterStates] = useState<Record<string, CoverLetterState>>({});
  const [searchParams, setSearchParams] = useSearchParams();
  const [addStatus, setAddStatus] = useState<ApplicationStatus | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const lastDragEnd = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );

  const load = useCallback(async () => {
    try {
      const [a, i, r] = await Promise.all([
        applicationService.list(),
        applicationService.listUpcomingInterviews(),
        applicationService.listFirstResponses(),
      ]);
      setApps(a);
      setInterviews(i);
      setFirstResponses(r);
      setError('');
      coverLetterService
        .listStatus()
        .then((rows) => {
          const map: Record<string, CoverLetterState> = {};
          for (const row of rows) {
            if (row.is_unlocked) map[row.application_id] = 'unlocked';
            else if (!map[row.application_id]) map[row.application_id] = 'draft';
          }
          setLetterStates(map);
        })
        .catch(() => {});
    } catch (e) {
      console.error('[ApplicationBoard] load', e);
      setError('Bewerbungen konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Rückkehr aus dem Stripe-Checkout (Anschreiben) → Drawer direkt auf dem Anschreiben öffnen
  useEffect(() => {
    const appId = searchParams.get('application');
    if (!searchParams.get('cover_letter') || !appId) return;
    setOpenTab('letter');
    setOpenId(appId);
    setAwaitingLetterPayment(searchParams.get('paid') === '1');
    const next = new URLSearchParams(searchParams);
    ['cover_letter', 'application', 'paid'].forEach((k) => next.delete(k));
    setSearchParams(next, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Einstieg "Anschreiben erstellen" (Landingpage, Dashboard-Header, Menü): ?anschreiben=1
  // → passende Bewerbung ohne Anschreiben öffnen, sonst neue Bewerbung anlegen
  const [letterAfterCreate, setLetterAfterCreate] = useState(false);
  useEffect(() => {
    if (loading || searchParams.get('anschreiben') !== '1') return;
    const next = new URLSearchParams(searchParams);
    next.delete('anschreiben');
    setSearchParams(next, { replace: true });
    document.getElementById('kanban-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const order: ApplicationStatus[] = ['preparing', 'saved', 'applied'];
    const candidate = order
      .flatMap((s) => apps.filter((a) => a.status === s))
      .find((a) => letterStates[a.id] !== 'unlocked');
    if (candidate) {
      setOpenTab('letter');
      setAwaitingLetterPayment(false);
      setOpenId(candidate.id);
    } else {
      setLetterAfterCreate(true);
      setAddStatus('preparing');
    }
  }, [loading, searchParams, apps, letterStates, setSearchParams]);

  // ─── abgeleitete Daten ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter((a) =>
      [a.job_title, a.company, a.contact_name, a.location].some((v) => v?.toLowerCase().includes(q))
    );
  }, [apps, query]);

  const byStatus = useMemo(() => {
    const map = {} as Record<ApplicationStatus, TrackedApplication[]>;
    for (const s of [...BOARD_STATUSES, ...ARCHIVE_STATUSES]) map[s.id] = [];
    for (const a of filtered) map[a.status]?.push(a);
    // überfällige / bald fällige Schritte nach oben
    for (const list of Object.values(map)) {
      list.sort((x, y) => (x.next_action_due ?? '9999').localeCompare(y.next_action_due ?? '9999'));
    }
    return map;
  }, [filtered]);

  const nextInterviewByApp = useMemo(() => {
    const m = new Map<string, ApplicationEvent>();
    for (const e of interviews) if (!m.has(e.application_id)) m.set(e.application_id, e);
    return m;
  }, [interviews]);

  const archived = ARCHIVE_STATUSES.flatMap((s) => byStatus[s.id]);
  const highlightedAppId = highlightedCvId ? apps.find((a) => a.cv_id === highlightedCvId)?.id : undefined;
  const openApp = apps.find((a) => a.id === openId) ?? null;
  const activeApp = apps.find((a) => a.id === activeId) ?? null;

  // ─── Mutationen ─────────────────────────────────────────────────────
  const replace = (updated: TrackedApplication) =>
    setApps((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));

  const handlePatch = useCallback(async (id: string, patch: ApplicationUpdate) => {
    const before = apps.find((a) => a.id === id);
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    try {
      replace(await applicationService.update(id, patch));
    } catch (e) {
      console.error('[ApplicationBoard] patch', e);
      if (before) replace(before);
    }
  }, [apps]);

  const handleStatusChange = useCallback(async (app: TrackedApplication, status: ApplicationStatus) => {
    if (app.status === status) return;
    setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, status } : a)));
    try {
      const updated = await applicationService.setStatus(app.id, status);
      replace(updated); // enthält von Triggern gesetzte Felder (applied_at, next_action …)
      applicationService.listFirstResponses().then(setFirstResponses).catch(() => {});
      const c = CELEBRATE[status];
      if (c) setCelebration({ status: c, jobTitle: app.job_title, company: app.company ?? undefined });
    } catch (e) {
      console.error('[ApplicationBoard] status', e);
      replace(app);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await applicationService.remove(id);
    setOpenId(null);
    setApps((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // ─── Drag & Drop ────────────────────────────────────────────────────
  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    lastDragEnd.current = Date.now();
    const app = apps.find((a) => a.id === e.active.id);
    const target = e.over?.id as ApplicationStatus | undefined;
    if (app && target) handleStatusChange(app, target);
  };
  const handleOpen = (app: TrackedApplication, tab: DrawerTab = 'details') => {
    if (Date.now() - lastDragEnd.current < 250) return; // Klick direkt nach Drop ignorieren
    setOpenTab(tab);
    setAwaitingLetterPayment(false);
    setOpenId(app.id);
  };
  const handleOpenLetter = (app: TrackedApplication) => handleOpen(app, 'letter');
  const highlightedApp = apps.find((a) => a.id === highlightedAppId);
  const showLetterUpsell = highlightedApp && !letterStates[highlightedApp.id];
  const missingLetters = apps.filter(
    (a) => ['saved', 'preparing', 'applied'].includes(a.status) && letterStates[a.id] !== 'unlocked'
  );
  const firstMissing =
    missingLetters.find((a) => a.status === 'preparing') ?? missingLetters.find((a) => a.status === 'saved') ?? missingLetters[0];

  // ─── Render ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-[#66c0b6]" />
        <p className="mt-4 text-white/60">Lade Bewerbungen…</p>
      </div>
    );
  }

  return (
    <>
      <ApplicationInsights apps={apps} upcomingInterviews={interviews} firstResponses={firstResponses} onOpen={handleOpen} />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Stelle, Firma, Kontakt suchen…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-8 text-sm text-white placeholder-white/30 outline-none focus:border-[#66c0b6]/50"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setAddStatus('saved')}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] px-3 py-2 text-sm font-semibold text-black"
        >
          <Plus className="h-4 w-4" /> Bewerbung
        </button>
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {showLetterUpsell && highlightedApp && (
        <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-[#66c0b6]/40 bg-gradient-to-r from-[#66c0b6]/15 to-[#30E3CA]/5 p-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="flex items-center gap-1.5 text-sm font-bold text-white">
              <Sparkles className="h-4 w-4 text-[#66c0b6]" /> Dein CV für „{highlightedApp.job_title}“ ist fertig
            </p>
            <p className="mt-0.5 text-xs text-white/70">
              Jetzt das passende Anschreiben dazu – mit Erklärung zu jedem Absatz. Vorschau kostenlos, danach nur{' '}
              <b className="text-white">{formatEuro(COVER_LETTER_PRICE.addon)}</b> im Kombi-Preis.
            </p>
          </div>
          <button
            onClick={() => handleOpenLetter(highlightedApp)}
            className="flex-shrink-0 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] px-4 py-2 text-sm font-bold text-black"
          >
            Anschreiben erstellen
          </button>
        </div>
      )}

      {!showLetterUpsell && firstMissing && (
        <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-[#30E3CA]/35 bg-[#30E3CA]/[0.07] px-4 py-3 sm:flex-row sm:items-center">
          <p className="flex flex-1 items-center gap-2 text-sm text-white/80">
            <span className="rounded-full bg-[#30E3CA] px-1.5 py-0.5 text-[10px] font-black text-black">NEU</span>
            <span>
              <b className="text-white">KI-Anschreiben:</b>{' '}
              {missingLetters.length === 1
                ? 'Für eine Bewerbung fehlt noch das Anschreiben.'
                : `Für ${missingLetters.length} Bewerbungen fehlt noch das Anschreiben.`}{' '}
              <span className="text-white/55">Jeder Absatz erklärt · Vorschau kostenlos</span>
            </span>
          </p>
          <button
            onClick={() => handleOpenLetter(firstMissing)}
            className="flex flex-shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] px-4 py-2 text-sm font-bold text-black"
          >
            <Sparkles className="h-4 w-4" /> Jetzt erstellen
          </button>
        </div>
      )}

      {apps.length === 0 && !error && (
        <div className="mb-3 rounded-xl border border-dashed border-[#66c0b6]/40 bg-white/[0.03] p-4 text-sm text-white/70">
          Noch keine Bewerbungen. Optimiere einen CV für eine Stelle – die Bewerbung wird automatisch angelegt –
          oder füge eine Stelle über <b>+ Bewerbung</b> hinzu.
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
        <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {BOARD_STATUSES.map((status) => (
            <ApplicationColumn key={status.id} status={status} count={byStatus[status.id].length} onAdd={() => setAddStatus(status.id)}>
              {byStatus[status.id].map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  nextInterview={nextInterviewByApp.get(app.id)}
                  onOpen={handleOpen}
                  isHighlighted={app.id === highlightedAppId}
                  coverLetterState={letterStates[app.id] ?? 'none'}
                  onOpenLetter={handleOpenLetter}
                />
              ))}
            </ApplicationColumn>
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeApp ? <ApplicationCard app={activeApp} onOpen={() => {}} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {archived.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowArchive((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
          >
            <Archive className="h-3.5 w-3.5" />
            Archiv ({archived.length}) – Absagen & zurückgezogen
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showArchive ? 'rotate-180' : ''}`} />
          </button>
          {showArchive && (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {archived.map((app) => (
                <ApplicationCard key={app.id} app={app} onOpen={handleOpen} muted />
              ))}
            </div>
          )}
        </div>
      )}

      {openApp && (
        <ApplicationDrawer
          key={openApp.id}
          app={openApp}
          initialTab={openTab}
          awaitingCoverLetterPayment={awaitingLetterPayment}
          onCoverLetterChange={(l) =>
            setLetterStates((prev) => ({
              ...prev,
              [l.application_id]: l.is_unlocked ? 'unlocked' : prev[l.application_id] === 'unlocked' ? 'unlocked' : 'draft',
            }))
          }
          onClose={() => setOpenId(null)}
          onPatch={handlePatch}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onInterviewScheduled={(updated, event) => {
            replace(updated);
            setInterviews((prev) =>
              [...prev, event].sort((a, b) => (a.scheduled_at ?? '').localeCompare(b.scheduled_at ?? ''))
            );
          }}
        />
      )}

      {addStatus && (
        <AddApplicationModal
          initialStatus={addStatus}
          onClose={() => {
            setAddStatus(null);
            setLetterAfterCreate(false);
          }}
          onCreated={(app) => {
            setApps((prev) => [app, ...prev]);
            setAddStatus(null);
            setOpenTab(letterAfterCreate ? 'letter' : 'details');
            setLetterAfterCreate(false);
            setOpenId(app.id);
          }}
        />
      )}

      {celebration && (
        <StatusCelebrationModal
          status={celebration.status}
          jobTitle={celebration.jobTitle}
          company={celebration.company}
          onClose={() => setCelebration(null)}
        />
      )}
    </>
  );
}
