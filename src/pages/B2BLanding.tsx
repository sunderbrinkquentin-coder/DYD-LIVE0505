import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Filter, Target, TrendingUp, Euro, Clock, TrendingDown, Award } from 'lucide-react';
import Navigation from '../components/Navigation';
import Button from '../components/Button';

export default function B2BLanding() {
  const navigate = useNavigate();

  const problems = [
    {
      icon: Clock,
      title: 'Zeit-Verschwendung',
      text: '500 Bewerbungen, 95% passen nicht – Stunden verschwendet beim Screening',
    },
    {
      icon: TrendingDown,
      title: 'Schlechte Match-Quote',
      text: 'Klassische Jobbörsen bringen massenhaft unpassende Kandidaten',
    },
    {
      icon: Euro,
      title: 'Hohe Kosten',
      text: 'Personalvermittlung kostet 15-25% Jahresgehalt = 12.000-20.000€ pro Hire',
    },
  ];

  const solutions = [
    {
      icon: Filter,
      title: 'Pre-Screened Kandidaten',
      description: 'Alle CVs sind KI-optimiert, strukturiert und ATS-geprüft',
      stat: '70% weniger Zeit beim Screening',
    },
    {
      icon: Target,
      title: 'KI-basiertes Matching',
      description: 'Unser Algorithmus findet Kandidaten, die wirklich zu Ihrer Stelle passen',
      stat: '89% durchschnittlicher Match-Score',
    },
    {
      icon: TrendingUp,
      title: 'Höhere Qualität',
      description: 'Kandidaten, die aktiv an ihrem CV arbeiten, sind motivierter',
      stat: '3x höhere Accept-Rate',
    },
    {
      icon: Euro,
      title: 'Transparente Kosten',
      description: 'Fixpreis pro Monat – keine versteckten Gebühren pro Hire',
      stat: '299€/Monat statt 15.000€/Hire',
    },
  ];

  const testimonials = [
    {
      quote: 'DYD hat unsere Time-to-Hire von 45 auf 18 Tage reduziert. Die Kandidaten sind nicht nur qualifiziert, sondern auch motiviert.',
      author: 'Anna Schmidt',
      role: 'Head of Talent Acquisition',
      company: 'BMW AG',
    },
    {
      quote: 'Wir haben 3 Senior-Positionen in 2 Wochen besetzt – früher hat das Monate gedauert. Die Match-Qualität ist beeindruckend.',
      author: 'Michael Weber',
      role: 'HR Manager',
      company: 'Deloitte',
    },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '299€',
      period: 'pro Monat',
      description: 'Perfekt für kleine Teams und Start-ups',
      features: [
        '1 Recruiter-Seat',
        'Zugang zu gesamtem Kandidaten-Pool',
        'Bis zu 5 aktive Stellenausschreibungen',
        'Unbegrenzte Kandidaten-Kontakte',
        'KI-Matching & Filter',
        'Email-Support',
      ],
    },
    {
      name: 'Business',
      price: '799€',
      period: 'pro Monat',
      description: 'Für wachsende Unternehmen',
      badge: 'Beliebt',
      features: [
        '3 Recruiter-Seats',
        'Alles aus Starter',
        'Bis zu 15 aktive Stellenausschreibungen',
        'Priority-Support',
        'Team-Collaboration-Tools',
        'Analytics-Dashboard',
        'Quartalsweise Business Review',
      ],
    },
    {
      name: 'Enterprise',
      price: 'Individuell',
      period: '',
      description: 'Für große Recruiting-Teams',
      badge: 'Custom',
      features: [
        'Unbegrenzte Recruiter-Seats',
        'Alles aus Business',
        'Unbegrenzte Stellenausschreibungen',
        'ATS-Integration',
        'SSO & Advanced Security',
        'Dedicated Account Manager',
        'Custom Branding',
        'SLA & Priority-Support',
      ],
    },
  ];

  return (
    <div className="min-h-screen gradient-bg">
      <Navigation />

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
          >
            Finden Sie <span className="text-primary">qualifizierte Kandidaten</span> in Minuten
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-text-secondary mb-8"
          >
            Zugang zu einem Pool KI-optimierter Lebensläufe – präzise, ATS-konform, sofort einsatzbereit
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button size="large" icon={Calendar}>Demo vereinbaren</Button>
            <Button variant="secondary" size="large" onClick={() => navigate('/unternehmen/dashboard')}>
              7 Tage kostenlos testen
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex justify-center gap-6 text-sm text-text-secondary"
          >
            <span>🔒 DSGVO-konform</span>
            <span>✓ Keine Vertragsbindung</span>
            <span>⚡ In 24h startklar</span>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-12"
          >
            Kennen Sie diese Herausforderungen?
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {problems.map((problem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-dark-card p-6 rounded-lg card-shadow"
              >
                <problem.icon className="text-accent mb-4" size={32} />
                <h3 className="text-xl font-bold mb-2">{problem.title}</h3>
                <p className="text-text-secondary">{problem.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-dark-card bg-opacity-30">
        <div className="w-full">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-16"
          >
            DYD löst das Problem
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-8">
            {solutions.map((solution, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-dark-card p-8 rounded-lg card-shadow hover-glow transition-all"
              >
                <solution.icon className="text-primary mb-4" size={40} />
                <h3 className="text-2xl font-bold mb-2">{solution.title}</h3>
                <p className="text-text-secondary mb-4">{solution.description}</p>
                <div className="text-primary font-bold text-lg">{solution.stat}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-16"
          >
            Das sagen unsere Kunden
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-dark-card p-8 rounded-lg card-shadow"
              >
                <p className="text-lg mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-bold">{testimonial.author}</p>
                  <p className="text-sm text-text-secondary">{testimonial.role}</p>
                  <p className="text-sm text-primary">{testimonial.company}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-dark-card bg-opacity-30">
        <div className="w-full">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-4"
          >
            Transparente Preise
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="text-text-secondary text-center mb-16"
          >
            Wählen Sie den Plan, der zu Ihrem Team passt
          </motion.p>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`p-8 rounded-lg card-shadow relative ${
                  plan.badge === 'Beliebt'
                    ? 'bg-gradient-to-br from-primary to-primary-hover'
                    : 'bg-dark-card'
                }`}
              >
                {plan.badge && (
                  <div className="absolute top-4 right-4 bg-warning text-dark-bg px-3 py-1 rounded-full text-sm font-bold">
                    {plan.badge}
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-text-secondary">{plan.period}</span>}
                </div>
                <p className="text-text-secondary mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Award size={16} className="flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${
                    plan.badge === 'Beliebt'
                      ? 'bg-white text-dark-bg hover:bg-gray-100'
                      : ''
                  }`}
                  variant={plan.badge === 'Beliebt' ? undefined : 'secondary'}
                >
                  {plan.price === 'Individuell' ? 'Kontakt aufnehmen' : '7 Tage kostenlos testen'}
                </Button>
              </motion.div>
            ))}
          </div>

          <p className="text-center mt-8 text-text-secondary">
            ✓ Keine Vertragsbindung • ✓ Monatlich kündbar • ✓ 7 Tage Geld-zurück-Garantie
          </p>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary to-primary-hover">
        <div className="w-full text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold mb-6"
          >
            Bereit, bessere Kandidaten zu finden?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="text-xl mb-8"
          >
            Starten Sie heute – keine Kreditkarte für Trial nötig
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="large"
              className="bg-white text-dark-bg hover:bg-gray-100"
              onClick={() => navigate('/unternehmen/dashboard')}
            >
              7 Tage kostenlos testen
            </Button>
            <Button
              size="large"
              variant="secondary"
              className="border-white text-white"
              icon={Calendar}
            >
              Demo vereinbaren (15 Min)
            </Button>
          </motion.div>
          <p className="mt-6 text-sm">
            Über 150 Unternehmen vertrauen DYD • Ø 4.8/5 Sterne • Keine Vertragsbindung
          </p>
        </div>
      </section>

      <footer className="bg-dark-card py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">Produkt</h4>
              <div className="space-y-2 text-text-secondary">
                <a href="#" className="block hover:text-white">Features</a>
                <a href="#" className="block hover:text-white">Pricing</a>
                <a href="#" className="block hover:text-white">Demo</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Unternehmen</h4>
              <div className="space-y-2 text-text-secondary">
                <a href="#" className="block hover:text-white">Über uns</a>
                <a href="/" className="block hover:text-white">Für Kandidaten</a>
                <a href="#" className="block hover:text-white">Kontakt</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Ressourcen</h4>
              <div className="space-y-2 text-text-secondary">
                <a href="#" className="block hover:text-white">Blog</a>
                <a href="#" className="block hover:text-white">Case Studies</a>
                <a href="#" className="block hover:text-white">Hilfe</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <div className="space-y-2 text-text-secondary">
                <a href="#" className="block hover:text-white">Datenschutz</a>
                <a href="#" className="block hover:text-white">Impressum</a>
                <a href="#" className="block hover:text-white">AGB</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white border-opacity-10 pt-8 text-center text-text-secondary">
            © 2025 DYD Business. Recruiting neu gedacht.
          </div>
        </div>
      </footer>
    </div>
  );
}
