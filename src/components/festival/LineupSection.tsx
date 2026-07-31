// src/components/festival/LineupSection.tsx
//
// Stand-Up Comedy Line-Up – Sektion für die Harmony-Festivalpage.
// Design-System-konform (Cyan/Graffiti auf transparentem Hintergrund).
//
// Interaktion:
//   - Desktop: Hover vergrößert die Karte (gut lesbar) und flippt sie – wenn
//     ein zweites Motiv existiert – auf ebendieses. Reines CSS-:hover, damit
//     nichts "hängt" (kein per-Frame-JS-Transform mehr).
//   - Mobile/Touch: Tap flippt die Karte (per @media (hover:none) getrennt).
//
// Bilder liegen in public/festival/ und werden per absolutem Pfad referenziert.

import { useState } from 'react';
import { motion } from 'framer-motion';

const CY = '#00d4d4';

type Act = {
  name: string;
  role: string;
  front: string;
  back?: string; // zweites Motiv -> aktiviert den Flip
};

const ACTS: Act[] = [
  { name: 'Alex Graf',     role: 'Stand-Up', front: '/festival/alex-graf-1.webp' },
  { name: 'Larissa Magnus', role: 'Stand-Up', front: '/festival/larissa-magnus-1.webp', back: '/festival/larissa-magnus-2.webp' },
  { name: 'Julian Deters', role: 'Stand-Up', front: '/festival/julian-1.webp',       back: '/festival/julian-2.webp' },
  { name: 'Jahn Boie',     role: 'Stand-Up', front: '/festival/jahn-1.webp',         back: '/festival/jahn-2.webp' },
  { name: 'Kevin Küster',  role: 'Stand-Up', front: '/festival/kevin-kuester-1.webp', back: '/festival/kevin-kuester-2.webp' },
  { name: 'Leon Blokesch', role: 'Stand-Up', front: '/festival/leon-1.webp',         back: '/festival/leon-2.webp' },
];

// Scoped CSS: 3D-Flip + Hover-Zoom. Klassen mit lu-Präfix, um Kollisionen zu vermeiden.
const STYLES = `
  .lu-card {
    position: relative;
    aspect-ratio: 4 / 5;
    border-radius: 16px;
    perspective: 1200px;
    z-index: 1;
    cursor: pointer;
    transition: z-index 0s;
  }
  .lu-scale {
    position: absolute;
    inset: 0;
    border-radius: 16px;
    transform-style: preserve-3d;
    transition: transform .4s cubic-bezier(.2,.7,.2,1);
    will-change: transform;
  }
  .lu-inner {
    position: absolute;
    inset: 0;
    border-radius: 16px;
    transform-style: preserve-3d;
    transition: transform .55s cubic-bezier(.2,.7,.2,1);
    will-change: transform;
  }
  .lu-face {
    position: absolute;
    inset: 0;
    border-radius: 16px;
    overflow: hidden;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    box-shadow: 0 16px 44px rgba(0,0,0,.5), inset 0 0 0 1px rgba(0,212,212,.1);
  }
  .lu-face img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .lu-back { transform: rotateY(180deg); }
  .lu-halo {
    position: absolute; inset: -2px; border-radius: 18px; pointer-events: none;
    opacity: 0; transition: opacity .3s;
    box-shadow: 0 0 0 1.5px ${CY}b0, 0 0 34px 4px ${CY}45;
  }
  .lu-tag {
    position: absolute; left: 12px; top: 12px; z-index: 4;
    background: rgba(8,12,16,.72); border: 1px solid ${CY}55; color: ${CY};
    backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
    padding: 5px 10px; border-radius: 999px;
    font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
    font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
  }
  .lu-hint {
    position: absolute; right: 12px; bottom: 12px; z-index: 4;
    font-family: 'Inter', sans-serif; font-size: 11px; color: ${CY}aa;
  }

  /* ---- Desktop: Hover vergrößert + flippt ---- */
  @media (hover: hover) {
    .lu-card:hover { z-index: 30; }
    .lu-card:hover .lu-scale { transform: translateY(-8px) scale(1.2); }
    .lu-card:hover .lu-halo { opacity: 1; }
    .lu-card.lu-has-back:hover .lu-inner { transform: rotateY(180deg); }
  }

  /* ---- Touch: Tap flippt ---- */
  @media (hover: none) {
    .lu-card.lu-has-back.lu-flipped .lu-inner { transform: rotateY(180deg); }
    .lu-card.lu-flipped .lu-halo { opacity: 1; }
  }
`;

function ActCard({ act, index }: { act: Act; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const hasBack = Boolean(act.back);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      className={`lu-card ${hasBack ? 'lu-has-back' : ''} ${flipped ? 'lu-flipped' : ''}`}
      onClick={() => hasBack && setFlipped((f) => !f)}
    >
      <div className="lu-halo" />
      <div className="lu-scale">
        <div className="lu-inner">
          {/* Vorderseite */}
          <div className="lu-face lu-front">
            <img src={act.front} alt={act.name} loading="lazy" />
            <span className="lu-tag">{act.role}</span>
            {hasBack && <div className="lu-hint">2 Motive ↻</div>}
          </div>
          {/* Rückseite (zweites Motiv) */}
          {hasBack && (
            <div className="lu-face lu-back">
              <img src={act.back} alt={`${act.name} – zweites Motiv`} loading="lazy" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function LineupSection() {
  return (
    <section id="comedy" className="pt-4">
      <style>{STYLES}</style>

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
          Sechs Newcomer aus der lokalen Szene – frisch, direkt, ehrlich. Fahr mit der Maus über einen Act (oder tippe am Handy), um ihn groß zu sehen und auf sein zweites Motiv zu drehen.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
        {ACTS.map((act, i) => (
          <ActCard key={act.name} act={act} index={i} />
        ))}
      </div>
    </section>
  );
}