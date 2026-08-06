import { useState } from 'react';
import B2BHeader from './b2b/B2BHeader';
import B2BHero from './b2b/B2BHero';
import B2BTabs from './b2b/B2BTabs';
import { PlatformOverviewSection, TrustSection, EventsSection } from './b2b/B2BSections';

type TabId = 'unternehmen' | 'bildungstraeger';

export default function B2BLandingPage() {
  const [activeTab, setActiveTab] = useState<TabId>('unternehmen');

  const handleHeroCta = (tab: TabId) => {
    setActiveTab(tab);
    requestAnimationFrame(() => {
      document.getElementById('b2b-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="min-h-screen bg-[#0A192F]">
      <B2BHeader />
      <B2BHero onCtaClick={handleHeroCta} />
      <B2BTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <PlatformOverviewSection />
      <TrustSection />
      <EventsSection />
      {/* Lead form anchor placeholder — Etappe 3 */}
      <div id="lead-form" />
    </div>
  );
}
