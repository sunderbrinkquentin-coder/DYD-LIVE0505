import { useMemo } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import type { ApplicationEvent, TrackedApplication } from '../../../types/applications';
import { daysUntil } from '../../../services/applicationService';

interface ApplicationInsightsProps {
  apps: TrackedApplication[];
  upcomingInterviews: ApplicationEvent[];
  firstResponses: { application_id: string; occurred_at: string }[];
  onOpen: (app: TrackedApplication) => void;
}

const SENT = new Set(['applied', 'interview', 'offer', 'accepted', 'rejected']);
const POSITIVE = new Set(['interview', 'offer', 'accepted']);
const CLOSED = new Set(['accepted', 'rejected', 'withdrawn']);

export function ApplicationInsights({ apps, upcomingInterviews, firstResponses, onOpen }: ApplicationInsightsProps) {
  const kpis = useMemo(() => {
    const active = apps.filter((a) => !CLOSED.has(a.status)).length;
    const sent = apps.filter((a) => SENT.has(a.status));
    const positive = sent.filter((a) => POSITIVE.has(a.status)).length;

    const byId = new Map(apps.map((a) => [a.id, a]));
    const durations = firstResponses
      .map((r) => {
        const app = byId.get(r.application_id);
        if (!app?.applied_at) return null;
        const ms = new Date(r.occurred_at).getTime() - new Date(`${app.applied_at}T00:00:00`).getTime();
        return ms >= 0 ? ms / 86_400_000 : null;
      })
      .filter((n): n is number => n !== null);
    const avgDays = durations.length ? durations.reduce((s, n) => s + n, 0) / durations.length : null;

    const in7 = Date.now() + 7 * 86_400_000;
    const interviewsSoon = upcomingInterviews.filter(
      (e) => e.scheduled_at && new Date(e.scheduled_at).getTime() <= in7
    ).length;

    return {
      active,
      rate: sent.length ? Math.round((positive / sent.length) * 100) : null,
      avgDays,
      interviewsSoon,
    };
  }, [apps, upcomingInterviews, firstResponses]);

  const due = useMemo(
    () =>
      apps
        .filter((a) => !CLOSED.has(a.status) && a.next_action && (daysUntil(a.next_action_due) ?? 1) <= 0)
        .sort((a, b) => (a.next_action_due ?? '').localeCompare(b.next_action_due ?? '')),
    [apps]
  );

  const tiles = [
    { label: 'Aktive Bewerbungen', value: String(kpis.active), hint: 'ohne Archiv' },
    { label: 'Antwortquote', value: kpis.rate === null ? '–' : `${kpis.rate} %`, hint: 'Interview oder besser' },
    {
      label: 'Ø Tage bis Rückmeldung',
      value: kpis.avgDays === null ? '–' : kpis.avgDays.toLocaleString('de-DE', { maximumFractionDigits: 1 }),
      hint: 'aus deiner Timeline',
    },
    { label: 'Interviews (7 Tage)', value: String(kpis.interviewsSoon), hint: 'mit Kalender-Export' },
  ];

  return (
    <div className="mb-4 grid gap-3 lg:grid-cols-3">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:col-span-2">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
            <p className="text-[11px] text-white/55">{t.label}</p>
            <p className="text-2xl font-bold text-white">{t.value}</p>
            <p className="text-[11px] text-[#66c0b6]">{t.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#66c0b6]/35 bg-gradient-to-br from-[#66c0b6]/15 to-[#30E3CA]/5 px-3.5 py-3">
        <h3 className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-white">
          <Bell className="h-3.5 w-3.5 text-[#66c0b6]" /> Heute fällig
        </h3>
        {due.length === 0 ? (
          <p className="flex items-center gap-1.5 text-xs text-white/60">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#66c0b6]" /> Alles erledigt
          </p>
        ) : (
          <ul className="flex max-h-32 flex-col gap-1.5 overflow-auto">
            {due.map((a) => {
              const overdue = (daysUntil(a.next_action_due) ?? 0) < 0;
              return (
                <li key={a.id}>
                  <button
                    onClick={() => onOpen(a)}
                    className="flex w-full items-center gap-2 rounded-lg bg-black/25 px-2 py-1.5 text-left text-xs text-white hover:bg-black/40"
                  >
                    <span className="line-clamp-1 flex-1">
                      {a.next_action} – <b>{a.company || a.job_title}</b>
                    </span>
                    <span
                      className={`rounded-md px-1.5 text-[10px] font-bold ${
                        overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {overdue ? 'überfällig' : 'heute'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
