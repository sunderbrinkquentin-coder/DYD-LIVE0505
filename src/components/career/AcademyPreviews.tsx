// src/components/career/AcademyPreviews.tsx
//
// Vorschauen für die Conversion: So sieht DEIN Ergebnis aus.
//  - CertificatePreview      Nachbildung des echten Zertifikats (certificatePDF.tsx), live mit Name & Skill
//  - CompetencyProfilePreview Nachbildung des Kompetenzprofils (competencyProfilePDF.tsx)
//  - LinkedInPreview         So erscheint das Zertifikat im LinkedIn-Profil
//  - LearningJourney         animierter Weg: 5 Lerneinheiten → Prüfung → Zertifikat
//  - AcademyValueStrip       "Das bekommst du" (Landingpage) mit Namensfeld
//  - ProfileProgress         Fortschritt bis zum Kompetenzprofil (ab 2 Zertifikaten)
//
// Reines HTML/CSS – lädt sofort, skaliert auf jede Breite, keine PDF-Erzeugung.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import QRCode from 'qrcode';
import { Award, BookOpen, CheckCircle2, FileStack, Linkedin, QrCode, ShieldCheck, Trophy } from 'lucide-react';

const NAVY = '#0A192F';
const NAVY_SOFT = '#3B4A63';
const TEAL = '#30E3CA';
const TEAL_DEEP = '#2BA597';
const RULE = '#DCE3EC';
const MUTED = '#6B7280';
const PAPER = '#F5FAF9';
const LOGO = '/DYD Logo RGB.svg';

const PREVIEW_ID = 'DYD-2026-VORSCHAU';
const today = () => new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

/** Skaliert ein festes Layout (Breite × Höhe in px) auf die Containerbreite */
function Scaled({ width, height, children, className = '' }: { width: number; height: number; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div ref={ref} className={`relative w-full overflow-hidden ${className}`} style={{ aspectRatio: `${width} / ${height}` }}>
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
        {children}
      </div>
    </div>
  );
}

function useQr(text: string) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(text, { margin: 0, width: 160, color: { dark: NAVY, light: '#FFFFFF' } })
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(null));
    return () => { alive = false; };
  }, [text]);
  return url;
}

function PreviewRibbon() {
  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-black shadow-lg"
      style={{ background: 'linear-gradient(90deg,#30E3CA,#66c0b6)' }}>
      Vorschau
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Zertifikat
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_COMPETENCIES = (skill: string) => [
  `Du wendest die Grundlagen von ${skill} sicher im Arbeitsalltag an.`,
  'Du triffst fachlich begründete Entscheidungen in typischen Praxissituationen.',
  'Du erkennst häufige Fehler früh und leitest passende Maßnahmen ab.',
  'Du erklärst Vorgehen und Ergebnisse verständlich im Team.',
  'Du dokumentierst deine Arbeit nachvollziehbar und professionell.',
];

export function CertificatePreview({
  name, skill, units, competencies, score = 90, showRibbon = true, className = '',
}: {
  name?: string;
  skill: string;
  units?: string[];
  competencies?: string[];
  score?: number;
  showRibbon?: boolean;
  className?: string;
}) {
  const displayName = name?.trim() || 'Dein Name';
  const unitList = (units && units.length ? units : ['Lerneinheit 1', 'Lerneinheit 2', 'Lerneinheit 3', 'Lerneinheit 4', 'Lerneinheit 5']).slice(0, 6);
  const comp = (competencies && competencies.length ? competencies : DEFAULT_COMPETENCIES(skill)).slice(0, 5);
  const qr = useQr(`https://decide-your-dream.de/#/verify/${PREVIEW_ID}`);

  return (
    <div className={`relative rounded-xl overflow-hidden shadow-2xl ${className}`} style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}>
      {showRibbon && <PreviewRibbon />}
      <Scaled width={842} height={595}>
        <div style={{ width: 842, height: 595, background: '#fff', position: 'relative', fontFamily: 'Helvetica, Arial, sans-serif', color: NAVY }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 18, background: NAVY }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 18, width: 4, background: TEAL }} />
          <div style={{ position: 'absolute', top: 26, right: 40, bottom: 22, left: 58, display: 'flex', flexDirection: 'column' }}>
            {/* Kopf */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: `1px solid ${RULE}` }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src={LOGO} alt="" style={{ width: 30, height: 30, marginRight: 9 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.8 }}>DYD — DECIDE YOUR DREAM</div>
                  <div style={{ fontSize: 8, color: MUTED, marginTop: 2 }}>Career Academy · decide-your-dream.de</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 7, fontWeight: 700, color: TEAL_DEEP, letterSpacing: 1.4 }}>ZERTIFIKATSNUMMER</div>
                <div style={{ fontSize: 9, fontWeight: 700, marginTop: 2 }}>{PREVIEW_ID}</div>
              </div>
            </div>

            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 2.6, marginTop: 16 }}>ZERTIFIKAT</div>
            <div style={{ height: 3, width: 96, background: TEAL, marginTop: 8 }} />
            <div style={{ fontSize: 10, color: MUTED, marginTop: 12 }}>Hiermit wird bescheinigt, dass</div>
            <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: name?.trim() ? NAVY : '#9AA4B2' }}>{displayName}</div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 8 }}>den Lernpfad zur Kompetenz</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 3 }}>Fachkompetenz {skill}</div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 8 }}>
              erfolgreich abgeschlossen, alle Lerneinheiten absolviert und die Abschlussprüfung bestanden hat.
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
              {[
                { title: 'ERWORBENE KOMPETENZEN', items: comp },
                { title: 'ABSOLVIERTE LERNEINHEITEN', items: unitList },
              ].map((col) => (
                <div key={col.title} style={{ flex: 1, background: PAPER, borderLeft: `2px solid ${TEAL}`, padding: '9px 12px 6px' }}>
                  <div style={{ fontSize: 7.5, fontWeight: 700, color: NAVY_SOFT, letterSpacing: 1.1, marginBottom: 7 }}>{col.title}</div>
                  {col.items.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ width: 3, height: 3, background: TEAL, marginTop: 4, marginRight: 6, flexShrink: 0 }} />
                      <div style={{ fontSize: 8.2, color: NAVY_SOFT, lineHeight: 1.3 }}>{t}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', marginTop: 12, borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}`, padding: '8px 0' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 6.8, fontWeight: 700, color: MUTED, letterSpacing: 0.9, marginBottom: 3 }}>ABSCHLUSSPRÜFUNG</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: TEAL_DEEP }}>bestanden · {score} %</div>
                <div style={{ fontSize: 7, color: MUTED, marginTop: 2 }}>10 Fragen – Bestehensgrenze 80 %</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 6.8, fontWeight: 700, color: MUTED, letterSpacing: 0.9, marginBottom: 3 }}>ABGESCHLOSSEN AM</div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>{today()}</div>
                <div style={{ fontSize: 7, color: MUTED, marginTop: 2 }}>Düsseldorf</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
              <div style={{ flex: 1, paddingRight: 22 }}>
                <div style={{ fontSize: 6.6, color: MUTED, lineHeight: 1.45 }}>
                  Das Zertifikat dokumentiert die erfolgreiche Teilnahme an einem digitalen Lernpfad der DYD Career Academy sowie das
                  Bestehen der zugehörigen Abschlussprüfung. Es ist kein staatlich anerkannter Berufs- oder Bildungsabschluss.
                </div>
                <div style={{ fontSize: 7, color: NAVY_SOFT, marginTop: 5 }}>Echtheit prüfen (QR-Code scannen oder aufrufen):</div>
                <div style={{ fontSize: 7, color: TEAL_DEEP, fontWeight: 700, marginTop: 2 }}>decide-your-dream.de/#/verify/{PREVIEW_ID}</div>
              </div>
              <div style={{ width: 175, textAlign: 'center', marginRight: 18 }}>
                <div style={{ width: 160, height: 1, background: NAVY, margin: '0 auto 4px' }} />
                <div style={{ fontSize: 8.5, fontWeight: 700 }}>Quentin Sunderbrink</div>
                <div style={{ fontSize: 7, color: MUTED, marginTop: 1 }}>Founder & CEO, DYD Career Academy</div>
              </div>
              <div style={{ width: 74, textAlign: 'center' }}>
                {qr ? <img src={qr} alt="" style={{ width: 66, height: 66, margin: '0 auto' }} /> : <div style={{ width: 66, height: 66, background: '#eef2f6', margin: '0 auto' }} />}
                <div style={{ fontSize: 6.2, color: MUTED, marginTop: 3 }}>Digital ausgestellt<br />und prüfbar</div>
              </div>
            </div>
          </div>
        </div>
      </Scaled>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Kompetenzprofil
// ─────────────────────────────────────────────────────────────────────────────
export function CompetencyProfilePreview({
  name, skills = ['Projektmanagement', 'Microsoft Excel', 'KI im Arbeitsalltag'], showRibbon = true, className = '',
}: { name?: string; skills?: string[]; showRibbon?: boolean; className?: string }) {
  const list = skills.slice(0, 3);
  const scores = [90, 100, 80];
  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`} style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}>
      {showRibbon && <PreviewRibbon />}
      <Scaled width={595} height={842}>
        <div style={{ width: 595, height: 842, background: '#fff', position: 'relative', fontFamily: 'Helvetica, Arial, sans-serif', color: NAVY }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 12, background: NAVY }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 12, width: 3, background: TEAL }} />
          <div style={{ padding: '36px 44px 0 48px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: `1px solid ${RULE}` }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.8 }}>DYD — DECIDE YOUR DREAM</div>
                <div style={{ fontSize: 8, color: MUTED, marginTop: 2 }}>Career Academy · decide-your-dream.de</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 7, fontWeight: 700, color: TEAL_DEEP, letterSpacing: 1.4 }}>KOMPETENZPROFIL</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 2.4, marginTop: 22 }}>KOMPETENZPROFIL</div>
            <div style={{ height: 3, width: 90, background: TEAL, marginTop: 8 }} />
            <div style={{ fontSize: 9, color: MUTED, marginTop: 16 }}>Nachgewiesene Kompetenzen von</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, color: name?.trim() ? NAVY : '#9AA4B2' }}>{name?.trim() || 'Dein Name'}</div>
            <div style={{ display: 'flex', marginTop: 18, borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}`, padding: '9px 0' }}>
              {[['KOMPETENZEN', String(list.length)], ['LERNEINHEITEN', String(list.length * 5)], ['Ø PRÜFUNG', '90 %']].map(([l, v]) => (
                <div key={l} style={{ flex: 1 }}>
                  <div style={{ fontSize: 6.6, fontWeight: 700, color: MUTED, letterSpacing: 1 }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3, color: l === 'KOMPETENZEN' ? TEAL_DEEP : NAVY }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 7.5, fontWeight: 700, color: NAVY_SOFT, letterSpacing: 1.2, marginTop: 18, marginBottom: 8 }}>EINZELNACHWEISE</div>
            {list.map((s, i) => (
              <div key={s} style={{ background: PAPER, borderLeft: `2px solid ${TEAL}`, padding: '10px 14px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{i + 1}. {s}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: TEAL_DEEP }}>{scores[i]} %</div>
                </div>
                <div style={{ display: 'flex', marginTop: 8 }}>
                  {[['ZERTIFIKATSNUMMER', `DYD-2026-0000000${i + 1}`], ['AUSGESTELLT AM', today()], ['LERNEINHEITEN', '5']].map(([l, v]) => (
                    <div key={l} style={{ flex: 1 }}>
                      <div style={{ fontSize: 6, fontWeight: 700, color: MUTED, letterSpacing: 0.9 }}>{l}</div>
                      <div style={{ fontSize: 8, marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Scaled>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LinkedIn-Eintrag
// ─────────────────────────────────────────────────────────────────────────────
export function LinkedInPreview({ skill, className = '' }: { skill: string; className?: string }) {
  const month = new Date().toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
  return (
    <div className={`rounded-xl bg-white text-[#1d2226] p-4 shadow-2xl ${className}`} style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0a66c2]">
        <Linkedin size={14} /> Dein Profil
      </div>
      <p className="text-[15px] font-semibold mt-2">Lizenzen und Zertifizierungen</p>
      <div className="flex gap-3 mt-3">
        <div className="w-11 h-11 rounded flex items-center justify-center flex-shrink-0" style={{ background: NAVY }}>
          <img src={LOGO} alt="" className="w-7 h-7" />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold leading-snug break-words">Fachkompetenz {skill}</p>
          <p className="text-[12px] text-[#1d2226]/80">DYD Career Academy</p>
          <p className="text-[12px] text-[#1d2226]/60">Ausgestellt: {month}</p>
          <p className="text-[12px] text-[#1d2226]/60">Nachweis-ID: {PREVIEW_ID}</p>
          <span className="inline-block mt-2 px-3 py-1 rounded-full border border-[#1d2226]/60 text-[12px] font-semibold">Nachweis anzeigen ↗</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Animierter Lernweg
// ─────────────────────────────────────────────────────────────────────────────
export function LearningJourney({ units, className = '' }: { units?: string[]; className?: string }) {
  const list = (units && units.length ? units : ['Grundlagen verstehen', 'Methoden anwenden', 'Praxisfälle lösen', 'Fehler vermeiden', 'Sicher umsetzen']).slice(0, 5);
  const nodes = [
    ...list.map((t, i) => ({ icon: BookOpen, label: `Einheit ${i + 1}`, title: t })),
    { icon: Trophy, label: 'Abschlussprüfung', title: '10 Praxisfragen' },
    { icon: Award, label: 'Zertifikat', title: 'mit QR-Prüfung' },
  ];
  return (
    <div className={`relative ${className}`}>
      <style>{`
        @keyframes ajFill { from { height: 0 } to { height: 100% } }
        @keyframes ajPop { 0% { transform: scale(.6); opacity: 0 } 70% { transform: scale(1.08); opacity: 1 } 100% { transform: scale(1); opacity: 1 } }
        @media (prefers-reduced-motion: reduce) { .aj-anim { animation: none !important; opacity: 1 !important; height: 100% !important } }
      `}</style>
      <div className="absolute left-[17px] top-4 bottom-4 w-[2px] bg-white/10 rounded-full overflow-hidden">
        <div className="aj-anim w-full rounded-full" style={{ background: `linear-gradient(${TEAL},#66c0b6)`, animation: 'ajFill 2.4s ease-out forwards' }} />
      </div>
      <ol className="relative space-y-3">
        {nodes.map((n, i) => {
          const last = i === nodes.length - 1;
          return (
            <li key={i} className="flex items-center gap-3">
              <span
                className="aj-anim w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: last ? `linear-gradient(135deg,${TEAL},#66c0b6)` : 'rgba(48,227,202,0.12)',
                  border: `1px solid ${last ? TEAL : 'rgba(48,227,202,0.35)'}`,
                  color: last ? '#000' : TEAL,
                  opacity: 0,
                  animation: `ajPop .45s ease-out ${0.15 + i * 0.3}s forwards`,
                }}
              >
                <n.icon size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/35">{n.label}</p>
                <p className={`text-sm font-bold leading-snug ${last ? 'text-[#30E3CA]' : 'text-white/85'}`}>{n.title}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// "Das bekommst du" (Landingpage, Kursseite)
// ─────────────────────────────────────────────────────────────────────────────
export function AcademyValueStrip({ skill = 'Projektmanagement', initialName = '', className = '' }: { skill?: string; initialName?: string; className?: string }) {
  const [name, setName] = useState(initialName);
  return (
    <section className={`space-y-6 ${className}`}>
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <p className="text-[11px] font-black uppercase tracking-widest text-[#30E3CA]/80">Das bekommst du</p>
        <h3 className="text-2xl sm:text-3xl font-black text-white">Ein Zertifikat, das Arbeitgeber prüfen können</h3>
        <p className="text-sm text-white/55">Mit QR-Code und Prüfseite, für LinkedIn und deinen Lebenslauf. Ab 2 Zertifikaten fasst dein Kompetenzprofil alles zusammen.</p>
      </div>

      <div className="max-w-sm mx-auto">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="Dein Name – sieh dein Zertifikat"
          aria-label="Dein Name für die Zertifikat-Vorschau"
          className="w-full text-center px-4 py-3 rounded-xl bg-white/5 border border-[#30E3CA]/30 text-white placeholder-white/35 focus:outline-none focus:border-[#30E3CA]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        <div className="lg:col-span-3 space-y-3">
          <CertificatePreview name={name} skill={skill} />
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/55">
            <span className="flex items-center gap-1.5"><QrCode size={14} className="text-[#30E3CA]" /> Echtheit per QR-Code prüfbar</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#30E3CA]" /> Eindeutige Zertifikatsnummer</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#30E3CA]" /> Mit Prüfungsergebnis</span>
          </div>
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 items-start">
          <LinkedInPreview skill={skill} />
          <div className="relative">
            <CompetencyProfilePreview name={name} showRibbon={false} className="max-w-[200px] mx-auto lg:mx-0" />
            <p className="text-[11px] text-white/45 mt-2 flex items-center gap-1.5"><FileStack size={13} className="text-[#66c0b6]" /> Kompetenzprofil ab 2 Zertifikaten</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fortschritt bis zum Kompetenzprofil
// ─────────────────────────────────────────────────────────────────────────────
export function ProfileProgress({ certificates, onAction, actionLabel = 'Nächsten Kurs wählen', className = '' }: {
  certificates: number;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}) {
  const goal = 2;
  const done = Math.min(certificates, goal);
  if (certificates >= goal) return null;
  return (
    <div className={`rounded-2xl p-4 flex items-center gap-4 ${className}`}
      style={{ background: 'linear-gradient(135deg,rgba(102,192,182,0.10),rgba(6,10,18,0.9))', border: '1px solid rgba(102,192,182,0.28)' }}>
      <div className="w-16 flex-shrink-0">
        <CompetencyProfilePreview showRibbon={false} skills={['Dein 1. Kurs', 'Dein 2. Kurs']} />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <p className="text-sm font-black text-white">
          {certificates === 0 ? 'Dein Kompetenzprofil: 2 Zertifikate bis zum Ziel' : 'Noch 1 Zertifikat bis zu deinem Kompetenzprofil'}
        </p>
        <div className="flex gap-1.5">
          {Array.from({ length: goal }).map((_, i) => (
            <div key={i} className="h-2 flex-1 rounded-full" style={{ background: i < done ? 'linear-gradient(90deg,#30E3CA,#66c0b6)' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>
        <p className="text-[11px] text-white/45">Alle Zertifikate in einem Dokument – ideal für Bewerbungen.</p>
      </div>
      {onAction && (
        <button onClick={onAction} className="hidden sm:block flex-shrink-0 px-3 py-2 rounded-xl text-xs font-black text-black"
          style={{ background: 'linear-gradient(135deg,#30E3CA,#66c0b6)' }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
