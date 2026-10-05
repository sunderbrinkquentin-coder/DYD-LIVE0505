// src/pages/CertificateVerifyPage.tsx
//
// Öffentliche Echtheitsprüfung der Career-Academy-Zertifikate.
// Aufruf über den QR-Code auf dem Zertifikat: /#/verify/DYD-2026-XXXXXXXX
// Liest über die Datenbank-Funktion verify_academy_certificate nur die
// Angaben, die ohnehin auf dem Zertifikat stehen.

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, ShieldX, Loader2, Award, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VerifiedCertificate {
  certificate_id: string;
  recipient_name: string;
  skill: string;
  score: number;
  question_count: number | null;
  passed_at: string;
  issued_at: string;
  unit_titles: string[] | null;
  total_hours: number | null;
  hours_estimated: boolean;
  revoked: boolean;
}

type State = { status: 'loading' } | { status: 'found'; cert: VerifiedCertificate } | { status: 'not_found' } | { status: 'error' };

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function CertificateVerifyPage() {
  const { certId = '' } = useParams<{ certId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    (async () => {
      const id = decodeURIComponent(certId).trim();
      if (!id) { setState({ status: 'not_found' }); return; }
      const { data, error } = await supabase.rpc('verify_academy_certificate', { cert_id: id });
      if (cancelled) return;
      if (error) { setState({ status: 'error' }); return; }
      const row = Array.isArray(data) ? data[0] : data;
      setState(row ? { status: 'found', cert: row as VerifiedCertificate } : { status: 'not_found' });
    })();
    return () => { cancelled = true; };
  }, [certId]);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/verify/${encodeURIComponent(query.trim().toUpperCase())}`);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-start sm:items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-1">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#30E3CA]/70">DYD Career Academy</p>
          <h1 className="text-2xl font-black">Zertifikatsprüfung</h1>
        </div>

        {state.status === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-16 text-white/50">
            <Loader2 className="animate-spin" size={18} /> Zertifikat wird geprüft …
          </div>
        )}

        {state.status === 'found' && !state.cert.revoked && (
          <div className="rounded-3xl overflow-hidden border border-[#30E3CA]/30 bg-gradient-to-br from-[#30E3CA]/[0.08] to-transparent">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10 bg-[#30E3CA]/10">
              <ShieldCheck className="text-[#30E3CA] flex-shrink-0" size={28} />
              <div>
                <p className="font-black text-[#30E3CA]">Echtes Zertifikat</p>
                <p className="text-xs text-white/60">Dieses Zertifikat wurde von DYD – Decide Your Dream ausgestellt.</p>
              </div>
            </div>
            <dl className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div className="sm:col-span-2">
                <dt className="text-[11px] uppercase tracking-wider text-white/40">Inhaber/in</dt>
                <dd className="text-xl font-black">{state.cert.recipient_name}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] uppercase tracking-wider text-white/40">Lernpfad zur Kompetenz</dt>
                <dd className="text-base font-bold flex items-center gap-2"><Award size={16} className="text-[#30E3CA]" />{state.cert.skill}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-white/40">Abschlussprüfung</dt>
                <dd className="font-semibold">
                  bestanden · {state.cert.score} %
                  {state.cert.question_count ? <span className="text-white/50 font-normal"> ({state.cert.question_count} Fragen)</span> : null}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-white/40">Abgeschlossen am</dt>
                <dd className="font-semibold">{formatDate(state.cert.passed_at)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-white/40">Zertifikatsnummer</dt>
                <dd className="font-mono font-semibold">{state.cert.certificate_id}</dd>
              </div>
              {state.cert.unit_titles?.length ? (
                <div className="sm:col-span-2">
                  <dt className="text-[11px] uppercase tracking-wider text-white/40 mb-1">Absolvierte Lerneinheiten</dt>
                  <dd>
                    <ul className="space-y-1">
                      {state.cert.unit_titles.map((t, i) => (
                        <li key={i} className="flex gap-2 text-white/80"><span className="text-[#30E3CA]">▪</span>{t}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
            </dl>
            <p className="px-6 pb-5 text-[11px] text-white/40 leading-relaxed">
              Das Zertifikat dokumentiert die erfolgreiche Teilnahme an einem digitalen Lernpfad der DYD Career Academy
              und das Bestehen der Abschlussprüfung. Es ist kein staatlich anerkannter Berufs- oder Bildungsabschluss.
              Stimmen Name oder Angaben nicht mit dem vorgelegten Dokument überein, wurde das Dokument verändert.
            </p>
          </div>
        )}

        {state.status === 'found' && state.cert.revoked && (
          <div className="rounded-3xl border border-red-400/30 bg-red-400/[0.06] px-6 py-6 flex items-start gap-3">
            <ShieldX className="text-red-400 flex-shrink-0" size={28} />
            <div>
              <p className="font-black text-red-300">Zertifikat zurückgezogen</p>
              <p className="text-sm text-white/60 mt-1">Das Zertifikat {state.cert.certificate_id} ist nicht mehr gültig.</p>
            </div>
          </div>
        )}

        {(state.status === 'not_found' || state.status === 'error') && (
          <div className="rounded-3xl border border-amber-400/30 bg-amber-400/[0.06] px-6 py-6 flex items-start gap-3">
            <ShieldAlert className="text-amber-300 flex-shrink-0" size={28} />
            <div>
              <p className="font-black text-amber-200">
                {state.status === 'error' ? 'Prüfung gerade nicht möglich' : 'Kein Zertifikat gefunden'}
              </p>
              <p className="text-sm text-white/60 mt-1">
                {state.status === 'error'
                  ? 'Bitte versuche es in einigen Minuten erneut.'
                  : 'Zu dieser Nummer gibt es kein Zertifikat der DYD Career Academy. Prüfe die Schreibweise.'}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={search} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zertifikatsnummer, z. B. DYD-2026-3F9A12BC"
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm placeholder-white/30 focus:outline-none focus:border-[#30E3CA]/60"
          />
          <button type="submit" className="px-4 py-3 rounded-xl bg-[#30E3CA] text-black font-bold flex items-center gap-1.5">
            <Search size={16} /> Prüfen
          </button>
        </form>
      </div>
    </div>
  );
}
