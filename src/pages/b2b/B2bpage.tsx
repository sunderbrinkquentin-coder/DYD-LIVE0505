import { useState } from 'react';
import B2BHeader from './B2BHeader';
import B2BHero from './B2BHero';
import B2BTabs from './B2BTabs';
import { PlatformOverviewSection, TrustSection, EventsSection } from './B2BSections';
import B2BFooter from './B2BFooter';
import LeadRequestModal from './LeadRequestModal';

type Segment = 'unternehmen' | 'bildungstraeger';

export default function B2BPage() {
  const [tab, setTab] = useState<Segment>('unternehmen');
  const [lead, setLead] = useState<{ open: boolean; segment?: Segment }>({ open: false });

  const openLead = (segment?: Segment) => setLead({ open: true, segment });
  const closeLead = () => setLead({ open: false });

  return (
    <div className="bg-[#0A192F] min-h-screen text-white">
      <B2BHeader onContact={() => openLead()} />

      <main>
        {/* Hero */}
        <B2BHero onCtaClick={(seg) => setTab(seg)} />

        {/* Zwei Produkt-„Unterseiten" (NEXUS / ORBIT) per In-Page-Switch */}
        <B2BTabs activeTab={tab} onTabChange={setTab} onRequestDemo={openLead} />

        {/* Plattform-Standard */}
        <PlatformOverviewSection />

        {/* Vertrauen & Gründer */}
        <TrustSection onContact={() => openLead()} />

        {/* Workshops & Messeauftritte */}
        <EventsSection />
      </main>

      {/* CTA-Band + Footer inkl. Impressum */}
      <B2BFooter onContact={() => openLead()} />

      {/* Kontakt-Modal (einmal, global) */}
      <LeadRequestModal open={lead.open} segment={lead.segment} onClose={closeLead} />
    </div>
  );
}