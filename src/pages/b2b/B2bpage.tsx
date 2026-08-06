import { useState } from 'react';
import B2BHeader from './B2BHeader';
import B2BHero from './B2BHero';
import B2BTabs from './B2BTabs';
import { PlatformOverviewSection, TrustSection, EventsSection } from './B2BSections';
import LeadRequestModal from './LeadRequestModal';

type Segment = 'unternehmen' | 'bildungstraeger';

export default function B2BPage() {
  // Welcher Zielgruppen-Tab ist aktiv
  const [tab, setTab] = useState<Segment>('unternehmen');

  // Modal-Steuerung: offen/zu + welches Segment vorgewählt ist
  const [lead, setLead] = useState<{ open: boolean; segment?: Segment }>({ open: false });
  const openLead = (segment?: Segment) => setLead({ open: true, segment });
  const closeLead = () => setLead({ open: false });

  return (
    <div className="bg-[#0A192F]">
      {/* Header-CTA öffnet das Modal (ohne Segment → Auswahl im Modal) */}
      <B2BHeader onContact={() => openLead()} />

      <main>
        {/* Hero-CTAs wechseln nur den Tab */}
        <B2BHero onCtaClick={(seg) => setTab(seg)} />

        {/* Tab-CTAs öffnen das Modal MIT passendem Segment */}
        <B2BTabs activeTab={tab} onTabChange={setTab} onRequestDemo={openLead} />

        <PlatformOverviewSection />
        <TrustSection />
        <EventsSection />
        {/* … hier später CTA-Band & Footer … */}
      </main>

      {/* Das Modal – genau EINMAL, ganz am Ende */}
      <LeadRequestModal open={lead.open} segment={lead.segment} onClose={closeLead} />
    </div>
  );
}