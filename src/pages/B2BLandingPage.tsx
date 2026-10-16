import { useState, useCallback } from 'react';
import B2BHeader from './b2b/B2BHeader';
import B2BHero from './b2b/B2BHero';
import B2BTabs from './b2b/B2BTabs';
import OrbitVideoSection from './b2b/OrbitVideoSection';
import { PlatformOverviewSection, TrustSection, FinalCtaSection } from './b2b/B2BSections';
import B2BContactModal from './b2b/B2BContactModal';
import { ArrowRight, Workflow } from 'lucide-react';
import { automationContent } from './b2b/automationContent';

/** Verweis auf die eigene Seite "Automatisierung & Software" – bewusst als
 *  klar abgesetztes Angebot (eigene Farbe, eigene Seite), damit es nicht mit
 *  der Skill-Plattform (NEXUS/ORBIT) verwechselt wird. */
function AutomationTeaser() {
  const t = automationContent.teaser;
  return (
    <section aria-label={t.title} className="px-4 sm:px-6 lg:px-8 py-16 bg-[#F6F9FD]">
      <a href="#/business/automatisierung" className="group block max-w-6xl mx-auto rounded-3xl overflow-hidden b2b-focus-ring" style={{ background: 'radial-gradient(600px 260px at 85% 20%, rgba(222,255,154,0.18), transparent 70%), linear-gradient(140deg, #07111f, #0d2340)' }}>
        <div className="grid md:grid-cols-12 gap-6 items-center p-6 sm:p-10">
          <div className="md:col-span-7">
            <span className="inline-flex items-center gap-1.5 font-arimo text-xs font-bold uppercase tracking-wide text-[#DEFF9A] mb-3"><Workflow className="w-3.5 h-3.5" aria-hidden="true" />{t.eyebrow}</span>
            <h2 className="font-poppins font-black text-2xl sm:text-3xl text-white mb-3" style={{ letterSpacing: '-0.02em' }}>{t.title}</h2>
            <p className="font-arimo text-white/65 mb-6 max-w-xl">{t.text}</p>
            <span className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-arimo font-bold text-[#0A192F] transition group-hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)' }}>{t.button}<ArrowRight className="w-4 h-4" aria-hidden="true" /></span>
          </div>
          <div className="md:col-span-5 hidden md:block">
            <img src="/b2b/refs/crm-cockpit.webp" alt="" loading="lazy" className="w-full rounded-xl border border-white/10 shadow-2xl transition-transform group-hover:-translate-y-1" />
          </div>
        </div>
      </a>
    </section>
  );
}

type TabId = 'unternehmen' | 'bildungstraeger';

export default function B2BLandingPage() {
  const [activeTab, setActiveTab] = useState<TabId>('unternehmen');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSegment, setModalSegment] = useState<TabId>('unternehmen');
  /* Optionaler Kontext aus dem ORBIT-Tab (z. B. "Live-Demo" oder das gewählte
     Segment wie "IHK") – wird im Kontaktformular als Gesprächsgrundlage
     vorausgefüllt, ohne ein zusätzliches Pflichtfeld einzuführen. */
  const [modalInstitution, setModalInstitution] = useState<string | undefined>(undefined);

  const openContact = useCallback((segment: TabId, institution?: string) => {
    setModalSegment(segment);
    setModalInstitution(institution);
    setModalOpen(true);
  }, []);

  const handleHeroCta = (tab: TabId) => {
    setActiveTab(tab);
    requestAnimationFrame(() => {
      document.getElementById('b2b-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="min-h-screen bg-[#0A192F]">
      <B2BHeader area="skills" onContact={() => openContact(activeTab)} />
      <B2BHero onCtaClick={handleHeroCta} />
      <B2BTabs activeTab={activeTab} onTabChange={setActiveTab} onRequestDemo={openContact} />
      <AutomationTeaser />
      <PlatformOverviewSection activeTab={activeTab} />
      <TrustSection onContact={() => openContact(activeTab)} />
      {/* NEU (01.10.2026, auf Kundenwunsch entfernt): EventsSection
          ("DYD live: Workshops & Messeauftritte") stand hier zuvor direkt
          vor dem finalen CTA-Band - sollte ganz raus. Die zugehoerigen
          Inhalte bleiben als b2bContent.events in content.ts erhalten
          (unschaedlich, falls spaeter doch wieder gebraucht), werden aber
          nirgends mehr gerendert. Der Import von EventsSection wurde
          entsprechend oben entfernt. */}
      <FinalCtaSection onContact={() => openContact(activeTab)} />
      <B2BContactModal open={modalOpen} onClose={() => setModalOpen(false)} segment={modalSegment} institution={modalInstitution} />
    </div>
  );
}