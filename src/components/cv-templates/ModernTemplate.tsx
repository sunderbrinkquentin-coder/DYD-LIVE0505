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

export function ModernTemplate({ data }: TemplateProps) {
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
    <div className="bg-white text-gray-900 shadow-2xl" style={{ width: '794px', minHeight: '1123px' }}>
      <div className="grid grid-cols-[280px_1fr]">
        <div className="bg-gradient-to-b from-[#2c3e50] to-[#34495e] text-white p-8">
          <div className="space-y-6">
            {photoUrl && (
              <div className="flex justify-center mb-4">
                <img
                  src={photoUrl}
                  alt={`${firstName} ${lastName}`}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white/20 shadow-lg"
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold mb-1">{firstName}</h1>
              <h1 className="text-2xl font-bold mb-4">{lastName}</h1>
            </div>

            <div className="space-y-3 text-sm">
              {email && (
                <div className="flex items-start gap-2">
                  <Mail size={16} className="mt-0.5 flex-shrink-0" />
                  <span className="break-all">{email}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-2">
                  <Phone size={16} className="flex-shrink-0" />
                  <span>{phone}</span>
                </div>
              )}
              {city && (
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{city}{zipCode ? `, ${zipCode}` : ''}</span>
                </div>
              )}
              {linkedin && (
                <div className="flex items-start gap-2">
                  <Linkedin size={16} className="mt-0.5 flex-shrink-0" />
                  <span className="break-all text-xs">{linkedin}</span>
                </div>
              )}
              {website && (
                <div className="flex items-start gap-2">
                  <Globe size={16} className="mt-0.5 flex-shrink-0" />
                  <span className="break-all text-xs">{website}</span>
                </div>
              )}
            </div>

            {data.hardSkills && data.hardSkills.length > 0 && (
              <div className="pt-4 border-t border-white/20">
                <h2 className="text-sm font-bold mb-3 uppercase tracking-wide">Fachkompetenzen</h2>
                <div className="space-y-2">
                  {data.hardSkills.map((skill, index) => (
                    <div key={index} className="text-sm">{skill}</div>
                  ))}
                </div>
              </div>
            )}

            {data.softSkills && data.softSkills.length > 0 && (
              <div className="pt-4 border-t border-white/20">
                <h2 className="text-sm font-bold mb-3 uppercase tracking-wide">Soft Skills</h2>
                <div className="space-y-2">
                  {data.softSkills.map((skill, index) => (
                    <div key={index} className="text-sm">{skill}</div>
                  ))}
                </div>
              </div>
            )}

            {data.languages && data.languages.length > 0 && (
              <div className="pt-4 border-t border-white/20">
                <h2 className="text-sm font-bold mb-3 uppercase tracking-wide">Sprachen</h2>
                <div className="space-y-2">
                  {data.languages.map((lang, index) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium">{lang.language}</div>
                      <div className="text-xs text-white/80">{lang.level}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-10 space-y-8">
          {data.profileSummary && (
            <div>
              <h2 className="text-2xl font-bold text-[#2c3e50] mb-3 pb-2 border-b-2 border-[#2c3e50]">Profil</h2>
              <p className="text-sm text-gray-700 leading-relaxed">{data.profileSummary}</p>
            </div>
          )}

          {data.experience && data.experience.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-[#2c3e50] mb-4 pb-2 border-b-2 border-[#2c3e50]">Berufserfahrung</h2>
              <div className="space-y-5">
                {data.experience.map((exp, index) => (
                  <div key={index}>
                    <div className="mb-2">
                      <h3 className="font-bold text-gray-900 text-lg">{exp.position}</h3>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600 font-medium">{exp.company}</p>
                        <span className="text-sm text-gray-700 font-semibold">
                          {exp.startDate} - {exp.current ? 'heute' : exp.endDate}
                        </span>
                      </div>
                    </div>
                    {exp.responsibilities && exp.responsibilities.length > 0 && (
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {exp.responsibilities.map((resp, i) => (
                          <li key={i}>{resp}</li>
                        ))}
                      </ul>
                    )}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mt-1">
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

          {data.projects && data.projects.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-[#2c3e50] mb-4 pb-2 border-b-2 border-[#2c3e50]">Projekte</h2>
              <div className="space-y-4">
                {data.projects.map((project, index) => (
                  <div key={index}>
                    <div className="mb-1">
                      <h3 className="font-bold text-gray-900">{project.title}</h3>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">{project.role}</p>
                        <span className="text-sm text-gray-700 font-semibold">
                          {project.startDate} - {project.endDate}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{project.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.education && data.education.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-[#2c3e50] mb-4 pb-2 border-b-2 border-[#2c3e50]">Ausbildung</h2>
              <div className="space-y-4">
                {data.education.map((edu, index) => (
                  <div key={index}>
                    <div className="mb-1">
                      <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">{edu.institution}</p>
                          {edu.fieldOfStudy && (
                            <p className="text-sm text-gray-600">{edu.fieldOfStudy}</p>
                          )}
                        </div>
                        <span className="text-sm text-gray-700 font-semibold whitespace-nowrap ml-2">
                          {edu.startDate} - {edu.endDate}
                        </span>
                      </div>
                    </div>
                    {edu.grade && (
                      <p className="text-sm text-gray-600">Note: {edu.grade}</p>
                    )}
                    {edu.description && (
                      <p className="text-sm text-gray-700 mt-1">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
