import B2BHeader from './b2b/B2BHeader';
import B2BHero from './b2b/B2BHero';

export default function B2BLandingPage() {
  return (
    <div className="min-h-screen bg-[#0A192F]">
      <B2BHeader />
      <B2BHero />
      {/* Lead form anchor placeholder — Etappe 2 */}
      <div id="lead-form" />
    </div>
  );
}
