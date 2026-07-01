import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, CheckCircle, FileText, ArrowRight, Clipboard as ClipboardEdit, Zap, RefreshCcw, GraduationCap } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const { scrollYProgress } = useScroll();

  const logoOpacity = useTransform(scrollYProgress, [0, 0.3, 1], [0.1, 0.15, 0.1]);
  const logoScale = useTransform(scrollYProgress, [0, 1], [1.2, 1.5]);
  const logoRotate = useTransform(scrollYProgress, [0, 1], [-5, 8]);
  const logoY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const logoX = useTransform(scrollYProgress, [0, 1], [0, -40]);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const stagger = {
    animate: { transition: { staggerChildren: 0.1 } },
  };

  const handleOptimizationClick = () => {
    if (!user) {
      const redirectTarget = encodeURIComponent("/dashboard");
      navigate(`/login?redirect=${redirectTarget}&action=buy-tokens`);
      return;
    }
    navigate("/dashboard?action=buy-tokens");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050507] via-[#0a0a0f] to-[#050507] text-white overflow-hidden relative">
      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: logoOpacity }}
        >
          <motion.img
            src="/DYD Logo RGB copy copy.svg"
            alt=""
            className="w-[90vw] sm:w-[700px] opacity-25 blur-2xl"
            style={{ scale: logoScale, rotate: logoRotate, y: logoY, x: logoX }}
          />
        </motion.div>
      </div>

      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-16 flex items-center justify-between">
            <motion.img
              src="/DYD Logo RGB copy copy.svg"
              alt="DYD Logo"
              className="h-10 opacity-90"
              whileHover={{ scale: 1.05 }}
            />

            <div className="hidden md:flex items-center gap-6">
              <motion.a href="#prozess" className="text-white/70 hover:text-white">
                So funktioniert's
              </motion.a>

              <motion.a href="#preise" className="text-white/70 hover:text-white">
                Preise
              </motion.a>

              <motion.a href="#festival" className="text-white/70 hover:text-white">
                Festival
              </motion.a>

              {user ? (
                <motion.button
                  onClick={() => navigate("/dashboard")}
                  className="text-white/70 hover:text-white"
                >
                  Hallo {profile?.full_name ? profile.full_name.split(' ')[0] : 'dort'}
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => navigate("/login")}
                  className="text-white/70 hover:text-white"
                >
                  Login
                </motion.button>
              )}

              <motion.button
                onClick={() => navigate("/cv-check")}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-semibold shadow-lg"
              >
                Kostenlos starten
              </motion.button>
            </div>
          </div>
        </div>
      </nav>
<button
  type="button"
  onClick={() => (window as any).openCookieSettings?.()}
  className="text-white/60 hover:text-white underline text-sm"
>
  Cookie-Einstellungen
</button>

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div initial="initial" animate="animate" variants={stagger}>

            <motion.div
              variants={fadeInUp}
              className="inline-block px-5 py-2 rounded-full bg-white/10 border border-white/20 text-[#66c0b6] text-sm font-semibold mb-6"
            >
              <Sparkles className="inline w-4 h-4 mr-2" />
              Kostenlos • KI-basiert • ATS-optimiert
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold leading-tight"
            >
              Dein CV –{" "}
              <span className="bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-transparent bg-clip-text">
                perfekt optimiert
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-white/70 mt-6 max-w-2xl mx-auto"
            >
              Kostenloser ATS-Score. KI-basierte Erstellung. One-Klick-Optimierung
              für jede Stellenanzeige.
            </motion.p>

            {/* BUTTONS */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col gap-3 justify-center mt-10 max-w-xl mx-auto"
            >
              {/* top row: CV-tools */}
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/cv-wizard")}
                  className="flex-1 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold shadow-xl flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  CV erstellen
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/cv-check")}
                  className="flex-1 px-8 py-4 rounded-2xl border border-white/20 text-white/80 hover:text-white hover:border-white/35 transition-colors flex items-center justify-center gap-2"
                >
                  <ClipboardEdit className="w-5 h-5" />
                  CV checken
                </motion.button>
              </div>

              {/* Career Academy — full-width highlight */}
              <motion.button
                whileHover={{ scale: 1.02, filter: 'brightness(1.08)' }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/career-vision")}
                className="w-full px-8 py-4 rounded-2xl flex items-center justify-center gap-3 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(120,80,220,0.22) 0%, rgba(80,160,220,0.18) 100%)',
                  border: '1px solid rgba(160,120,255,0.35)',
                  boxShadow: '0 0 32px rgba(140,100,240,0.12)',
                }}
              >
                <GraduationCap className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(190,160,255,0.9)' }} />
                <span className="font-bold text-white text-base tracking-wide">Career Academy starten</span>
                <span className="text-sm font-normal ml-1" style={{ color: 'rgba(190,160,255,0.65)' }}>– Lernpfad, Skills & Karriereziel</span>
                <ArrowRight className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: 'rgba(190,160,255,0.7)' }} />
              </motion.button>
            </motion.div>

            {/* NO P TAG → FIX AGAINST CRASH */}
            <motion.div
              variants={fadeInUp}
              className="flex gap-6 justify-center text-white/50 text-sm mt-8"
            >
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-[#66c0b6]" />
                Keine Anmeldung
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-[#66c0b6]" />
                DSGVO-konform
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-[#66c0b6]" />
                ATS-optimiert
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PROZESS SECTION */}
      <section id="prozess" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="text-center mb-14"
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-widest mb-4" style={{ background: 'rgba(102,192,182,0.1)', border: '1px solid rgba(102,192,182,0.2)', color: '#66c0b6', textTransform: 'uppercase' }}>
              So funktioniert's
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">CV einmal erstellen – immer wieder nutzen</h2>
            <p className="text-white/55 text-lg max-w-xl mx-auto">Kein nerviges Neu-Ausfüllen. Dein CV passt sich automatisch jeder Stelle an.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <ClipboardEdit size={22} />,
                step: '01',
                title: 'CV einmal ausfüllen',
                desc: 'Erstelle deinen Lebenslauf einmalig mit dem CV-Wizard. Daten werden sicher gespeichert.',
                accent: '#66c0b6',
              },
              {
                icon: <Zap size={22} />,
                step: '02',
                title: 'Wunschstelle hinzufügen',
                desc: 'Trage einfach Unternehmen, Jobtitel und Stellenbeschreibung ein. Das war\'s.',
                accent: '#30E3CA',
                highlight: true,
              },
              {
                icon: <RefreshCcw size={22} />,
                step: '03',
                title: 'CV wird optimiert',
                desc: 'Die KI passt deinen Lebenslauf automatisch an die Stelle an – ATS-optimiert und einzigartig.',
                accent: '#66c0b6',
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative rounded-2xl p-6"
                style={{
                  background: item.highlight
                    ? 'linear-gradient(135deg, rgba(102,192,182,0.12) 0%, rgba(48,227,202,0.06) 100%)'
                    : 'rgba(255,255,255,0.03)',
                  border: item.highlight
                    ? '1px solid rgba(102,192,182,0.3)'
                    : '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {item.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'linear-gradient(135deg, #66c0b6, #30E3CA)', color: '#050507' }}>
                    Der entscheidende Schritt
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `rgba(102,192,182,0.1)`, border: `1px solid rgba(102,192,182,0.2)`, color: item.accent }}>
                    {item.icon}
                  </div>
                  <span className="text-xs font-bold tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>{item.step}</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-5"
            style={{ background: 'rgba(102,192,182,0.06)', border: '1px solid rgba(102,192,182,0.18)' }}
          >
            <div>
              <p className="font-bold text-white mb-1">Schon einen CV erstellt?</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Logge dich ein und füge direkt deine nächste Wunschstelle hinzu.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="flex-shrink-0 px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-sm"
              style={{ background: 'linear-gradient(135deg, #66c0b6, #30E3CA)', color: '#050507', boxShadow: '0 4px 20px rgba(102,192,182,0.25)' }}
            >
              Zum Dashboard <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* PREISE */}
      <section id="preise" className="py-32 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Preise</h2>

          <motion.button
            onClick={handleOptimizationClick}
            className="px-10 py-5 rounded-2xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold mt-10 shadow-xl"
          >
            Jetzt freischalten
          </motion.button>
          <button
  onClick={() => (window as any).openCookieSettings?.()}
  className="text-xs text-slate-500 hover:underline"
>
  Cookie-Einstellungen
</button>

        </div>
      </section>

      {/* FESTIVAL */}
      <section id="festival" className="py-32 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold">Harmony Festival</h2>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-center text-white/40">
        DYD © {new Date().getFullYear()}
      </footer>
      {/* Cookie Banner */}
{localStorage.getItem('cookie-consent') !== 'accepted' &&
 localStorage.getItem('cookie-consent') !== 'declined' && (
  <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 text-white px-6 py-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
    <p className="text-sm text-white/90">
      Wir verwenden Cookies, um unsere Website zu analysieren und zu verbessern.
      Weitere Infos findest du in unserer Datenschutzerklärung.
    </p>

    <div className="flex gap-3">
      <button
        onClick={() => {
          localStorage.setItem('cookie-consent', 'accepted');
          // Google Analytics aktivieren
          const script = document.createElement('script');
          script.src = 'https://www.googletagmanager.com/gtag/js?id=G-SKB4QXVYRF';
          script.async = true;
          document.head.appendChild(script);

          (window as any).dataLayer = (window as any).dataLayer || [];
          function gtag(...args: any[]) {
            (window as any).dataLayer.push(args);
          }
          gtag('js', new Date());
          gtag('config', 'G-SKB4QXVYRF', { anonymize_ip: true });

          window.location.reload();
        }}
        className="px-4 py-2 rounded-lg bg-[#30E3CA] text-slate-900 font-semibold"
      >
        Akzeptieren
      </button>

      <button
        onClick={() => {
          localStorage.setItem('cookie-consent', 'declined');
          window.location.reload();
        }}
        className="px-4 py-2 rounded-lg border border-white/40 text-white"
      >
        Ablehnen
      </button>
    </div>
  </div>
)}

    </div>
  );
}
