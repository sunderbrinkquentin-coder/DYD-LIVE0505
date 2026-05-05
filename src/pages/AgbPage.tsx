import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AgbPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück zur Startseite
        </button>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12">
          <h1 className="text-4xl font-bold text-white mb-8">Allgemeine Geschäftsbedingungen (AGB)</h1>

          <div className="space-y-6 text-white/70 leading-relaxed mb-8">
            <div>
              <p className="font-semibold text-white">DYD – Decide your Dream UG (haftungsbeschränkt)</p>
              <p>Brehmstraße 2, 40239 Düsseldorf</p>
              <p>Geschäftsführer: Quentin Sunderbrink</p>
              <p>Kontakt: kontakt.dyd@gmail.com</p>
            </div>
          </div>

          <div className="space-y-8 text-white/70 leading-relaxed">
            <div>
              <h2 className="text-white font-semibold mb-3 text-xl">1. Geltungsbereich</h2>
              <p className="mb-2">(1) Diese AGB gelten für alle Verträge zwischen der DYD – Decide your Dream UG (nachfolgend „DYD") und den Nutzern der Plattformen www.decideyourdream.de sowie der zugehörigen Event-Seiten (z. B. Harmony Festival).</p>
              <p>(2) Nutzer können Verbraucher oder Unternehmer sein. Abweichende Bedingungen des Nutzers werden nicht anerkannt.</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-3 text-xl">2. Vertragsgegenstand</h2>
              <p className="mb-2">(1) Karriere-Services: Bereitstellung digitaler Tools zur Lebenslauf-Analyse (ATS-Check) und KI-gestützten Optimierung.</p>
              <p className="mb-2">(2) Event-Services: Verkauf von Eintrittsberechtigungen für Veranstaltungen (z. B. Konzerte, Comedy) sowie die Anmeldung zu Turnierformaten (z. B. Bierpong-Turniere).</p>
              <p>(3) KI-Ergebnisse dienen der Vorbereitung und ersetzen keine individuelle Rechts- oder Karriereberatung.</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-3 text-xl">3. Vertragsschluss &amp; Registrierung</h2>
              <p className="mb-2">(1) Die Darstellung der Dienste ist kein bindendes Angebot. Der Vertrag kommt durch die Annahme der Bestellung (Bestätigungs-E-Mail) nach Anklicken des Buttons „Zahlungspflichtig bestellen" zustande.</p>
              <p className="mb-2">(2) Für Karriere-Services ist ein Nutzerkonto erforderlich. Der Nutzer haftet für die Geheimhaltung seiner Zugangsdaten.</p>
              <p>(3) Bei Event-Buchungen (z. B. Bierpong) ist die Angabe korrekter Teilnehmerdaten (Partnernamen) zwingend erforderlich.</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-3 text-xl">4. Leistungsumfang &amp; Gültigkeit</h2>
              <p className="mb-2">(1) Tokens: KI-Optimierungs-Tokens sind 12 Monate ab Kauf gültig und nicht übertragbar.</p>
              <p className="mb-2">(2) Tickets: Event-Tickets berechtigen ausschließlich zum Besuch der genannten Veranstaltung am spezifischen Termin. Ein gewerblicher Weiterverkauf ist untersagt.</p>
              <p>(3) Turniere: Die Teilnahme an Turnieren (Bierpong) setzt die Erfüllung der jeweiligen Zulassungsregeln (z. B. Mindestalter) voraus.</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-3 text-xl">5. Preise &amp; Zahlung</h2>
              <p className="mb-2">(1) Es gelten die zum Zeitpunkt der Bestellung angegebenen Preise inkl. MwSt..</p>
              <p className="mb-2">(2) Die Abwicklung erfolgt über Stripe Payments Europe Ltd..</p>
              <p>(3) Der Versand digitaler Inhalte oder Tickets erfolgt erst nach vollständiger Zahlung.</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-3 text-xl">6. Widerrufsrecht &amp; Sonderregelungen</h2>
              <p className="mb-2">(1) Digitale Inhalte (KI-Tools): Das Widerrufsrecht erlischt vorzeitig, wenn DYD mit der Ausführung der Dienstleistung (z. B. Start der Analyse) mit ausdrücklicher Zustimmung des Nutzers begonnen hat.</p>
              <p className="mb-2">(2) Events (Tickets): Gemäß § 312g Abs. 2 Nr. 9 BGB besteht bei Verträgen über Dienstleistungen im Zusammenhang mit Freizeitbetätigungen mit spezifischem Termin kein Widerrufsrecht. Tickets für das Harmony Festival (inkl. Bierpong) können nicht storniert oder erstattet werden.</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-3 text-xl">7. Haftung &amp; Veranstaltungsausfall</h2>
              <p className="mb-2">(1) DYD haftet unbegrenzt bei Vorsatz, grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit.</p>
              <p className="mb-2">(2) Bei Absage einer Veranstaltung durch DYD wird der Ticketpreis erstattet. Weitergehende Ansprüche (z. B. Reisekosten) sind ausgeschlossen.</p>
              <p>(3) Für die Richtigkeit der KI-optimierten Dokumente oder den Erfolg einer Bewerbung übernimmt DYD keine Garantie.</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-3 text-xl">8. Schlussbestimmungen</h2>
              <p className="mb-2">(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.</p>
              <p className="mb-2">(2) Erfüllungsort und Gerichtsstand ist Düsseldorf.</p>
              <p>(3) Sollten Bestimmungen unwirksam sein, bleibt der Rest des Vertrages wirksam.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
