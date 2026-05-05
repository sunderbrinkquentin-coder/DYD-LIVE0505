import { motion } from 'framer-motion';
import { Users, Briefcase, MessageCircle, CheckCircle, Eye, Target, Plus } from 'lucide-react';
import Button from '../components/Button';

export default function B2BDashboard() {
  const kpis = [
    {
      icon: Users,
      label: 'Aktive Kandidaten',
      value: '12.847',
      change: '+142 diese Woche',
      trend: 'up',
    },
    {
      icon: Briefcase,
      label: 'Offene Stellen',
      value: '3',
      change: '47 Matches gefunden',
      trend: 'neutral',
    },
    {
      icon: MessageCircle,
      label: 'Antworten ausstehend',
      value: '8',
      change: 'Ø Response-Zeit: 4.2h',
      trend: 'neutral',
    },
    {
      icon: CheckCircle,
      label: 'Hires diesen Monat',
      value: '2',
      change: 'vs. 0 letzten Monat',
      trend: 'up',
    },
  ];

  const activeJobs = [
    {
      title: 'Senior Product Manager',
      department: 'Product',
      location: 'München',
      posted: 'Vor 5 Tagen',
      matches: {
        total: 23,
        new: 5,
        contacted: 8,
        responded: 4,
        interviews: 2,
      },
    },
    {
      title: 'Software Engineer',
      department: 'Engineering',
      location: 'Remote',
      posted: 'Vor 2 Tagen',
      matches: {
        total: 18,
        new: 3,
        contacted: 5,
        responded: 3,
        interviews: 1,
      },
    },
  ];

  const topMatches = [
    {
      name: 'Max M.',
      title: 'Product Manager',
      location: 'München',
      experience: '5 Jahre',
      matchScore: 94,
      matchJob: 'Senior Product Manager',
      highlights: [
        '✓ 8 von 9 Requirements',
        '✓ Sofort verfügbar',
        '✓ Gehalt passt',
      ],
    },
    {
      name: 'Lisa R.',
      title: 'Software Engineer',
      location: 'Berlin',
      experience: '3 Jahre',
      matchScore: 91,
      matchJob: 'Software Engineer',
      highlights: [
        '✓ 7 von 8 Requirements',
        '✓ Remote bevorzugt',
        '✓ Top Skills Match',
      ],
    },
  ];

  const activities = [
    {
      icon: MessageCircle,
      text: 'Max M. hat auf Ihre Nachricht geantwortet',
      time: 'Vor 1 Stunde',
      action: 'Antworten',
    },
    {
      icon: Users,
      text: '5 neue Kandidaten matchen mit "Senior PM"',
      time: 'Vor 3 Stunden',
      action: 'Ansehen',
    },
    {
      icon: CheckCircle,
      text: 'Lisa R. hat Interview-Termin bestätigt',
      time: 'Gestern, 16:20',
      action: 'Kalender',
    },
  ];

  return (
    <div className="min-h-screen gradient-bg">
      <div className="bg-dark-card border-b border-white border-opacity-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Willkommen zurück, Anna! 👋</h1>
              <p className="text-text-secondary">Hier ist Ihre Recruiting-Übersicht</p>
            </div>
            <div className="flex gap-4">
              <Button icon={Plus}>Neue Stelle anlegen</Button>
              <Button variant="secondary" icon={Users}>Kandidaten durchsuchen</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {kpis.map((kpi, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-dark-card p-6 rounded-lg card-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <kpi.icon className="text-primary" size={32} />
                {kpi.trend === 'up' && <span className="text-success text-sm">↑</span>}
              </div>
              <div className="text-3xl font-bold mb-2">{kpi.value}</div>
              <div className="text-sm text-text-secondary mb-1">{kpi.label}</div>
              <div className="text-xs text-text-secondary">{kpi.change}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-dark-card p-6 rounded-lg card-shadow">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Ihre offenen Stellen</h2>
              <Button size="small" icon={Plus}>Neue Stelle</Button>
            </div>
            <div className="space-y-4">
              {activeJobs.map((job, index) => (
                <div key={index} className="p-4 bg-dark-bg rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{job.title}</h3>
                      <p className="text-sm text-text-secondary">
                        {job.department} • {job.location} • {job.posted}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-center text-sm mb-3">
                    <div>
                      <div className="font-bold text-primary">{job.matches.total}</div>
                      <div className="text-xs text-text-secondary">Total</div>
                    </div>
                    <div>
                      <div className="font-bold">{job.matches.new}</div>
                      <div className="text-xs text-text-secondary">Neu</div>
                    </div>
                    <div>
                      <div className="font-bold">{job.matches.contacted}</div>
                      <div className="text-xs text-text-secondary">Kontaktiert</div>
                    </div>
                    <div>
                      <div className="font-bold">{job.matches.responded}</div>
                      <div className="text-xs text-text-secondary">Geantwortet</div>
                    </div>
                    <div>
                      <div className="font-bold text-success">{job.matches.interviews}</div>
                      <div className="text-xs text-text-secondary">Interviews</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="small" className="flex-1" icon={Eye}>Matches ansehen</Button>
                    <Button size="small" variant="ghost">Bearbeiten</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-dark-card p-6 rounded-lg card-shadow">
            <h2 className="text-2xl font-bold mb-6">Neue Top-Matches</h2>
            <div className="space-y-4">
              {topMatches.map((candidate, index) => (
                <div key={index} className="p-4 bg-dark-bg rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold">{candidate.name}</h3>
                      <p className="text-sm text-text-secondary mb-1">
                        {candidate.title} • {candidate.experience}
                      </p>
                      <p className="text-xs text-text-secondary">{candidate.location}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{candidate.matchScore}%</div>
                      <div className="text-xs text-text-secondary">Match</div>
                    </div>
                  </div>
                  <div className="space-y-1 mb-3">
                    {candidate.highlights.map((highlight, i) => (
                      <p key={i} className="text-xs text-text-secondary">
                        {highlight}
                      </p>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="small" className="flex-1" icon={Eye}>Profil ansehen</Button>
                    <Button size="small" icon={MessageCircle}>Kontakt</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-dark-card p-6 rounded-lg card-shadow">
          <h2 className="text-2xl font-bold mb-6">Aktivitäten</h2>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-dark-bg rounded-lg">
                <activity.icon className="text-primary flex-shrink-0 mt-1" size={20} />
                <div className="flex-1">
                  <p className="mb-1">{activity.text}</p>
                  <p className="text-sm text-text-secondary">{activity.time}</p>
                </div>
                <button className="text-sm text-primary hover:underline">
                  {activity.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
