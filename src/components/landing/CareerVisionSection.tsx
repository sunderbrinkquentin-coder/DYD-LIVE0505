import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, TrendingUp, BookOpen, Award, Sparkles, ArrowRight, Check } from 'lucide-react';

export function CareerVisionSection() {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: Target,
      title: 'Vision definieren',
      description: 'Beschreibe deine Zielposition in 5-10 Jahren',
      color: 'from-[#66c0b6] to-[#30E3CA]',
      details: ['Mit oder ohne CV', 'KI-gestützte Analyse', 'Skill-Gap Erkennung'],
    },
    {
      icon: TrendingUp,
      title: 'Gap-Analyse',
      description: 'Erfahre, welche Skills du für deinen Traumjob brauchst',
      color: 'from-blue-500 to-blue-600',
      details: ['Automatische Skill-Extraktion', 'Prioritäts-Ranking', 'Markt-Insights'],
    },
    {
      icon: BookOpen,
      title: 'Lernpfad',
      description: '5-10 strukturierte Module mit kuratierten Ressourcen',
      color: 'from-purple-500 to-pink-500',
      details: ['Zeitplan & Milestones', 'Kuratierte Kurse', 'Progress Tracking'],
    },
    {
      icon: Award,
      title: 'Zertifikat',
      description: 'Professionelles Zertifikat nach Abschluss',
      color: 'from-yellow-500 to-orange-500',
      details: ['PDF Download', 'LinkedIn-ready', 'Portfolio-Nachweis'],
    },
  ];

  const benefits = [
    'KI-gestützte Gap-Analyse',
    'Personalisierte Lernpfade',
    'Kuratierte Ressourcen',
    'Progress Tracking',
    'Professionelle Zertifikate',
    'Keine Vorerfahrung nötig',
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Development Banner Overlay */}
      <div
        className="absolute inset-0 z-50 pointer-events-none overflow-hidden"
        style={{ borderRadius: 0 }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-25deg)',
            background: 'rgba(250, 180, 0, 0.92)',
            color: '#000',
            fontWeight: 800,
            fontSize: '1.4rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            padding: '14px 80px',
            boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
            zIndex: 60,
            userSelect: 'none',
          }}
        >
          In Entwicklung
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#0a0a1a] to-[#020617]" />

      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(102, 192, 182, 0.15) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#66c0b6]/10 to-[#30E3CA]/10 border border-[#66c0b6]/20 mb-6">
            <Sparkles className="text-[#66c0b6]" size={20} />
            <span className="text-sm font-semibold text-[#66c0b6]">Neu: Career Academy</span>
          </div>

          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Von der Vision zum
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#66c0b6] to-[#30E3CA]">
              Traumjob
            </span>
          </h2>

          <p className="text-xl text-white/70 mb-8 leading-relaxed">
            Definiere deine berufliche Vision für 2030/2035 und erhalte einen KI-generierten
            Lernpfad mit allem, was du brauchst, um dein Ziel zu erreichen.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={(e) => e.preventDefault()}
              className="group px-10 py-4 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-lg flex items-center gap-3 shadow-xl shadow-[#66c0b6]/20 cursor-not-allowed opacity-70"
            >
              <Target size={24} />
              Vision analysieren
              <ArrowRight size={24} />
            </button>

            <button
              onClick={(e) => e.preventDefault()}
              className="px-10 py-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 text-white font-semibold cursor-not-allowed opacity-70"
            >
              Mehr erfahren
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
              className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#66c0b6]/50 transition-all duration-300 overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`}
              />

              <div className="relative z-10">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} opacity-10 group-hover:opacity-20 flex items-center justify-center mb-4 transition-all`}
                >
                  <feature.icon
                    className={`text-transparent bg-clip-text bg-gradient-to-r ${feature.color}`}
                    size={24}
                  />
                </div>

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#66c0b6] group-hover:to-[#30E3CA] transition-all">
                  {feature.title}
                </h3>

                <p className="text-sm text-white/70 mb-4">{feature.description}</p>

                {hoveredFeature === index && (
                  <div className="space-y-2 animate-fadeIn">
                    {feature.details.map((detail, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-white/60">
                        <Check size={14} className="text-[#66c0b6]" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-[#66c0b6]/10 via-[#30E3CA]/5 to-transparent border border-[#66c0b6]/20 rounded-3xl p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-white">
                Funktioniert mit und ohne CV
              </h3>

              <p className="text-white/70 text-lg leading-relaxed">
                Hast du bereits einen CV? Perfekt! Wir analysieren deine vorhandenen Skills
                automatisch. Noch keinen CV? Kein Problem! Du bekommst die Top 10 benötigten Skills
                für deinen Traumjob und kannst deinen Ist-Stand selbst einschätzen.
              </p>

              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] flex items-center justify-center">
                      <Check size={14} className="text-black" />
                    </div>
                    <span className="text-white/80">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] rounded-2xl blur-3xl opacity-20" />

              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] flex items-center justify-center">
                        <Target className="text-black" size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">Vision eingeben</div>
                        <div className="text-xs text-white/50">2 Minuten</div>
                      </div>
                    </div>
                    <Check className="text-[#66c0b6]" size={24} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <TrendingUp className="text-white" size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">Gap-Analyse</div>
                        <div className="text-xs text-white/50">Automatisch</div>
                      </div>
                    </div>
                    <Check className="text-[#66c0b6]" size={24} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#66c0b6]/10 to-[#30E3CA]/10 rounded-xl border border-[#66c0b6]/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] flex items-center justify-center">
                        <BookOpen className="text-black" size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">Lernpfad erhalten</div>
                        <div className="text-xs text-[#66c0b6]">Premium Feature</div>
                      </div>
                    </div>
                    <Sparkles className="text-[#66c0b6]" size={24} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                        <Award className="text-white" size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">Zertifikat</div>
                        <div className="text-xs text-white/50">Nach Abschluss</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-white/50 text-center">
                    100% KI-gestützt • Personalisiert • Professionell
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
