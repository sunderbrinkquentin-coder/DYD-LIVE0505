// src/components/festival/LineupSection.tsx
//
// Stand-Up Comedy Line-Up – innovative Sektion für die Harmony-Festivalpage.
// An das bestehende Design-System angepasst: Cyan/Graffiti auf transparentem
// Hintergrund (die globale GraffitiCanvas scheint durch), tag-label + graffiti
// Headings, framer-motion Entrance wie die übrigen Sektionen.
//
// Interaktion (der innovative Kern):
//   - Karten neigen sich beim Hover 3D zum Cursor (Tilt).
//   - Acts mit zwei Motiven flippen beim Hover (Desktop) bzw. Tap (Mobile)
//     auf das zweite Motiv (rotateY).
//   - Ein dezenter Cyan-Spotlight folgt der Maus über das Grid.
//
// Bilder liegen in public/festival/ und werden per absolutem Pfad referenziert
// (gleiche Konvention wie der Rest der Page, z. B. "/Stand-Up_LineUp.png").

import { useRef, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';

const CY = '#00d4d4';

type Act = {
  name: string;
  role: string;
  front: string;
  back?: string; // zweites Motiv -> aktiviert den Flip
};

// Alle sechs Solo-Comedians (Reihenfolge frei anpassbar).
const ACTS: Act[] = [
  { name: 'Alex Graf',     role: 'Stand-Up', front: '/festival/alex-graf-1.webp' },
  { name: 'Larissa Magnus', role: 'Stand-Up', front: '/festival/larissa-magnus-1.webp', back: '/festival/larissa-magnus-2.webp' },
  { name: 'Julian Deters', role: 'Stand-Up', front: '/festival/julian-1.webp',       back: '/festival/julian-2.webp' },
  { name: 'Jahn Boie',     role: 'Stand-Up', front: '/festival/jahn-1.webp',         back: '/festival/jahn-2.webp' },
  { name: 'Kevin Küster',  role: 'Stand-Up', front: '/festival/kevin-kuester-1.webp', back: '/festival/kevin-kuester-2.webp' },
  { name: 'Leon Blokesch', role: 'Stand-Up', front: '/festival/leon-1.webp',         back: '/festival/leon-2.webp' },
];

function ActCard({ act, index }: { act: Act; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, lift: 0 });

  const hasBack = Boolean(act.back);

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: px * 12, y: -py * 12, lift: -8 });
  };

  const reset = () => {
    setTilt({ x: 0, y: 0, lift: 0 });
    setFlipped(false);
  };

  const base = flipped ? 180 : 0;
  const cardStyle: CSSProperties = {
    transform: `rotateY(${base + tilt.x}deg) rotateX(${tilt.y}deg) translateY(${tilt.lift}px)`,
    transformStyle: 'preserve-3d',
    transition: 'transform 0.5s cubic-bezier(.2,.7,.2,1)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
    >
      <div
        ref={ref}
        className="group relative cursor-pointer rounded-2xl"
        style={{ aspectRatio: '4 / 5', ...cardStyle }}
        onMouseEnter={() => hasBack && setFlipped(true)}
        onMouseLeave={reset}
        onMouseMove={handleMove}
        onClick={() => hasBack && setFlipped((f) => !f)}
      >
        {/* Cyan-Halo beim Hover */}
        <div
          className="pointer-events-none absolute -inset-0.5 rounded-[18px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: `0 0 0 1.5px ${CY}b0, 0 0 34px 4px ${CY}45` }}
        />

        {/* Vorderseite */}
        <div
          className="absolute inset-0 overflow-hidden rounded-2xl"
          style={{ backfaceVisibility: 'hidden', boxShadow: '0 16px 44px rgba(0,0,0,.5), inset 0 0 0 1px rgba(0,212,212,.1)' }}
        >
          <img src={act.front} alt={act.name} loading="lazy" className="h-full w-full object-cover" />
        </div>

        {/* Rückseite (zweites Motiv) */}
        {hasBack && (
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              boxShadow: '0 16px 44px rgba(0,0,0,.5), inset 0 0 0 1px rgba(0,212,212,.1)',
            }}
          >
            <img src={act.back} alt={`${act.name} – zweites Motiv`} loading="lazy" className="h-full w-full object-cover" />
          </div>
        )}

        {/* Rollen-Tag oben links */}
        <span
          className="absolute left-3 top-3 z-10 rounded-full px-2.5 py-1"
          style={{
            background: 'rgba(8,12,16,.72)',
            border: `1px solid ${CY}55`,
            color: CY,
            backdropFilter: 'blur(4px)',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: '10px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          {act.role}
        </span>

        {/* Name unten */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 rounded-b-2xl px-4 pb-4 pt-10"
          style={{ background: 'linear-gradient(transparent, rgba(4,10,14,.94))', backfaceVisibility: 'hidden' }}
        >
          <div className="graffiti" style={{ fontSize: '24px', color: '#fff', lineHeight: 1 }}>{act.name}</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', letterSpacing: '0.14em', color: `${CY}cc`, marginTop: '4px', textTransform: 'uppercase' }}>
            22.08. · 16:30 Uhr
          </div>
        </div>

        {/* Hinweis auf zweites Motiv */}
        {hasBack && (
          <div
            className="absolute bottom-3.5 right-3 z-10"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: `${CY}aa` }}
          >
            2 Motive ↻
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function LineupSection() {
  const gridRef = useRef<HTMLDivElement>(null);

  const handleGridMove = (e: React.MouseEvent) => {
    const el = gridRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--sx', `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty('--sy', `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <section id="comedy" className="pt-4">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        <div className="tag-label mb-3">Stand-Up Comedy · 16:30 Uhr</div>
        <h2 className="graffiti" style={{ fontSize: 'clamp(42px, 7vw, 78px)', color: '#fff', lineHeight: 0.9 }}>
          Das <span style={{ color: CY, textShadow: `0 0 40px ${CY}55` }}>Line-Up</span>
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(160,230,230,0.5)', marginTop: '14px', lineHeight: 1.7, maxWidth: '520px' }}>
          Sechs Newcomer aus der lokalen Szene – frisch, direkt, ehrlich. Fahr mit der Maus über die Acts (oder tippe am Handy) und dreh die Karte auf ihr zweites Motiv.
        </p>
      </motion.div>

      <div
        ref={gridRef}
        onMouseMove={handleGridMove}
        className="relative grid gap-5"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', perspective: '1400px' }}
      >
        {/* dezenter Cyan-Spotlight, folgt der Maus */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{ background: `radial-gradient(circle at var(--sx,50%) var(--sy,40%), ${CY}12, transparent 26%)` }}
        />
        {ACTS.map((act, i) => (
          <ActCard key={act.name} act={act} index={i} />
        ))}
      </div>
    </section>
  );
}