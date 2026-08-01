// src/components/festival/LineupSection.tsx
//
// Kategorisiertes Line-Up für die Harmony-Festivalpage – vier Kapitel in
// Running-Order, farbcodiert, auf Conversion getrimmt:
//   1. Stand-Up (16:30)  – Orange  – kompakte Act-Karten (Foto + Info)
//   2. Zirkel.WTF (20:30) – Cyan   – Headliner-Feature-Block
//   3. DJs (22:00 / 00:00)– Blau   – Foto-Karten
//   4. Support (via Spotify) – Grün – Foto + Spotify
//
// Design-System-konform (nutzt globale .graffiti / .tag-label / .btn-cyan).
// WICHTIG: Alle Fotos werden VOLLSTÄNDIG gezeigt (object-fit: contain in einer
// 4:5-Box) – kein Anschnitt mehr.
//
// Bilder in public/festival/. Für Support die Spotify-URLs unten eintragen.

import { motion } from 'framer-motion';

const CY = '#00d4d4';
const BLUE = '#1e90d4';
const ORANGE = '#f07820';
const GREEN = '#1db954';
const LIME = '#c8e840';

type Standup = {
  name: string;
  img: string;
  hook?: string;
  themes?: string[];
  stages?: string[];
};

const STANDUP: Standup[] = [
  {
    name: 'Alex Graf',
    img: '/festival/alex-graf-1.webp',
    // Alex hat (noch) keine Info-Seite -> läuft als Foto-only Karte.
  },
  {
    name: 'Larissa Magnus',
    img: '/festival/larissa-magnus-1.webp',
    hook: 'Stand-Up mit Fokus auf Alltagsobservationen — hohe Selbstironie, starke Publikums-Einbindung.',
    themes: ['Single-Dasein', 'Skurrile Dating-Erlebnisse', 'WG-Leben & Alltags-Fails'],
    stages: ['NightWash', 'Comedyflash', 'Komische Nacht'],
  },
  {
    name: 'Julian Deters',
    img: '/festival/julian-1.webp',
    hook: 'Tiefschwarzer Humor, selbstironisch & schonungslos ehrlich — der eigene Alltag als größter Gegner.',
    themes: ['Außenseiter, erzkath. Kleinstadt', 'Autismus-Diagnose', 'Pointen aus dem Scheitern'],
    stages: ['Comedy Club', 'Comedyflash', 'Comedy Gold'],
  },
  {
    name: 'Jahn Boie',
    img: '/festival/jahn-1.webp',
    hook: 'Stand-Up, Poetry Slam & Spoken Word — Bühnenkunst mit Haltung, Humor der berührt.',
    themes: ['Ruhrpott-Geschichten', 'Was uns verbindet', 'Zwischen Lachen & Nachdenken'],
    stages: ['Boing Comedy Club Köln', 'Stand-Up Night Mettmann', 'NetGig Comedy Bonn'],
  },
  {
    name: 'Kevin Küster',
    img: '/festival/kevin-kuester-1.webp',
    hook: 'Observational Comedy mit Blick auf den Alltag — Wortwitze, Dad Jokes & absurder Humor.',
    themes: ['Dinge aus den 90ern', 'Neue Perspektiven auf Normales', 'Selbstironische Anekdoten'],
    stages: ['Downstairs Comedy Club', 'Comedyflash', 'Comedy für Freunde'],
  },
  {
    name: 'Leon Blokesch',
    img: '/festival/leon-1.webp',
    hook: 'Klassische Stand-Up der neuen Generation — trockener Humor trifft ernsthafte Albernheit.',
    themes: ['Frisches Material statt Gags', 'Ernsthafte Albernheit', 'One-Liner, die bleiben'],
    stages: ['Papperlapapp', 'Comedyflash', 'Blueprint Comedy'],
  },
];

const ZIRKEL = {
  name: 'Zirkel.WTF',
  img: '/festival/zirkel-1.webp',
  time: '20:30',
  hook: 'Pop-Punk / Skate-Punk mit Hip-Hop-Wurzeln — Ohrwürmer zum Moshen & Mitbrüllen. Null Filter, volle Energie.',
  vibes: ['SUM 41 & Blink-182 Vibes', 'Pop-Punk / Skate-Punk', 'Hip-Hop-Wurzeln'],
  stages: ['Open Flair', 'ASTA Sommerfestival', 'Rock im Pott', 'Main-Support für Schmutzki', 'Vom VBT in den Moshpit'],
  album: 'Das ist der Plan',
  label: 'Hamburg Records',
  features: ['Jack Pott', 'Bluthund', 'DuZoe', 'Peat & Pessi'],
  spotify: 'https://open.spotify.com/embed/artist/798bbZOe4VTHtiKT7rwQvi',
};

const DJS = [
  { name: 'Justyn Maxx', img: '/festival/justyn-maxx-1.webp', time: '22:00' },
  { name: 'Vio Leen', img: '/festival/vio-leen-1.webp', time: '00:00' },
];

// Support: trage hier die Spotify-URLs ein.
//   embed = Embed-URL (https://open.spotify.com/embed/artist/XXXX oder /playlist/XXXX)
//           -> zeigt den grünen Spotify-Player direkt auf der Karte.
//   link  = normale Spotify-URL für den "Auf Spotify hören"-Button (Fallback).
// Beide leer -> es erscheint ein dezenter Platzhalter.
const SUPPORT = [
  {
    name: 'Mudfight',
    img: '/festival/mudfight-1.webp',
    embed: 'https://open.spotify.com/embed/artist/3H2BQW1ziznCjwQxqv7u2b',
    link: 'https://open.spotify.com/artist/3H2BQW1ziznCjwQxqv7u2b',
  },
  {
    name: 'Loraaas',
    img: '/festival/loraaas-1.webp',
    embed: 'https://open.spotify.com/embed/artist/2XfxvX8wNkjEw3pwQXzfrB',
    link: 'https://open.spotify.com/artist/2XfxvX8wNkjEw3pwQXzfrB',
  },
];

const scrollToTickets = () =>
  document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const STYLES = `
  /* ---- Kapitel-Header ---- */
  .lu-chap { display:flex; align-items:center; gap:12px; margin-bottom:24px; }
  .lu-chap .bar { width:34px; height:3px; border-radius:2px; }
  .lu-chap .eye {
    font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:11px;
    letter-spacing:.28em; text-transform:uppercase;
  }
  .lu-chap h3 {
    font-family:'Bebas Neue',sans-serif; letter-spacing:.04em; text-transform:uppercase;
    font-size:clamp(30px,5vw,50px); color:#fff; line-height:.9;
  }

  /* Foto immer vollständig sichtbar: contain in 4:5-Box */
  .lu-photo { aspect-ratio:4/5; border-radius:12px; overflow:hidden; background:#05090c;
    display:flex; align-items:center; justify-content:center; }
  .lu-photo img { width:100%; height:100%; object-fit:contain; display:block; }

  /* ---- Stand-Up: kompakte Act-Karte ---- */
  .lu-act { display:grid; grid-template-columns:184px 1fr; gap:22px; padding:18px;
    border-radius:18px; background:rgba(0,200,200,.05); border:1px solid rgba(0,212,212,.16);
    align-items:center; transition:border-color .2s, transform .2s; }
  .lu-act:hover { border-color:rgba(0,212,212,.34); transform:translateY(-2px); }
  @media (max-width:640px){ .lu-act { grid-template-columns:1fr; } .lu-act .lu-photo{ max-width:280px; } }
  .lu-act .eyebrow { display:flex; align-items:center; gap:10px; margin-bottom:6px; flex-wrap:wrap; }
  .lu-tag { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:10px;
    letter-spacing:.16em; text-transform:uppercase; color:${ORANGE};
    border:1px solid ${ORANGE}66; border-radius:999px; padding:3px 9px; }
  .lu-time { font-family:'Inter',sans-serif; font-size:11px; letter-spacing:.08em; color:rgba(255,200,160,.6); }
  .lu-name { font-family:'Bebas Neue',sans-serif; letter-spacing:.03em; text-transform:uppercase;
    font-size:30px; color:#fff; line-height:1; margin-bottom:8px; }
  .lu-hook { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-style:italic;
    font-size:16px; color:rgba(255,255,255,.86); line-height:1.35; margin-bottom:12px; max-width:560px; }
  .lu-lbl { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:10px;
    letter-spacing:.18em; text-transform:uppercase; color:rgba(160,230,230,.45); margin:10px 0 7px; }
  .lu-chips { display:flex; flex-wrap:wrap; gap:7px; }
  .lu-chip { font-family:'Inter',sans-serif; font-size:12px; font-weight:600; padding:5px 11px;
    border-radius:999px; background:rgba(240,120,32,.08); border:1px solid ${ORANGE}3a; color:rgba(255,210,175,.92); }
  .lu-pf { font-family:'Inter',sans-serif; font-size:11.5px; font-weight:600; padding:5px 10px;
    border-radius:8px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1); color:rgba(220,235,235,.8); }
  .lu-pf::before { content:"★ "; color:${ORANGE}; }

  /* ---- Zirkel: Headliner-Block ---- */
  .lu-hero { position:relative; border-radius:24px; overflow:hidden;
    background:linear-gradient(135deg, rgba(0,212,212,.09), rgba(30,144,212,.06));
    border:1px solid rgba(0,212,212,.22); box-shadow:0 8px 60px rgba(0,0,0,.5),0 0 60px rgba(0,180,180,.06); }
  .lu-hero .topbar { position:absolute; inset-inline:0; top:0; height:3px;
    background:linear-gradient(to right,transparent,${CY},${BLUE},transparent); }
  .lu-hero .grid { display:grid; grid-template-columns:minmax(0,300px) 1fr; gap:26px; padding:26px; align-items:center; }
  @media (max-width:760px){ .lu-hero .grid { grid-template-columns:1fr; } .lu-hero .lu-photo{ max-width:320px; } }
  .lu-hero .eyebrow { display:flex; align-items:center; gap:10px; margin-bottom:12px; flex-wrap:wrap; }
  .lu-badge { font-family:'Bebas Neue',sans-serif; font-size:12px; letter-spacing:.2em; padding:5px 12px;
    border-radius:5px; background:${CY}; color:#040c0c; font-weight:700; }
  .lu-headliner { font-family:'Inter',sans-serif; font-size:11px; font-weight:700; letter-spacing:.22em;
    text-transform:uppercase; color:${CY}; }
  .lu-hero h3 { font-family:'Bebas Neue',sans-serif; letter-spacing:.03em; text-transform:uppercase;
    font-size:clamp(40px,6vw,64px); line-height:.9; color:#fff; margin-bottom:10px; }
  .lu-hero .hook { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-style:italic;
    font-size:clamp(16px,2.2vw,20px); color:rgba(255,255,255,.9); line-height:1.35; margin-bottom:16px; max-width:520px; }
  .lu-vibe { font-family:'Inter',sans-serif; font-size:12.5px; font-weight:600; padding:7px 13px; border-radius:999px;
    background:rgba(0,212,212,.08); border:1px solid rgba(0,212,212,.28); color:rgba(190,240,240,.9); }
  .lu-vibe.hot { background:rgba(240,120,32,.1); border-color:${ORANGE}59; color:#ffb27a; }
  .lu-cyf { font-family:'Inter',sans-serif; font-size:12px; font-weight:600; padding:6px 12px; border-radius:8px;
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1); color:rgba(220,235,235,.8); }
  .lu-cyf.star::before { content:"★ "; color:${CY}; }
  .lu-album { display:flex; gap:14px; align-items:flex-start; padding:15px 17px; border-radius:16px;
    background:rgba(30,144,212,.07); border:1px solid rgba(30,144,212,.25); margin:18px 0 22px; }
  .lu-album .ic { width:38px; height:38px; border-radius:10px; flex:none; display:flex; align-items:center;
    justify-content:center; background:rgba(30,144,212,.15); border:1px solid rgba(30,144,212,.35); font-size:18px; }
  .lu-album .t { font-family:'Inter',sans-serif; font-size:10px; font-weight:700; letter-spacing:.2em;
    text-transform:uppercase; color:rgba(120,190,255,.8); margin-bottom:3px; }
  .lu-album .n { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:.02em; color:#fff; line-height:1; }
  .lu-album .feat { font-family:'Inter',sans-serif; font-size:12.5px; color:rgba(180,215,235,.7); margin-top:6px; line-height:1.5; }
  .lu-album .feat b { color:#fff; font-weight:600; }
  .lu-cta { display:inline-flex; align-items:center; gap:10px; padding:14px 24px; border-radius:14px;
    background:linear-gradient(135deg,${CY},${BLUE}); color:#080c10; font-family:'Bebas Neue',sans-serif;
    font-size:18px; letter-spacing:.14em; font-weight:700; border:none; cursor:pointer;
    box-shadow:0 4px 28px rgba(0,212,212,.35); }
  .lu-metaline { font-family:'Inter',sans-serif; font-size:13px; color:rgba(160,230,230,.5); }

  /* ---- DJ / Support Karten ---- */
  .lu-mini { position:relative; border-radius:16px; overflow:hidden;
    background:rgba(0,200,200,.04); border:1px solid rgba(255,255,255,.08); transition:transform .2s, border-color .2s; }
  .lu-mini:hover { transform:translateY(-3px); }
  .lu-mini .cap { padding:14px 16px; }
  .lu-mini .cn { font-family:'Bebas Neue',sans-serif; letter-spacing:.03em; text-transform:uppercase;
    font-size:24px; color:#fff; line-height:1; }
  .lu-mini .ct { font-family:'Inter',sans-serif; font-size:12px; letter-spacing:.08em; margin-top:4px; }
  .lu-spotbtn { display:inline-flex; align-items:center; gap:8px; margin-top:10px; padding:9px 15px;
    border-radius:999px; font-family:'Inter',sans-serif; font-size:13px; font-weight:700; text-decoration:none;
    background:${GREEN}; color:#04120a; }
  .lu-spotph { margin-top:10px; font-family:'Inter',sans-serif; font-size:12px; color:rgba(150,230,180,.7);
    border:1px dashed ${GREEN}66; border-radius:10px; padding:9px 12px; background:rgba(30,215,96,.05); }
`;

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
};

function ChapterHead({ color, eyebrow, title }: { color: string; eyebrow: string; title: string }) {
  return (
    <div className="lu-chap">
      <span className="bar" style={{ background: color, boxShadow: `0 0 12px ${color}88` }} />
      <div>
        <div className="eye" style={{ color }}>{eyebrow}</div>
        <h3>{title}</h3>
      </div>
    </div>
  );
}

function BuyBar({ color, label, note, onClick }: { color: string; label: string; note?: string; onClick: () => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginTop: 22 }}>
      <button
        onClick={onClick}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 26px', borderRadius: 14,
          background: `linear-gradient(135deg, ${color}, ${color}bb)`, color: '#080c10',
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: '0.14em', fontWeight: 700,
          border: 'none', cursor: 'pointer', boxShadow: `0 4px 24px ${color}44`,
        }}
      >
        {label}
      </button>
      {note && <span className="lu-metaline">{note}</span>}
    </div>
  );
}

function StandupCard({ act, index }: { act: Standup; index: number }) {
  const hasInfo = Boolean(act.hook);
  return (
    <motion.div {...fade} transition={{ duration: 0.45, delay: index * 0.05 }} className="lu-act">
      <div className="lu-photo">
        <img src={act.img} alt={act.name} loading="lazy" />
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="eyebrow">
          <span className="lu-tag">Stand-Up</span>
          <span className="lu-time">22.08. · 16:30 Uhr</span>
        </div>
        <div className="lu-name">{act.name}</div>
        {hasInfo ? (
          <>
            <p className="lu-hook">{act.hook}</p>
            {act.themes && act.themes.length > 0 && (
              <>
                <div className="lu-lbl">Themen</div>
                <div className="lu-chips">
                  {act.themes.map((t) => <span key={t} className="lu-chip">{t}</span>)}
                </div>
              </>
            )}
            {act.stages && act.stages.length > 0 && (
              <>
                <div className="lu-lbl">Bekannt von</div>
                <div className="lu-chips">
                  {act.stages.map((s) => <span key={s} className="lu-pf">{s}</span>)}
                </div>
              </>
            )}
          </>
        ) : (
          <p className="lu-hook" style={{ opacity: 0.7 }}>Live auf der Harmony-Bühne.</p>
        )}
      </div>
    </motion.div>
  );
}

function ZirkelBlock({ onBuy }: { onBuy: () => void }) {
  const z = ZIRKEL;
  return (
    <motion.div {...fade} transition={{ duration: 0.55 }} className="lu-hero">
      <div className="topbar" />
      <div className="grid">
        <div className="lu-photo">
          <img src={z.img} alt={z.name} loading="lazy" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">
            <span className="lu-badge">HEADLINER</span>
            <span className="lu-headliner">Der Hauptact des Abends</span>
          </div>
          <h3>Zirkel<span style={{ color: CY }}>.WTF</span></h3>
          <p className="hook">{z.hook}</p>

          <div className="lu-chips" style={{ marginBottom: 18 }}>
            {z.vibes.map((v, i) => (
              <span key={v} className={`lu-vibe ${i === 0 ? 'hot' : ''}`}>{v}</span>
            ))}
          </div>

          <div className="lu-lbl">Live gespielt bei</div>
          <div className="lu-chips">
            {z.stages.map((s, i) => (
              <span key={s} className={`lu-cyf ${i < 3 ? 'star' : ''}`}>{s}</span>
            ))}
          </div>

          <div className="lu-album">
            <div className="ic">💿</div>
            <div>
              <div className="t">Neues Album · {z.label}</div>
              <div className="n">„{z.album}"</div>
              <div className="feat">
                Tracks mit{' '}
                {z.features.map((f, i) => (
                  <span key={f}><b>{f}</b>{i < z.features.length - 1 ? ', ' : ''}</span>
                ))}
              </div>
            </div>
          </div>

          {z.spotify && (
            <iframe
              title="Zirkel.WTF auf Spotify"
              src={z.spotify}
              width="100%"
              height="152"
              style={{ border: 0, borderRadius: 12, marginBottom: 20 }}
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            />
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
            <button className="lu-cta" onClick={onBuy}>🎟 Konzert-Ticket · 17,50 €</button>
            <span className="lu-metaline">oder im Bundle ab 39,99 € — mit Stand-Up, DJ &amp; Freigetränk</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DJCard({ dj, index }: { dj: { name: string; img: string; time: string }; index: number }) {
  return (
    <motion.div {...fade} transition={{ duration: 0.45, delay: index * 0.08 }} className="lu-mini">
      <div className="lu-photo" style={{ borderRadius: '16px 16px 0 0' }}>
        <img src={dj.img} alt={dj.name} loading="lazy" />
      </div>
      <div className="cap">
        <div className="cn">{dj.name}</div>
        <div className="ct" style={{ color: `${BLUE}cc` }}>22.08. · {dj.time} Uhr</div>
      </div>
    </motion.div>
  );
}

function SupportCard({ act, index }: { act: { name: string; img: string; embed: string; link: string }; index: number }) {
  return (
    <motion.div {...fade} transition={{ duration: 0.45, delay: index * 0.08 }} className="lu-mini">
      <div className="lu-photo" style={{ borderRadius: '16px 16px 0 0' }}>
        <img src={act.img} alt={act.name} loading="lazy" />
      </div>
      <div className="cap">
        <div className="cn">{act.name}</div>
        <div className="ct" style={{ color: `${GREEN}cc` }}>Support · Musik via Spotify</div>
        {act.embed ? (
          <iframe
            title={`${act.name} auf Spotify`}
            src={act.embed}
            width="100%"
            height="152"
            style={{ border: 0, borderRadius: 12, marginTop: 12 }}
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
        ) : act.link ? (
          <a className="lu-spotbtn" href={act.link} target="_blank" rel="noopener noreferrer">▶ Auf Spotify hören</a>
        ) : (
          <div className="lu-spotph">▶ Spotify-Link folgt</div>
        )}
      </div>
    </motion.div>
  );
}

function BierpongBlock({ onBuy }: { onBuy: () => void }) {
  const tiles = [
    { icon: '🍺', title: '2 Bier zum Start', text: 'Jedes Team bekommt zum Start zwei Bier gratis.' },
    { icon: '🏆', title: 'Ganzer Abend frei', text: 'Das Sieger-Team trinkt den ganzen Abend gratis.' },
    { icon: '⏳', title: 'Plätze limitiert', text: 'Nur eine feste Zahl an Team-Startplätzen.' },
    { icon: '⚡', title: 'Sei schnell', text: 'Ist voll, ist voll — first come, first serve.' },
  ];
  return (
    <motion.div
      {...fade}
      transition={{ duration: 0.5 }}
      style={{
        position: 'relative', borderRadius: 24, overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(200,232,64,.10), rgba(8,12,16,.6))',
        border: `1px solid ${LIME}44`, boxShadow: `0 8px 60px rgba(0,0,0,.5), 0 0 60px rgba(200,232,64,.06)`,
      }}
    >
      <div style={{ position: 'absolute', insetInline: 0, top: 0, height: 3, background: `linear-gradient(to right, transparent, ${LIME}, transparent)` }} />
      <div style={{ padding: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, letterSpacing: '.2em', padding: '5px 12px', borderRadius: 5, background: LIME, color: '#0c1004', fontWeight: 700 }}>
            ⚡ LIMITIERT
          </span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: LIME }}>
            Nur solange Plätze frei sind
          </span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, color: '#fff', background: 'rgba(200,232,64,.12)', border: `1px solid ${LIME}44`, borderRadius: 999, padding: '4px 11px' }}>
            10 € / Team · nur 5 € p. P.
          </span>
        </div>

        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontStyle: 'italic', fontSize: 'clamp(18px, 2.6vw, 24px)', color: 'rgba(255,255,255,.92)', lineHeight: 1.3, marginBottom: 20, maxWidth: 620 }}>
          Schlag dich durchs Turnier — und wenn ihr gewinnt, trinkt ihr den{' '}
          <span style={{ color: LIME }}>ganzen Abend gratis</span>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 22 }}>
          {tiles.map((t) => (
            <div key={t.title} style={{ borderRadius: 14, padding: '14px 16px', background: 'rgba(200,232,64,.05)', border: `1px solid ${LIME}33` }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{t.icon}</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, letterSpacing: '.03em', color: '#fff', lineHeight: 1.05, marginBottom: 4 }}>{t.title}</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: 'rgba(210,225,180,.7)', lineHeight: 1.5 }}>{t.text}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
          <button
            onClick={onBuy}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 26px', borderRadius: 14,
              background: `linear-gradient(135deg, ${LIME}, ${LIME}bb)`, color: '#0c1004',
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: '.14em', fontWeight: 700,
              border: 'none', cursor: 'pointer', boxShadow: `0 4px 24px ${LIME}44`,
            }}
          >
            🍺 Team-Platz sichern · 10 € (5 € p. P.)
          </button>
          <span className="lu-metaline">Ein Ticket = ein 2er-Team (2 Personen). Zuschauen &amp; feiern ist für alle gratis.</span>
        </div>
      </div>
    </motion.div>
  );
}

type LineupProps = {
  // Wird mit der Ticket-ID aufgerufen ('standup' | 'concert' | 'dj').
  // In HarmonyFestivalPage an den bestehenden Kauf-Flow hängen (siehe Hinweis).
  onBuy?: (ticketId: string) => void;
};

export default function LineupSection({ onBuy }: LineupProps) {
  // Fallback: falls kein onBuy übergeben wird, scrolle zur Ticket-Sektion.
  const buy = (id: string) => (onBuy ? onBuy(id) : scrollToTickets());

  return (
    <section id="comedy" className="pt-4">
      <style>{STYLES}</style>

      {/* Sektions-Intro */}
      <motion.div {...fade} transition={{ duration: 0.6 }} className="mb-10">
        <div className="tag-label mb-3">Das komplette Line-Up · 22.08.2026</div>
        <h2 className="graffiti" style={{ fontSize: 'clamp(42px, 7vw, 78px)', color: '#fff', lineHeight: 0.9 }}>
          Wer spielt <span style={{ color: CY, textShadow: `0 0 40px ${CY}55` }}>wann</span>
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(160,230,230,0.5)', marginTop: '14px', lineHeight: 1.7, maxWidth: '540px' }}>
          Ein Abend, vier Bereiche – von Stand-Up über den Headliner bis zu den DJs. In Running-Order von 16:30 bis in den Morgen.
        </p>
      </motion.div>

      {/* 1 — STAND-UP */}
      <ChapterHead color={ORANGE} eyebrow="Stand-Up Comedy · 16:30 Uhr" title="Sechs Acts, eine Bühne" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {STANDUP.map((act, i) => <StandupCard key={act.name} act={act} index={i} />)}
      </div>
      <BuyBar color={ORANGE} label="🎟 Stand-Up-Ticket · 17,50 €" note="Sechs Acts, ein Ticket" onClick={() => buy('standup')} />

      <div className="divider" />

      {/* 2 — BIERPONG */}
      <ChapterHead color={LIME} eyebrow="Bierpong-Turnier · 18:00 Uhr" title="Gewinnen = frei trinken" />
      <BierpongBlock onBuy={() => buy('bierpong')} />

      <div className="divider" />

      {/* 3 — ZIRKEL */}
      <ChapterHead color={CY} eyebrow="Live-Konzert · 20:30 Uhr" title="Der Headliner" />
      <ZirkelBlock onBuy={() => buy('concert')} />

      <div className="divider" />

      {/* 4 — DJs */}
      <ChapterHead color={BLUE} eyebrow="DJ-Sets · ab 22:00 Uhr" title="Bis in den Morgen" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {DJS.map((dj, i) => <DJCard key={dj.name} dj={dj} index={i} />)}
      </div>
      <BuyBar color={BLUE} label="🎟 DJ-Ticket · 8,50 €" note="House & Techno bis 02:00" onClick={() => buy('dj')} />

      <div className="divider" />

      {/* 5 — SUPPORT */}
      <ChapterHead color={GREEN} eyebrow="Support · Musik via Spotify" title="Auf die Ohren" />
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(160,230,230,0.5)', margin: '-8px 0 18px', lineHeight: 1.6, maxWidth: '540px' }}>
        Kein Live-Slot – aber ihre Songs laufen über den Abend. Reinhören lohnt sich.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {SUPPORT.map((act, i) => <SupportCard key={act.name} act={act} index={i} />)}
      </div>
    </section>
  );
}