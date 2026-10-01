import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DatenschutzPage() {
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
          <h1 className="text-4xl font-bold text-white mb-8">Datenschutzerklärung</h1>

          <div className="space-y-8 text-white/70 leading-relaxed">
            <div>
              <h2 className="text-white font-semibold mb-3 text-xl">1. Verantwortlicher</h2>
              <p>DYD – Decide your Dream UG (haftungsbeschränkt)</p>
              <p>Brehmstraße 2</p>
              <p>40239 Düsseldorf</p>
              <p>Deutschland</p>
              <p>E-Mail: kontakt.dyd@gmail.com</p>
              <p>Geschäftsführer: Quentin Sunderbrink</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-3 text-xl">2. Allgemeine Hinweise zur Datenverarbeitung</h2>
              <p>Wir verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung und Durchführung unserer Website und unserer Services erforderlich ist. Die Verarbeitung erfolgt auf Grundlage der DSGVO, insbesondere Art. 6 Abs. 1 lit. a, b und f.</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-3 text-xl">3. Hosting (Netlify)</h2>
              <p>Unsere Website wird von Netlify, Inc., 512 2nd Street, Suite 200, San Francisco, CA 94107, USA, gehostet. Netlify speichert dabei automatisiert Zugriffs-Logfiles (z. B. IP-Adresse, Browsertyp, Datum und Uhrzeit des Zugriffs), um den Betrieb, die Stabilität und die Sicherheit der Website zu gewährleisten.</p>
              <p className="mt-2"><span className="text-white font-medium">Drittlandtransfer:</span> Da Netlify Daten in die USA übermitteln kann, stützt sich die Übermittlung in erster Linie auf die Zertifizierung von Netlify unter dem EU-US Data Privacy Framework (DPF); ergänzend bzw. hilfsweise kommen EU-Standardvertragsklauseln (SCCs) nach Art. 46 DSGVO zum Einsatz. Mit Netlify besteht ein Auftragsverarbeitungsvertrag (Data Processing Agreement) nach Art. 28 DSGVO.</p>
              <p className="mt-2"><span className="text-white font-medium">Rechtsgrundlage:</span> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren und stabilen Betrieb der Website).</p>
              <p><span className="text-white font-medium">Speicherdauer:</span> Zugriffs-Logfiles werden bei Netlify in der Regel bis zu 90 Tage online und zu Sicherungszwecken bis zu 1 Jahr in Offline-Backups vorgehalten.</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-3 text-xl">4. Registrierung und Nutzerkonto</h2>
              <p>Zur Nutzung des CV-Optimierers können Nutzer ein Konto anlegen. Dabei werden Name, E-Mail, Passwort (verschlüsselt), ggf. Adresse, Telefonnummer sowie Profilinformationen (Berufserfahrung, Ausbildung, Fähigkeiten, Karriereziele, Token-Käufe) verarbeitet.</p>
              <p className="mt-2"><span className="text-white font-medium">Rechtsgrundlage:</span></p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</li>
                <li>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung für Zusatzangaben)</li>
              </ul>
              <p className="mt-2"><span className="text-white font-medium">Speicherdauer:</span> bis zur Löschung des Kontos.</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-3 text-xl">5. Lebenslauf-Upload, Analyse & Optimierung</h2>

              <div className="ml-4 space-y-4">
                <div>
                  <h3 className="text-white font-medium mb-2">5.1 Allgemeines</h3>
                  <p>Nutzer können Lebensläufe (PDF) hochladen, die automatisch analysiert, optimiert und als neue Version bereitgestellt werden. Die Dokumente enthalten personenbezogene Daten wie Name, Kontaktdaten, Ausbildung, Berufserfahrung und Qualifikationen.</p>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-2">5.2 Verarbeitung durch Google Vision</h3>
                  <p>Zur Texterkennung (Extraktion aus PDFs) setzen wir Google Cloud Vision API ein.</p>
                  <p className="mt-2"><span className="text-white font-medium">Anbieter:</span> Google Cloud EMEA Limited, 70 Sir John Rogerson's Quay, Dublin 2, Irland</p>
                  <p className="mt-2"><span className="text-white font-medium">Drittlandtransfer:</span> Es kann eine Übermittlung an die Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA erfolgen. Die Übermittlung ist durch Standardvertragsklauseln (SCCs) nach Art. 46 DSGVO abgesichert.</p>
                  <p className="mt-2"><span className="text-white font-medium">Rechtsgrundlage:</span> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie Art. 6 Abs. 1 lit. a DSGVO (Einwilligung in Drittlandübermittlung).</p>
                  <p className="mt-2"><span className="text-white font-medium">Zweck:</span> Automatisierte Extraktion von Texten aus Lebensläufen zur Vorbereitung der KI-Analyse.</p>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-2">5.3 Verarbeitung durch OpenAI (KI-Optimierung)</h3>
                  <p>Für die Optimierung der Lebensläufe verwenden wir die API von OpenAI. Da DYD mit Sitz in Deutschland (EU) die Services nutzt, ist unsere Vertragspartnerin OpenAI Ireland Limited, Irland.</p>
                  <p className="mt-2">Mit OpenAI besteht ein Auftragsverarbeitungsvertrag (Data Processing Addendum) inkl. EU-Standardvertragsklauseln (SCCs) nach Art. 46 DSGVO für etwaige Datenübermittlungen in die USA. Datenimporteurin im Rahmen dieser SCCs ist OpenAI OpCo, LLC, 1960 Bryant Street, San Francisco, CA 94110, USA. OpenAI nutzt die über die API übermittelten Daten nicht zum Training seiner Modelle.</p>
                  <p className="mt-2"><span className="text-white font-medium">Rechtsgrundlage:</span> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und Art. 6 Abs. 1 lit. a DSGVO (Einwilligung zur KI-Verarbeitung).</p>
                  <p className="mt-2"><span className="text-white font-medium">Speicherdauer:</span> Über die API übermittelte Daten ("API Service Customer Data") werden von OpenAI für maximal 30 Tage gespeichert und danach gelöscht, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>
                  <p className="mt-2"><span className="text-white font-medium">Zweck:</span> Erstellung optimierter Lebensläufe und Bewerbungsinhalte durch KI.</p>
                </div>

              </div>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-3 text-xl">6. Datenverarbeitung durch Make</h2>
              <p>Zur Automatisierung (z. B. PDF-Verarbeitung, Datenweitergabe an KI-Tools, E-Mail-Benachrichtigungen) verwenden wir Make (Celonis Automation Platform, Prag, Tschechien). Mit Make wurde ein AVV nach Art. 28 DSGVO geschlossen.</p>
              <p className="mt-2"><span className="text-white font-medium">Rechtsgrundlage:</span> Art. 6 Abs. 1 lit. b DSGVO (technische Vertragserfüllung).</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-3 text-xl">7. Datenbank-Hosting (Supabase)</h2>
              <p>Unsere Daten werden in einer Supabase-Datenbank (Region Frankfurt, Deutschland) gespeichert. Mit Supabase besteht ein AVV nach Art. 28 DSGVO.</p>
              <p className="mt-2"><span className="text-white font-medium">Rechtsgrundlage:</span> Art. 6 Abs. 1 lit. b DSGVO.</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-3 text-xl">8. Zahlungsabwicklung über Stripe</h2>
              <p>Die Zahlungsabwicklung (Token-Käufe, Bundles) erfolgt über Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Dublin 2, Irland. Stripe kann personenbezogene Daten in die USA übermitteln (SCCs vorhanden).</p>
              <p className="mt-2"><span className="text-white font-medium">Verarbeitete Daten:</span> Name, Rechnungsadresse, Betrag, Transaktions-ID, Kaufdatum. DYD speichert keine Zahlungsdaten.</p>
              <p className="mt-2"><span className="text-white font-medium">Rechtsgrundlage:</span> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) & Art. 6 Abs. 1 lit. c DSGVO (gesetzliche Aufbewahrungspflichten).</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-3 text-xl">9. Cookies</h2>
              <p>Wir verwenden ausschließlich technisch notwendige Cookies (z. B. Session-Cookies zur Anmeldung). Keine Analyse- oder Marketing-Cookies werden eingesetzt.</p>
              <p className="mt-2"><span className="text-white font-medium">Rechtsgrundlage:</span> Art. 6 Abs. 1 lit. f DSGVO (Funktionsfähigkeit der Website).</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-3 text-xl">10. Rechte der betroffenen Person</h2>
              <p>Alle Rechte gem. Art. 15–21 DSGVO:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Auskunft über Ihre gespeicherten Daten</li>
                <li>Berichtigung unrichtiger Daten</li>
                <li>Löschung Ihrer Daten</li>
                <li>Einschränkung der Verarbeitung</li>
                <li>Datenübertragbarkeit</li>
                <li>Widerspruch gegen die Verarbeitung</li>
                <li>Widerruf von Einwilligungen</li>
              </ul>
              <p className="mt-4"><span className="text-white font-medium">Zuständige Aufsichtsbehörde:</span></p>
              <p className="mt-2">Landesbeauftragte für Datenschutz und Informationsfreiheit NRW</p>
              <p>Kavalleriestraße 2–4, 40213 Düsseldorf</p>
              <p>E-Mail: poststelle@ldi.nrw.de</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-3 text-xl">11. Datensicherheit</h2>
              <p>DYD verwendet SSL-Verschlüsselung (HTTPS) sowie weitere technische und organisatorische Maßnahmen nach Art. 32 DSGVO.</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-3 text-xl">12. Änderungen der Datenschutzerklärung</h2>
              <p>Diese Datenschutzerklärung kann bei technischen oder rechtlichen Änderungen angepasst werden.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}