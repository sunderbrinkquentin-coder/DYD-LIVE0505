import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { CVBuilderData } from '../../../types/cvBuilder';

interface CompletionStepProps {
  cvData: CVBuilderData;
  onComplete: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function CompletionStep({ cvData, onComplete, onBack, isLoading = false }: CompletionStepProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#020617] via-[#0a0a1a] to-[#020617]">
      <div className="max-w-4xl w-full text-center space-y-12 animate-fade-in">
        <div className="space-y-6">
          <h1 className="text-6xl font-bold text-white">Perfekt! 🎉</h1>
          <p className="text-2xl text-white/70 max-w-2xl mx-auto">
            Dein CV ist bereit! Jetzt fehlt nur noch die Zielposition.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-2xl mx-auto">
          <div className="space-y-6 text-left">
            <h3 className="text-xl font-semibold text-white/90">Dein Profil enthält:</h3>

            <div className="space-y-4">
              {cvData.personalData && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#66c0b6]">✓</span>
                    <span className="font-semibold text-white">Persönliche Daten</span>
                  </div>
                  <p className="text-sm text-white/60 ml-6">
                    {cvData.personalData.firstName} {cvData.personalData.lastName} • {cvData.personalData.city}
                  </p>
                </div>
              )}

              {cvData.schoolEducation && cvData.schoolEducation.length > 0 && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#66c0b6]">✓</span>
                    <span className="font-semibold text-white">
                      {cvData.schoolEducation.length} Schulbildung{cvData.schoolEducation.length > 1 ? 'en' : ''}
                    </span>
                  </div>
                  <div className="text-sm text-white/60 ml-6 space-y-1">
                    {cvData.schoolEducation.map((edu, i) => (
                      <p key={i}>{edu.type} • {edu.school}</p>
                    ))}
                  </div>
                </div>
              )}

              {cvData.professionalEducation && cvData.professionalEducation.length > 0 && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#66c0b6]">✓</span>
                    <span className="font-semibold text-white">
                      {cvData.professionalEducation.length} Ausbildung{cvData.professionalEducation.length > 1 ? 'en' : ''}
                    </span>
                  </div>
                  <div className="text-sm text-white/60 ml-6 space-y-1">
                    {cvData.professionalEducation.map((edu, i) => (
                      <p key={i}>{edu.degree} • {edu.institution}</p>
                    ))}
                  </div>
                </div>
              )}

              {cvData.workExperiences && cvData.workExperiences.length > 0 && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#66c0b6]">✓</span>
                    <span className="font-semibold text-white">
                      {cvData.workExperiences.length} Berufserfahrung{cvData.workExperiences.length > 1 ? 'en' : ''}
                    </span>
                  </div>
                  <div className="text-sm text-white/60 ml-6 space-y-1">
                    {cvData.workExperiences.map((exp, i) => (
                      <p key={i}>{exp.jobTitle} • {exp.company}</p>
                    ))}
                  </div>
                </div>
              )}

              {cvData.projects && cvData.projects.length > 0 && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-[#66c0b6]">✓</span>
                    <span className="font-semibold text-white">
                      {cvData.projects.length} Projekt{cvData.projects.length > 1 ? 'e' : ''}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {cvData.hardSkills && cvData.hardSkills.length > 0 && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-[#66c0b6]">✓</span>
                      <span className="font-semibold text-white text-sm">
                        {cvData.hardSkills.length} Hard Skills
                      </span>
                    </div>
                  </div>
                )}

                {cvData.softSkills && cvData.softSkills.length > 0 && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-[#66c0b6]">✓</span>
                      <span className="font-semibold text-white text-sm">
                        {cvData.softSkills.length} Soft Skills
                      </span>
                    </div>
                  </div>
                )}

                {cvData.languages && cvData.languages.length > 0 && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-[#66c0b6]">✓</span>
                      <span className="font-semibold text-white text-sm">
                        {cvData.languages.length} Sprache{cvData.languages.length > 1 ? 'n' : ''}
                      </span>
                    </div>
                  </div>
                )}

                {cvData.hobbies && cvData.hobbies.hobbies && cvData.hobbies.hobbies.length > 0 && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-[#66c0b6]">✓</span>
                      <span className="font-semibold text-white text-sm">
                        {cvData.hobbies.hobbies.length} Hobby{cvData.hobbies.hobbies.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onBack}
            className="group px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Zurück
          </button>

          <button
            onClick={onComplete}
            disabled={isLoading}
            className="group px-12 py-5 rounded-2xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-xl shadow-2xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                Daten werden vorbereitet...
              </>
            ) : (
              <>
                Weiter zu deiner Wunschstelle
                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        <p className="text-sm text-white/40">
          Im nächsten Schritt passen wir deinen CV perfekt auf deine Wunschstelle an
        </p>
      </div>
    </div>
  );
}
