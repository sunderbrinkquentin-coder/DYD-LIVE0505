import { useState, useCallback } from 'react';
import B2BHeader from './b2b/B2BHeader';
import B2BHero from './b2b/B2BHero';
import B2BTabs from './b2b/B2BTabs';
import OrbitVideoSection from './b2b/OrbitVideoSection';
import { PlatformOverviewSection, TrustSection, FinalCtaSection } from './b2b/B2BSections';
import B2BContactModal from './b2b/B2BContactModal';

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
      <B2BHeader onContact={() => openContact(activeTab)} />
      <B2BHero onCtaClick={handleHeroCta} />
      <B2BTabs activeTab={activeTab} onTabChange={setActiveTab} onRequestDemo={openContact} />
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