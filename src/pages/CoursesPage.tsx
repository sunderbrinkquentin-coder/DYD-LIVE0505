// src/pages/CoursesPage.tsx
//
// Kursseite der DYD Career Academy (/kurse): alle fertigen Lernpfade aus dem
// Katalog, sofort startklar für 3,99 €. Darunter der Weg zum persönlichen
// Lernpfad über die kostenlose Skill-Analyse.
//
// Für Admins (VITE_ACADEMY_ADMIN_EMAILS + Secret ACADEMY_ADMIN_EMAILS) gibt es
// unten einen Bereich, um Basis-Kurse anzulegen und den Fortschritt zu sehen.
// Der Katalog wächst danach automatisch mit jedem gekauften persönlichen Lernpfad.

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Award, BookOpen, CheckCircle2, Loader2, QrCode, RefreshCw, Settings2, Sparkles, Target, Zap,
} from 'lucide-react';
import { AcademyCatalogSection } from '../components/career/AcademyCatalogSection';
import { AcademyScrollStory } from '../components/career/AcademyScrollStory';
import { CATALOG_PRICE_LABEL, REGULAR_PRICE_LABEL } from '../services/academyCatalogService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const ADMIN_EMAILS = String(import.meta.env.VITE_ACADEMY_ADMIN_EMAILS || '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

/** Breit gefragte Skills als Grundstock – im Admin-Bereich frei änderbar */
const BASE_SKILLS = [
  'Projektmanagement',
  'Microsoft Excel',
  'KI im Arbeitsalltag',
  'Datenschutz (DSGVO)',
  'Agiles Arbeiten mit Scrum',
  'Professionelle Kommunikation',
  'Prozessoptimierung (Lean)',
  'Vertrieb und Verhandlung',
];

const STEPS = [
  { icon: Zap, title: 'Kurs wählen', text: 'Fertig erstellt – kein Warten, du startest sofort.' },
  { icon: BookOpen, title: '5 Lerneinheiten', text: 'Kurze, interaktive Schritte fürs Smartphone, mit Übungen und Praxisfällen.' },
  { icon: Award, title: 'Prüfung & Zertifikat', text: 'Abschlussprüfung bestehen und ein prüfbares Zertifikat mit QR-Code erhalten.' },
];

export default function CoursesPage() {
  const navigate = useNavigate();
  const { user } = useAuth() as any;
  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(String(user.email).toLowerCase());

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Kopf */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#020617]/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={16} /> DYD
          </button>
          <button
            onClick={() => navigate(user ? '/dashboard' : '/login')}
            className="text-sm font-bold px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            {user ? 'Dashboard' : 'Login'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 sm:py-14 space-y-14">
        {/* Hero */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest text-[#30E3CA] bg-[#30E3CA]/10 border border-[#30E3CA]/25">
            <Sparkles size={12} /> DYD Career Academy
          </p>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight">
            Kurse mit Zertifikat –{' '}
            <span className="bg-gradient-to-r from-[#30E3CA] to-[#66c0b6] bg-clip-text text-transparent">sofort starten</span>
          </h1>
          <p className="text-white/60 text-base sm:text-lg">
            Fertige Lernpfade für gefragte Skills: 5 interaktive Lerneinheiten, Abschlussprüfung und ein prüfbares
            Zertifikat – für {CATALOG_PRICE_LABEL} statt {REGULAR_PRICE_LABEL}.
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-white/50 pt-1">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#66c0b6]" /> Einmalzahlung, kein Abo</span>
            <span className="flex items-center gap-1.5"><QrCode size={14} className="text-[#66c0b6]" /> Zertifikat mit QR-Prüfung</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#66c0b6]" /> Direkt in LinkedIn & Lebenslauf</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={() => document.getElementById('kurse')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-black text-black flex items-center justify-center gap-2 transition-transform hover:scale-[1.03]"
              style={{ background: 'linear-gradient(135deg,#30E3CA,#66c0b6)' }}
            >
              Kurs wählen & buchen
            </button>
            <button
              onClick={() => document.getElementById('kurs-story')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-white bg-white/5 border border-white/15 hover:bg-white/10 transition-colors"
            >
              ▶ So läuft ein Kurs ab
            </button>
          </div>
        </section>

        {/* Kurse */}
        <div id="kurse" className="scroll-mt-20">
        <AcademyCatalogSection
          title="Alle Kurse"
          subtitle="Wähle einen Kurs und leg sofort los."
          limit={200}
          searchable
          showEmpty
        />
        </div>

        {/* Das bekommst du */}
        <div id="kurs-story" className="-mx-4">
          <AcademyScrollStory bookable />
        </div>

        {/* So funktioniert's */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#30E3CA]/10 text-[#30E3CA]"><s.icon size={16} /></span>
                <span className="text-[10px] font-black text-white/30">SCHRITT {i + 1}</span>
              </div>
              <p className="font-black">{s.title}</p>
              <p className="text-sm text-white/55 mt-1">{s.text}</p>
            </div>
          ))}
        </section>

        {/* Persönlicher Lernpfad */}
        <section
          className="rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between"
          style={{ background: 'linear-gradient(135deg,rgba(48,227,202,0.12),rgba(6,10,18,0.9) 70%)', border: '1px solid rgba(48,227,202,0.25)' }}
        >
          <div className="space-y-1.5 max-w-xl">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#30E3CA]/80 flex items-center gap-1.5"><Target size={12} /> Persönlich statt allgemein</p>
            <p className="text-xl font-black">Dein Skill ist nicht dabei – oder du willst es genau für deinen Zieljob?</p>
            <p className="text-sm text-white/60">
              Die kostenlose Skill-Analyse zeigt, welche Skills dir für deine Wunschposition fehlen. Daraus entsteht ein
              Lernpfad mit Beispielen aus deinem Zielunternehmen.
            </p>
          </div>
          <button
            onClick={() => navigate('/career-vision')}
            className="shrink-0 px-6 py-3.5 rounded-xl font-black text-black flex items-center gap-2 transition-transform hover:scale-[1.03]"
            style={{ background: 'linear-gradient(135deg,#30E3CA,#66c0b6)' }}
          >
            Skill-Analyse starten
          </button>
        </section>

        {isAdmin && <CatalogAdminPanel />}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin: Basis-Kurse anlegen und Fortschritt ansehen
// ─────────────────────────────────────────────────────────────────────────────
interface AdminEntry {
  id: string; skill: string; status: string; purchases: number; ready_at: string | null;
  step: string | null; units_done: number; error: string | null;
}

function CatalogAdminPanel() {
  const [skillsText, setSkillsText] = useState(BASE_SKILLS.join('\n'));
  const [entries, setEntries] = useState<AdminEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('trigger-learningpath', { body });
    if (error) {
      let msg = error.message;
      try { msg = (await (error as any).context.json())?.error || msg; } catch { /* ignore */ }
      throw new Error(msg);
    }
    return data;
  };

  const refresh = useCallback(async () => {
    try {
      const data = await call({ action: 'catalog_status' });
      setEntries(data?.entries ?? []);
    } catch (e: any) {
      setMessage(e.message);
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15_000);
    return () => clearInterval(t);
  }, [refresh]);

  const seed = async () => {
    const skills = skillsText.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!skills.length) return;
    setBusy(true);
    setMessage(null);
    try {
      const data = await call({ action: 'seed_catalog', skills });
      const lines = (data?.results ?? []).map((r: any) => `${r.skill}: ${r.result}`);
      setMessage(lines.join(' · ') || 'Erledigt.');
      await refresh();
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  };

  const label = (e: AdminEntry) => {
    if (e.status === 'ready') return { text: 'Im Katalog', color: '#4ade80' };
    if (e.status === 'failed') return { text: 'Fehlgeschlagen', color: '#f87171' };
    if (e.step === 'units') return { text: `Einheiten ${e.units_done}/5`, color: '#fbbf24' };
    if (e.step === 'plan') return { text: 'Wissensbasis …', color: '#fbbf24' };
    return { text: 'Wird erstellt', color: '#fbbf24' };
  };

  return (
    <section className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.15)' }}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-black flex items-center gap-2"><Settings2 size={16} className="text-white/50" /> Katalog verwalten (nur Admin)</p>
        <button onClick={refresh} className="text-xs text-white/50 hover:text-white flex items-center gap-1"><RefreshCw size={12} /> Aktualisieren</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs text-white/50">Ein Skill pro Zeile. Vorhandene Kurse werden übersprungen, fehlgeschlagene neu erstellt. Dauer ca. 3–5 Minuten pro Kurs (parallel).</p>
          <textarea
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            rows={9}
            className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-[#30E3CA]/50"
          />
          <button
            onClick={seed}
            disabled={busy}
            className="px-5 py-2.5 rounded-xl font-black text-sm text-black flex items-center gap-2 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#30E3CA,#66c0b6)' }}
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Kurse erstellen
          </button>
          {message && <p className="text-xs text-white/60">{message}</p>}
        </div>

        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {entries.length === 0 && <p className="text-xs text-white/40">Noch keine Katalog-Einträge.</p>}
          {entries.map((e) => {
            const l = label(e);
            return (
              <div key={e.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white/[0.03]">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{e.skill}</p>
                  {e.error && <p className="text-[11px] text-red-300/80 truncate" title={e.error}>{e.error}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-bold" style={{ color: l.color }}>{l.text}</p>
                  <p className="text-[10px] text-white/35">{e.purchases} Käufe</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}