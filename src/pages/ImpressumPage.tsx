import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ImpressumPage() {
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
          <h1 className="text-4xl font-bold text-white mb-8">Impressum</h1>

          <div className="space-y-6 text-white/70 leading-relaxed">
            <div>
              <h2 className="text-white font-semibold mb-2 text-lg">Angaben gemäß § 5 Telemediengesetz (TMG)</h2>
              <p>DYD – Decide your Dream UG (haftungsbeschränkt)</p>
              <p>Brehmstraße 2</p>
              <p>40239 Düsseldorf</p>
              <p>Deutschland</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-2 text-lg">Vertreten durch den Geschäftsführer</h2>
              <p>Quentin Sunderbrink</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-2 text-lg">Kontakt</h2>
              <p>E-Mail: kontakt.dyd@gmail.com</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-2 text-lg">Handelsregister</h2>
              <p>Eingetragen im Handelsregister des Amtsgerichts Düsseldorf</p>
              <p>Handelsregisternummer: HRB 110079</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-2 text-lg">Umsatzsteuer-ID gemäß § 27 a UStG</h2>
              <p>Wird nach Erteilung durch das Finanzamt ergänzt.</p>
            </div>

            <div>
              <h2 className="text-white font-semibold mb-2 text-lg">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
              <p>Quentin Sunderbrink</p>
              <p>Brehmstraße 2</p>
              <p>40239 Düsseldorf</p>
            </div>

            <div className="pt-6 border-t border-white/10">
              <h2 className="text-white font-semibold mb-4 text-xl">Haftungsausschluss (Disclaimer)</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-white font-medium mb-2">Haftung für Inhalte</h3>
                  <p>Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.</p>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-2">Haftung für Links</h3>
                  <p>Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich.</p>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-2">Urheberrecht</h3>
                  <p>Die durch DYD erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung von DYD.</p>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-2">Online-Streitbeilegung gemäß Art. 14 Abs. 1 ODR-VO</h3>
                  <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-[#66c0b6] hover:underline">https://ec.europa.eu/consumers/odr</a></p>
                  <p className="mt-2">Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
