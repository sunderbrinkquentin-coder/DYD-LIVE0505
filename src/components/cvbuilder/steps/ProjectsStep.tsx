import { useState } from 'react';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { WizardStepLayout } from '../WizardStepLayout';
import { Project } from '../../../types/cvBuilder';

interface ProjectsStepProps {
  data?: Project[];
  experienceLevel?: string;
  onChange: (projects: Project[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const STUDENT_PRESETS: Project[] = [
  {
    title: 'Schulprojekt: Organisation des Abiballs',
    role: 'Schulprojekt',
    description:
      'Planung, Organisation und Durchführung des Abiballs gemeinsam mit einem 8-köpfigen Team.',
    bulletPoints: [
      'Mitverantwortung für Budgetplanung und Sponsorenanfragen',
      'Koordination von Location, Catering und Technik',
      'Kommunikation mit Jahrgang und Dienstleistern (Infos, Tickets, Rückfragen)',
    ],
  },
  {
    title: 'IT-Projekt: Eigene Portfolio-Website',
    role: 'Freizeitprojekt',
    description:
      'Erstellung einer einfachen persönlichen Website, um Projekte und Lebenslauf zu präsentieren.',
    bulletPoints: [
      'Grundlagen in HTML, CSS und einfachen JavaScript-Komponenten angewendet',
      'Strukturierte Darstellung von Lebenslauf, Projekten und Kontaktdaten',
      'Selbstständige Einarbeitung in ein Website-Builder-Tool / GitHub Pages',
    ],
  },
  {
    title: 'Ehrenamt: Jugendfußball-Trainer',
    role: 'Ehrenamtliches Projekt',
    description: 'Wöchentliches Training und Betreuung einer Jugendmannschaft im Sportverein.',
    bulletPoints: [
      'Planung und Durchführung von wöchentlichen Trainingseinheiten',
      'Verantwortung für 12 Kinder im Alter von 10–12 Jahren',
      'Koordination mit Eltern und Vereinsleitung',
    ],
  },
  {
    title: 'Schülerfirma: Schulkantine Catering',
    role: 'Schulprojekt',
    description: 'Mitarbeit in einer Schülerfirma, die das Catering bei Schulveranstaltungen organisiert.',
    bulletPoints: [
      'Einkauf, Kalkulation und Verkauf von Speisen und Getränken',
      'Teamkoordination und Aufgabenverteilung im 5-köpfigen Team',
      'Gewinnoptimierung durch kosteneffiziente Einkaufsstrategie',
    ],
  },
  {
    title: 'Social Media: Instagram-Kanal aufgebaut',
    role: 'Freizeitprojekt',
    description: 'Eigenständiger Aufbau eines themenspezifischen Instagram-Kanals.',
    bulletPoints: [
      'Content-Planung und regelmäßige Erstellung von Beiträgen',
      'Wachstum von 0 auf XX Follower innerhalb von X Monaten',
      'Grundlagen in Bildbearbeitung und Social-Media-Analyse',
    ],
  },
];

const selectBase =
  'w-full px-3 py-2 rounded-lg bg-white/10 border border-white/25 text-white text-sm md:text-base focus:outline-none focus:border-[#66c0b6]';

export function ProjectsStep({
  data,
  experienceLevel,
  onChange,
  onNext,
  onBack,
}: ProjectsStepProps) {
  const isBeginner = experienceLevel === 'beginner';
  const [projects, setProjects] = useState<Project[]>(
    data && data.length > 0
      ? data
      : [{ title: '', description: '', role: '', bulletPoints: [] }]
  );

  const update = (index: number, field: keyof Project, value: any) => {
    setProjects((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      onChange(updated);
      return updated;
    });
  };

  const addProject = () =>
    setProjects((prev) => {
      const updated = [...prev, { title: '', description: '', role: '', bulletPoints: [] }];
      onChange(updated);
      return updated;
    });

  const removeProject = (index: number) =>
    setProjects((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      onChange(updated);
      return updated;
    });

  const handleNext = () => {
    onNext();
  };

  const applyPresetToIndex = (projectIndex: number, preset: Project) => {
    setProjects((prev) => {
      const updated = [...prev];
      updated[projectIndex] = { ...preset };
      onChange(updated);
      return updated;
    });
  };

  return (
    <WizardStepLayout
      title={isBeginner ? 'Deine Projekte & Aktivitäten' : 'Projekte'}
      subtitle={
        isBeginner
          ? 'Hier glänzt du! Zeig Schulprojekte, Ehrenamt, eigene Ideen – alles zählt.'
          : 'Optional: Schul-, Uni- oder Freizeitprojekte, die deinen Lebenslauf stärker machen.'
      }
      avatarMessage={isBeginner ? 'Das ist deine Bühne!' : 'Projekt = Praxis!'}
      avatarStepInfo={
        isBeginner
          ? 'Ohne Berufserfahrung sind Projekte dein stärkstes Argument. Jede Initiative, jedes Ehrenamt zählt.'
          : 'Auch kleine Projekte zeigen, dass du Verantwortung übernimmst und Dinge zu Ende bringst.'
      }
      currentStepId="projects"
      onPrev={onBack}
      onNext={handleNext}
      isNextDisabled={false}
      hideProgress
    >
      <div className="space-y-4">
        {isBeginner && (
          <div className="bg-[#66c0b6]/10 border border-[#66c0b6]/30 rounded-xl px-4 py-3 text-sm text-[#66c0b6] leading-relaxed">
            Für Schüler:innen und Studierende sind Projekte der wichtigste Teil des Lebenslaufs.
            Nutze die Vorlagen unten – passe sie einfach an deine eigene Erfahrung an!
          </div>
        )}
        <p className="text-xs text-white/60">
          Du kannst hier{' '}
          <span className="font-semibold text-white">Schul-, Uni- oder Freizeitprojekte</span>{' '}
          aufnehmen – z.&nbsp;B. Abi-Orga, Website, Ehrenamt, Schülerfirma, Gaming-Turnier, Social
          Media, etc.
        </p>

        {projects.map((proj, index) => (
          <div
            key={index}
            className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 space-y-3"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-white font-semibold text-base">
                Projekt {index + 1}
              </h3>
              {projects.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProject(index)}
                  className="text-red-400 hover:text-red-500 flex items-center gap-1 text-sm"
                >
                  <Trash2 size={16} />
                  Entfernen
                </button>
              )}
            </div>

            {/* Schnellstart-Vorlagen */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-[#66c0b6]" size={16} />
                <p className="text-xs text-white/80">
                  Wenig Erfahrung? Nutze eine Vorlage – besonders für Schüler:innen geeignet:
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {STUDENT_PRESETS.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => applyPresetToIndex(index, preset)}
                    className="px-3 py-1.5 rounded-full bg-white/10 text-xs text-white/90 hover:bg-white/20 border border-white/20 transition-all"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Art des Projekts (Dropdown mit Kontrast) */}
            <div>
              <label className="block text-white/80 text-xs font-medium mb-1">
                Art des Projekts (optional)
              </label>
              <select
                value={proj.role || ''}
                onChange={(e) => update(index, 'role', e.target.value)}
                className={selectBase}
              >
                <option value="">Bitte auswählen…</option>
                <option value="Schulprojekt">Schulprojekt</option>
                <option value="Studienprojekt">Studienprojekt</option>
                <option value="Freizeitprojekt">Freizeitprojekt</option>
                <option value="Ehrenamtliches Projekt">Ehrenamtliches Projekt</option>
                <option value="Nebenjob-Projekt">Projekt im Nebenjob</option>
              </select>
            </div>

            {/* Titel */}
            <div>
              <label className="block text-white/80 text-xs font-medium mb-1">
                Projekttitel *
              </label>
              <input
                value={proj.title}
                onChange={(e) => update(index, 'title', e.target.value)}
                placeholder="z. B. Organisation des Abiballs, Portfolio-Website, Social-Media-Projekt"
                className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-white placeholder-white/40 border border-white/25 focus:outline-none focus:border-[#66c0b6]"
              />
            </div>

            {/* Kurzbeschreibung */}
            <div>
              <label className="block text-white/80 text-xs font-medium mb-1">
                Kurzbeschreibung (optional)
              </label>
              <textarea
                value={proj.description || ''}
                onChange={(e) => update(index, 'description', e.target.value)}
                placeholder="Worum ging es in dem Projekt? Mit wem hast du zusammengearbeitet? Was war das Ziel?"
                className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-white placeholder-white/40 border border-white/25 focus:outline-none focus:border-[#66c0b6] resize-none min-h-[60px]"
              />
            </div>

            {/* Bulletpoints */}
            <div>
              <label className="block text-white/80 text-xs font-medium mb-1">
                Bulletpoints – was hast du konkret gemacht? (jede Zeile = 1 Punkt)
              </label>
              <textarea
                value={(proj.bulletPoints || []).join('\n')}
                onChange={(e) =>
                  update(
                    index,
                    'bulletPoints',
                    e.target.value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="- Mitverantwortung für Budgetplanung
- Koordination von Location und Dienstleistern
- Kommunikation mit Team / Teilnehmer:innen"
                className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-white placeholder-white/40 border border-white/25 focus:outline-none focus:border-[#66c0b6] resize-none min-h-[80px]"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addProject}
          className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center gap-2 text-sm border border-white/15"
        >
          <Plus size={18} /> Projekt hinzufügen
        </button>

        <p className="text-xs text-white/60">
          Tipp: Projekte sind optional, können aber gerade bei Schüler:innen und Berufseinsteiger:innen
          den Unterschied machen – alles, was Verantwortung, Teamarbeit oder Eigeninitiative zeigt,
          ist hier Gold wert.
        </p>
      </div>
    </WizardStepLayout>
  );
}
