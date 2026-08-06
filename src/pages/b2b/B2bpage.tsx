import { useState } from 'react';
import B2BHeader from './B2BHeader';
import B2BHero from './B2BHero';
import B2BTabs from './B2BTabs';
import { PlatformOverviewSection, TrustSection } from './B2BSections';
import LeadRequestModal from './Leadrequestmodal';

type Segment = 'unternehmen' | 'bildungstraeger';

export default function B2BPage() {
  const [tab, setTab] = useState<Segment>('unternehmen');
  const [lead, setLead] = useState<{ open: boolean; segment?: Segment }>({ open: false });
  const openLead = (segment?: Segment) => setLead({ open: true, segment });
  const closeLead = () => setLead({ open: false });

  return (
    <div className="bg-[#0A192F]">
      <B2BHeader onContact={() => openLead()} />
      <main>
        <B2BHero onCtaClick={(seg) => setTab(seg)} />
        <B2BTabs activeTab={tab} onTabChange={setTab} onRequestDemo={openLead} />
        <PlatformOverviewSection />
        <TrustSection onContactClick={() => openLead(tab)} />
      </main>
      <LeadRequestModal open={lead.open} segment={lead.segment} onClose={closeLead} />
    </div>
  );
}