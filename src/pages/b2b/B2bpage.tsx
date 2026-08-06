import { useState } from 'react';
import B2BHeader from './B2BHeader';
import B2BHero from './B2BHero';
import B2BTabs from './B2BTabs';
import LeadRequestModal from './Leadrequestmodal';

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
        <B2BHero onCtaClick={(seg) => setTab(seg)} />

        {/* Binary Navigation Bar */}
        <B2BTabs activeTab={tab} onTabChange={setTab} onRequestDemo={openLead} />

        {/* Dynamischer Contentbereich basierend auf Segment */}
        <section className="py-20 px-4 max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
          {tab === 'unternehmen' ? (
            <div className="w-full animate-fadeIn">
              <h2 className="text-4xl md:text-6xl font-black mb-12 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                DYD NEXUS
              </h2>
              <div className="inline-block text-left text-xl md:text-3xl font-light space-y-4">
                <p><span className="font-bold text-cyan-400 w-8 inline-block">N</span>ext-Skill</p>
                <p><span className="font-bold text-cyan-400 w-8 inline-block">E</span>volution</p>
                <p><span className="font-bold text-cyan-400 w-8 inline-block">X</span>-Learning</p>
                <p><span className="font-bold text-cyan-400 w-8 inline-block">U</span>niversal</p>
                <p><span className="font-bold text-cyan-400 w-8 inline-block">S</span>ystem</p>
              </div>
            </div>
          ) : (
            <div className="w-full animate-fadeIn">
              <h2 className="text-4xl md:text-6xl font-black mb-12 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">
                DYD ORBIT
              </h2>
              <div className="inline-block text-left text-xl md:text-3xl font-light space-y-4">
                <p><span className="font-bold text-teal-400 w-8 inline-block">O</span>ptimized</p>
                <p><span className="font-bold text-teal-400 w-8 inline-block">R</span>eskilling</p>
                <p><span className="font-bold text-teal-400 w-8 inline-block">B</span>usiness</p>
                <p><span className="font-bold text-teal-400 w-8 inline-block">I</span>ntelligence</p>
                <p><span className="font-bold text-teal-400 w-8 inline-block">T</span>ool</p>
              </div>
            </div>
          )}
        </section>
      </main>

      <LeadRequestModal open={lead.open} segment={lead.segment} onClose={closeLead} />
    </div>
  );
}