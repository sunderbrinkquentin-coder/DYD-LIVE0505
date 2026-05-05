import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';

interface TemplateProps {
  data: {
    personalData: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      city: string;
      zipCode: string;
      linkedin?: string;
      website?: string;
    };
    profileSummary: string;
    salesPitch: string;
    education: Array<{
      degree: string;
      institution: string;
      field?: string;
      startDate: string;
      endDate: string;
      grade?: string;
    }>;
    experience: Array<{
      position: string;
      company: string;
      startDate: string;
      endDate: string;
      current: boolean;
      responsibilities: string[];
      achievements: string[];
    }>;
    projects: Array<{
      title: string;
      role: string;
      startDate: string;
      endDate: string;
      description: string;
    }>;
    languages: Array<{
      language: string;
      level: string;
    }>;
    hardSkills: string[];
    softSkills: string[];
  };
}

export function CompactTemplate({ data }: TemplateProps) {
  if (!data || !data.personalData) {
    return (
      <div className="p-6 text-sm text-red-500">
        Es sind noch keine vollständigen CV-Daten vorhanden. Bitte gehe den CV-Prozess einmal durch.
      </div>
    );
  }

  const personal = data.personalData || {};
  const firstName = personal.firstName || '';
  const lastName = personal.lastName || '';
  const city = personal.city || '';
  const zipCode = personal.zipCode || '';
  const email = personal.email || '';
  const phone = personal.phone || '';
  const linkedin = personal.linkedin || '';
  const website = personal.website || '';
  const photoUrl = personal.photoUrl || '';

  return (
    <div className="bg-white text-gray-900 p-8 shadow-2xl" style={{ width: '794px', minHeight: '1123px', fontFamily: 'Georgia, serif' }}>
      <div className="space-y-6">
        <div className="text-center border-b border-gray-300 pb-4">
          {photoUrl && (
            <div className="flex justify-center mb-3">
              <img
                src={photoUrl}
                alt={`${firstName} ${lastName}`}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
              />
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {firstName} {lastName}
          </h1>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-600">
            {email && (
              <span className="flex items-center gap-1">
                <Mail size={12} /> {email}
              </span>
            )}
            {phone && (
              <span className="flex items-center gap-1">
                <Phone size={12} /> {phone}
              </span>
            )}
            {city && (
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {city}{zipCode ? `, ${zipCode}` : ''}
              </span>
            )}
            {linkedin && (
              <span className="flex items-center gap-1">
                <Linkedin size={12} /> LinkedIn
              </span>
            )}
            {website && (
              <span className="flex items-center gap-1">
                <Globe size={12} /> Website
              </span>
            )}
          </div>
        </div>

        {data.profileSummary && (
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider border-b border-gray-300 pb-1">Profil</h2>
            <p className="text-xs text-gray-700 leading-relaxed">{data.profileSummary}</p>
          </div>
        )}

        {data.experience && data.experience.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider border-b border-gray-300 pb-1">Berufserfahrung</h2>
            <div className="space-y-3">
              {data.experience.map((exp, index) => (
                <div key={index}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-gray-900 text-sm">{exp.position}</h3>
                    <span className="text-sm text-gray-700 font-semibold whitespace-nowrap ml-2">
                      {exp.startDate} - {exp.current ? 'heute' : exp.endDate}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 italic mb-1">{exp.company}</p>
                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <ul className="list-disc list-inside text-xs text-gray-700 space-y-0.5 ml-2">
                      {exp.responsibilities.map((resp, i) => (
                        <li key={i}>{resp}</li>
                      ))}
                    </ul>
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <ul className="list-disc list-inside text-xs text-gray-700 space-y-0.5 ml-2">
                      {exp.achievements.map((ach, i) => (
                        <li key={i}>{ach}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div>
            {data.education && data.education.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider border-b border-gray-300 pb-1">Ausbildung</h2>
                <div className="space-y-2">
                  {data.education.map((edu, index) => (
                    <div key={index}>
                      <h3 className="font-bold text-gray-900 text-xs">{edu.degree}</h3>
                      <p className="text-xs text-gray-600">{edu.institution}</p>
                      {edu.field && (
                        <p className="text-xs text-gray-600">{edu.field}</p>
                      )}
                      <p className="text-sm text-gray-700 font-semibold">
                        {edu.startDate} - {edu.endDate}
                      </p>
                      {edu.grade && (
                        <p className="text-xs text-gray-600">Note: {edu.grade}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.projects && data.projects.length > 0 && (
              <div className="mt-4">
                <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider border-b border-gray-300 pb-1">Projekte</h2>
                <div className="space-y-2">
                  {data.projects.map((project, index) => (
                    <div key={index}>
                      <h3 className="font-bold text-gray-900 text-xs">{project.title}</h3>
                      <p className="text-xs text-gray-600">{project.role}</p>
                      <p className="text-sm text-gray-700 font-semibold">
                        {project.startDate} - {project.endDate}
                      </p>
                      <p className="text-xs text-gray-700 mt-0.5">{project.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            {data.hardSkills && data.hardSkills.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider border-b border-gray-300 pb-1">Fachkompetenzen</h2>
                <div className="text-xs text-gray-700 leading-relaxed">
                  {data.hardSkills.join(' • ')}
                </div>
              </div>
            )}

            {data.softSkills && data.softSkills.length > 0 && (
              <div className="mt-4">
                <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider border-b border-gray-300 pb-1">Soft Skills</h2>
                <div className="text-xs text-gray-700 leading-relaxed">
                  {data.softSkills.join(' • ')}
                </div>
              </div>
            )}

            {data.languages && data.languages.length > 0 && (
              <div className="mt-4">
                <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider border-b border-gray-300 pb-1">Sprachen</h2>
                <div className="space-y-1">
                  {data.languages.map((lang, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-gray-700">{lang.language}</span>
                      <span className="text-gray-600">{lang.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
