import { useState, useCallback } from 'react';
import B2BHeader from './b2b/B2BHeader';
import B2BHero from './b2b/B2BHero';
import B2BTabs from './b2b/B2BTabs';
import { PlatformOverviewSection, TrustSection } from './b2b/B2BSections';
import B2BContactModal from './b2b/B2BContactModal';
import { FaqSchema } from '../components/seo/FaqSchema';
import { b2bContent } from './b2b/content';

type TabId = 'unternehmen' | 'bildungstraeger';

/* NEU (SEO/GEO): FAQPage-Structured-Data fuer die B2B-Seite - bisher
   existierte nur fuer die CV-Check-Seite ein FAQ-Schema (siehe index.html),
   die NEXUS/ORBIT-FAQs aus content.ts waren fuer Suchmaschinen/AI-Crawler
   unsichtbar. Beide Tabs zusammen, unabhaengig vom gerade aktiven Tab,
   damit Crawler den vollstaendigen Inhalt sehen. */
const B2B_FAQS = [...b2bContent.tabs.tabA.faq, ...b2bContent.tabs.tabB.faq].map((f) => ({
  question: f.q,
  answer: f.a,
}));

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
      <FaqSchema faqs={B2B_FAQS} />
      <B2BHeader onContact={() => openContact(activeTab)} />
      <B2BHero onCtaClick={handleHeroCta} />
      <B2BTabs activeTab={activeTab} onTabChange={setActiveTab} onRequestDemo={openContact} />
      <PlatformOverviewSection activeTab={activeTab} />
      <TrustSection onContact={() => openContact(activeTab)} />
      <B2BContactModal open={modalOpen} onClose={() => setModalOpen(false)} segment={modalSegment} institution={modalInstitution} />
    </div>
  );
}