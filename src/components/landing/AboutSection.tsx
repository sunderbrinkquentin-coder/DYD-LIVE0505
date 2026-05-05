import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CARDS = [
  {
    number: '01',
    tag: 'EXPERTISE',
    emoji: '🎓',
    accent: '#30E3CA',
    accentRgb: '48,227,202',
    headline: 'Gebaut aus\nEigenantrieb.',
    items: [
      { label: 'Founder', text: 'Decide Your Dream (DYD) & Harmony.' },
      { label: '9 Jahre', text: 'Abendschule — Fachabi, Wirtschaftsfachwirt, Ernährungsberater B & C.' },
      { label: 'Stipendiat', text: 'Seit 6 Jahren SBB-gefördert für Spitzenleistung im beruflichen Bildungsweg.' },
      { label: '4,5 Jahre', text: 'Personaldienstleistung — von Recruiting bis Beratung: Echte Menschen, echte Entscheidungen.' },
      { label: 'Thesis', text: 'Bachelor Wirtschaftsingenieurwesen — Digital Engineering & Management.' },
    ],
  },
  {
    number: '02',
    tag: 'MISSION',
    emoji: '🌍',
    accent: '#66c0b6',
    accentRgb: '102,192,182',
    headline: 'Nicht warten.\nMachen.',
    intro: 'Echte Verbindung scheitert oft an Filtern — egal ob im Recruiting oder in unseren Köpfen.',
    items: [
      { label: 'Problem', text: 'Frustration durch ungerechte ATS-Systeme und hohe Absolventenarbeitslosigkeit.' },
      { label: 'Lösung', text: 'Ehrliche Konzepte statt intransparenter Abomodelle.' },
      { label: 'Haltung', text: 'Einsatz gegen gesellschaftliche Zerrissenheit und Rechtsdruck.' },
      { label: 'Harmony', text: 'Inspiriert von Jamaika — ein Ort, an dem Menschen ungeachtet ihrer Herkunft zusammenkommen.' },
      { label: 'Ziel', text: 'Transparenz und Brücken für Talente schaffen.' },
    ],
  },
  {
    number: '03',
    tag: 'PERSONAL',
    emoji: '⚡',
    accent: '#4dd4c8',
    accentRgb: '77,212,200',
    headline: 'Mensch\nzuerst.',
    items: [
      { label: 'Eckdaten', text: '26 Jahre | Düsseldorf & Fürth — Pendler zwischen Rheinland und Franken.' },
      { label: 'Morgen', text: 'Frühaufsteher aus Überzeugung: Mein Tag beginnt grundsätzlich im Gym.' },
      { label: 'Kaffee', text: 'Kein Genussmittel — sondern die überlebenswichtige Infrastruktur.' },
      { label: 'Ausgleich', text: 'Wenn der Laptop zugeht, brauche ich den harten Cut — Tennisplatz, Fußball oder Gym.' },
      { label: 'Mindset', text: 'Disziplin im Sport gibt mir die mentale Ruhe für das Business.' },
    ],
  },
] as const;

type Direction = 1 | -1;
type CardIndex = 0 | 1 | 2;

function GridLines({ accent }: { accent: string }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.06]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="cgrid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke={accent} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cgrid)" />
    </svg>
  );
}

export function AboutSection() {
  const [index, setIndex] = useState<CardIndex>(0);
  const [direction, setDirection] = useState<Direction>(1);
  const dragStartX = useRef(0);

  const current = CARDS[index];
  const prevIdx = ((index - 1 + CARDS.length) % CARDS.length) as CardIndex;
  const nextIdx = ((index + 1) % CARDS.length) as CardIndex;
  const prev = CARDS[prevIdx];
  const next = CARDS[nextIdx];

  const navigate = (dir: Direction) => {
    setDirection(dir);
    setIndex(((index + dir + CARDS.length) % CARDS.length) as CardIndex);
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -50) navigate(1);
    else if (info.offset.x > 50) navigate(-1);
  };

  return (
    <section
      id="about"
      className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#66c0b6]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#30E3CA]/4 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Section pill */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#66c0b6]/20 to-[#30E3CA]/20 border border-[#66c0b6]/40 text-[#66c0b6] text-xs font-semibold tracking-widest uppercase">
            Über mich
          </span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-start">

          {/* ── LEFT photo ── */}
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-full lg:hidden">
              <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
                Wer steckt{' '}
                <span className="bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] bg-clip-text text-transparent">
                  hinter DYD?
                </span>
              </h2>
              <p className="mt-2 text-white/40 text-sm">Drei Perspektiven. Ein Antrieb.</p>
            </div>

            <div className="relative w-full max-w-sm mx-auto">
              <div className="absolute -inset-1 rounded-3xl opacity-45 blur-2xl z-0"
                style={{ background: 'linear-gradient(135deg, #66c0b6 0%, #30E3CA 100%)' }} />
              <div className="relative z-10 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src="/Design_ohne_Titel.png"
                  alt="Quentin – Founder DYD"
                  className="w-full object-cover"
                  style={{
                    objectPosition: 'center top',
                    height: '520px',
                  }}
                />
              </div>
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#66c0b6] rounded-tl-2xl z-20" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#30E3CA] rounded-tr-2xl z-20" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#30E3CA] rounded-bl-2xl z-20" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#66c0b6] rounded-br-2xl z-20" />
              <div className="text-center pt-3">
                <p className="text-white font-bold text-xl leading-tight">Quentin</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: '#66c0b6' }}>
                  Founder · DYD &amp; Harmony Festival
                </p>
                <a
                  href="https://www.instagram.com/dyd_harmony"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-semibold transition-all"
                  style={{ background: 'rgba(102,192,182,0.1)', border: '1px solid rgba(102,192,182,0.25)', color: '#66c0b6' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" style={{ width: '12px', height: '12px' }} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <circle cx="12" cy="12" r="4"/>
                    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                  </svg>
                  @dyd_harmony
                </a>
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT carousel ── */}
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: 'easeOut', delay: 0.1 }}
            className="flex flex-col gap-7"
          >
            <div className="hidden lg:block">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
                Wer steckt{' '}
                <span className="bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] bg-clip-text text-transparent">
                  hinter DYD?
                </span>
              </h2>
              <p className="mt-3 text-white/40 text-sm sm:text-base">Drei Perspektiven. Ein Antrieb.</p>
            </div>

            <div className="flex flex-col gap-4">

              {/* Nav row + peek track */}
              <div className="flex items-center gap-2">

                {/* Prev arrow */}
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.09)' }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => navigate(-1)}
                  aria-label="Vorherige"
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <ChevronLeft size={16} className="text-white/55" />
                </motion.button>

                {/* Track: prev-peek · active · next-peek */}
                {/* overflow-hidden here only clips the sliding animation, not the card content */}
                <div className="flex-1 flex items-stretch gap-2 overflow-hidden">

                  {/* Prev ghost */}
                  <div
                    className="w-[13%] flex-shrink-0 rounded-2xl overflow-hidden relative"
                    style={{
                      background: `linear-gradient(160deg, rgba(${prev.accentRgb},0.07), rgba(8,12,24,0.92))`,
                      border: `1px solid rgba(${prev.accentRgb},0.14)`,
                      opacity: 0.38,
                    }}
                  >
                    <div className="p-3 space-y-1.5">
                      <span className="text-xl leading-none">{prev.emoji}</span>
                      <p className="text-[7px] font-black uppercase tracking-widest"
                        style={{ color: `rgba(${prev.accentRgb},0.55)` }}>{prev.tag}</p>
                    </div>
                    <div className="absolute right-0 top-4 bottom-4 w-px"
                      style={{ background: `linear-gradient(to bottom, transparent, rgba(${prev.accentRgb},0.35), transparent)` }} />
                  </div>

                  {/* Active card — natural height, no overflow clip */}
                  <div className="flex-1 relative">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                      <motion.div
                        key={index}
                        custom={direction}
                        initial={(dir: Direction) => ({ x: dir > 0 ? '90%' : '-90%', scale: 0.93, opacity: 0 })}
                        animate={{ x: 0, scale: 1, opacity: 1 }}
                        exit={(dir: Direction) => ({ x: dir > 0 ? '-90%' : '90%', scale: 0.93, opacity: 0 })}
                        transition={{ type: 'spring', stiffness: 340, damping: 36, mass: 0.85 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.14}
                        onDragStart={(_, info) => { dragStartX.current = info.point.x; }}
                        onDragEnd={handleDragEnd}
                        className="rounded-2xl relative cursor-grab active:cursor-grabbing select-none"
                        style={{
                          background: `linear-gradient(155deg, rgba(${current.accentRgb},0.13) 0%, rgba(8,12,24,0.97) 55%, rgba(${current.accentRgb},0.04) 100%)`,
                          border: `1px solid rgba(${current.accentRgb},0.38)`,
                          boxShadow: `0 0 40px -10px rgba(${current.accentRgb},0.38), inset 0 1px 0 rgba(255,255,255,0.06)`,
                          backdropFilter: 'blur(16px)',
                          WebkitBackdropFilter: 'blur(16px)',
                        }}
                      >
                        <GridLines accent={current.accent} />

                        {/* Top accent stripe */}
                        <div className="h-[3px] w-full rounded-t-2xl"
                          style={{ background: `linear-gradient(90deg, ${current.accent}, rgba(${current.accentRgb},0.1))` }} />

                        {/* Header */}
                        <div className="relative px-5 pt-4 pb-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: current.accent,
                                boxShadow: `0 0 8px ${current.accent}, 0 0 18px rgba(${current.accentRgb},0.45)`,
                              }} />
                            <span className="text-[11px] font-black tracking-[0.18em] uppercase"
                              style={{ color: current.accent }}>
                              {current.tag}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[11px] font-mono text-white/22 tabular-nums">{current.number} / 03</span>
                            <span className="text-lg leading-none">{current.emoji}</span>
                          </div>
                        </div>

                        {/* Headline */}
                        <div className="px-5 pb-3">
                          <h3
                            className="text-2xl sm:text-[1.7rem] font-black leading-[1.1] tracking-tight whitespace-pre-line"
                            style={{
                              background: `linear-gradient(135deg, #fff 25%, ${current.accent})`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                            }}
                          >
                            {current.headline}
                          </h3>
                        </div>

                        {/* Divider */}
                        <div className="mx-5 h-px mb-4"
                          style={{ background: `linear-gradient(90deg, rgba(${current.accentRgb},0.32), transparent)` }} />

                        {/* Optional intro quote */}
                        {'intro' in current && current.intro && (
                          <div
                            className="mx-5 mb-4 px-4 py-3 rounded-xl text-[13px] leading-relaxed italic font-medium"
                            style={{
                              background: `rgba(${current.accentRgb},0.07)`,
                              borderLeft: `3px solid ${current.accent}`,
                              color: `rgba(${current.accentRgb},0.88)`,
                            }}
                          >
                            "{current.intro}"
                          </div>
                        )}

                        {/* Items — no badge boxes, just colored label text */}
                        <div className="px-5 pb-5 space-y-3">
                          {current.items.map((item, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05, duration: 0.24 }}
                              className="flex items-baseline gap-2"
                            >
                              {/* Dot */}
                              <span
                                className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-[7px]"
                                style={{ backgroundColor: current.accent, opacity: 0.7 }}
                              />
                              {/* Label inline */}
                              <p className="text-[13px] sm:text-sm leading-relaxed text-white/75">
                                <span
                                  className="font-bold mr-1"
                                  style={{ color: current.accent }}
                                >
                                  {item.label}:
                                </span>
                                {item.text}
                              </p>
                            </motion.div>
                          ))}
                        </div>

                        {/* Progress bar */}
                        <div className="px-5 pb-5">
                          <div className="flex gap-1.5">
                            {CARDS.map((_, i) => (
                              <motion.div
                                key={i}
                                className="h-[3px] rounded-full"
                                animate={{ flex: i === index ? 3 : 1 }}
                                transition={{ duration: 0.45 }}
                                style={{
                                  backgroundColor: i === index ? current.accent : `rgba(${current.accentRgb},0.18)`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Next ghost */}
                  <div
                    className="w-[13%] flex-shrink-0 rounded-2xl overflow-hidden relative"
                    style={{
                      background: `linear-gradient(160deg, rgba(${next.accentRgb},0.07), rgba(8,12,24,0.92))`,
                      border: `1px solid rgba(${next.accentRgb},0.14)`,
                      opacity: 0.38,
                    }}
                  >
                    <div className="p-3 space-y-1.5">
                      <span className="text-xl leading-none">{next.emoji}</span>
                      <p className="text-[7px] font-black uppercase tracking-widest"
                        style={{ color: `rgba(${next.accentRgb},0.55)` }}>{next.tag}</p>
                    </div>
                    <div className="absolute left-0 top-4 bottom-4 w-px"
                      style={{ background: `linear-gradient(to bottom, transparent, rgba(${next.accentRgb},0.35), transparent)` }} />
                  </div>

                </div>

                {/* Next arrow */}
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.09)' }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => navigate(1)}
                  aria-label="Nächste"
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <ChevronRight size={16} className="text-white/55" />
                </motion.button>
              </div>

              {/* Dot indicators */}
              <div className="flex items-center justify-center gap-2.5">
                {CARDS.map((card, i) => (
                  <motion.button
                    key={i}
                    onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i as CardIndex); }}
                    aria-label={`Kachel ${i + 1}`}
                    animate={{
                      width: i === index ? 28 : 8,
                      backgroundColor: i === index ? card.accent : 'rgba(255,255,255,0.18)',
                    }}
                    transition={{ duration: 0.3 }}
                    className="h-2 rounded-full"
                    style={{ boxShadow: i === index ? `0 0 10px ${card.accent}90` : 'none' }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
