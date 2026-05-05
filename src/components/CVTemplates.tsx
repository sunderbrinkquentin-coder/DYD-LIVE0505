import { Mail, Phone, MapPin, Globe } from 'lucide-react';

interface CVData {
  name: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  profile: string;
  address?: string;
  experience: Array<{
    position: string;
    company: string;
    timeframe: string;
    bullets: string[];
    groupName?: string;
    selectedExperience?: Array<{
      title: string;
      description: string;
    }>;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    timeframe: string;
    details?: string;
    city?: string;
    country?: string;
    gpa?: string;
    gpaScale?: string;
    sat?: string;
    honors?: string[];
    relevantCoursework?: string[];
  }>;
  skills: string[];
  languages?: Array<{
    name: string;
    level: string;
  }>;
  projects?: Array<{
    title: string;
    description: string;
  }>;
  technicalSkills?: string[];
  certifications?: string[];
  activities?: Array<{
    organization: string;
    position: string;
    timeframe: string;
    city?: string;
    country?: string;
    bullets: string[];
  }>;
  interests?: string;
}

interface CVTemplateProps {
  data: CVData;
  photo?: string | null;
  showPhoto: boolean;
}

export function ModernTemplate({ data, photo, showPhoto }: CVTemplateProps) {
  const hasPhoto = showPhoto && photo;

  return (
    <div className="cv-template-container bg-white" style={{ margin: '0 auto', padding: 0, boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Inter, sans-serif' }}>
      {/* Header with accent color */}
      <header
        className="cv-template-header flex flex-col sm:flex-row items-center gap-5 p-4 sm:p-8 print:flex-row print:p-8"
        style={{ background: '#89a7b2', color: 'white' }}
      >
        {hasPhoto && (
          <div
            className="rounded-full overflow-hidden flex-shrink-0 mb-4 sm:mb-0 print:mb-0"
            style={{
              width: '90px',
              height: '90px',
              border: '2px solid rgba(255,255,255,0.6)',
              background: '#d9d9d9',
            }}
          >
            <img
              src={photo!}
              alt={`Foto ${data.name}`}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5 text-center sm:text-left flex-1 print:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'white' }}>
            {data.name}
          </h1>
          <p className="text-sm sm:text-base opacity-90">{data.jobTitle}</p>
          <div className="text-xs sm:text-sm opacity-90 flex flex-col sm:flex-row sm:gap-2">
            <span>{data.location}</span>
            <span className="hidden sm:inline">·</span>
            <span>{data.phone}</span>
            <span className="hidden sm:inline">·</span>
            <span className="break-all">{data.email}</span>
          </div>
        </div>
      </header>

      {/* Content Grid - 2 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 px-4 sm:px-9 py-4 sm:py-7 print:grid-cols-2 print:px-9 print:py-7 print:gap-8" style={{ lineHeight: 1.45, position: 'relative' }}>
        {/* Left Column */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Profil Section */}
          <section className="mb-6" style={{ breakInside: 'avoid' }}>
            <h2
              className="text-sm font-semibold uppercase mb-2.5"
              style={{
                letterSpacing: '1px',
                color: '#333',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '4px',
              }}
            >
              Profil
            </h2>
            <p className="text-sm mt-1.5" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{data.profile}</p>
          </section>

          {/* Berufserfahrung Section */}
          <section className="mb-6">
            <h2
              className="text-sm font-semibold uppercase mb-2.5"
              style={{
                letterSpacing: '1px',
                color: '#333',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '4px',
              }}
            >
              Berufserfahrung
            </h2>
            <div className="space-y-3">
              {data.experience.map((exp, index) => (
                <div key={index} className="mb-3" style={{ breakInside: 'avoid' }}>
                  <div className="font-semibold text-sm">{exp.position}</div>
                  <div className="text-sm" style={{ color: '#444' }}>
                    {exp.company}
                  </div>
                  <div className="text-xs" style={{ color: '#777' }}>
                    {exp.timeframe}
                  </div>
                  <ul className="mt-1.5 space-y-1" style={{ paddingLeft: '20px', listStyleType: 'disc', listStylePosition: 'outside', margin: '8px 0 0 20px' }}>
                    {exp.bullets.map((bullet, i) => (
                      <li key={i} className="text-sm" style={{ paddingLeft: '4px' }}>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Projekte Section */}
          {data.projects && data.projects.length > 0 && (
            <section className="mb-6">
              <h2
                className="text-sm font-semibold uppercase mb-2.5"
                style={{
                  letterSpacing: '1px',
                  color: '#333',
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '4px',
                }}
              >
                Projekte
              </h2>
              <div className="space-y-3">
                {data.projects.map((project, index) => (
                  <div key={index} className="mb-3" style={{ breakInside: 'avoid' }}>
                    <div className="font-semibold text-sm">{project.title}</div>
                    <p className="text-sm mt-1" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{project.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Skills Section */}
          <section className="mb-6" style={{ breakInside: 'avoid' }}>
            <h2
              className="text-sm font-semibold uppercase mb-2.5"
              style={{
                letterSpacing: '1px',
                color: '#333',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '4px',
              }}
            >
              Skills & Kompetenzen
            </h2>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {data.skills.map((skill, index) => (
                <span
                  key={index}
                  className="text-xs px-2.5 py-1.5 rounded-lg"
                  style={{
                    border: '1px solid #e5e7eb',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>

          {/* Sprachen Section */}
          {data.languages && data.languages.length > 0 && (
            <section className="mb-6" style={{ breakInside: 'avoid' }}>
              <h2
                className="text-sm font-semibold uppercase mb-2.5"
                style={{
                  letterSpacing: '1px',
                  color: '#333',
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '4px',
                }}
              >
                Sprachen
              </h2>
              <div className="space-y-1.5">
                {data.languages.map((lang, index) => (
                  <div key={index} className="text-sm">
                    {lang.name}{' '}
                    <span style={{ color: '#777' }}>({lang.level})</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Bildung Section */}
          <section className="mb-6" style={{ breakInside: 'avoid' }}>
            <h2
              className="text-sm font-semibold uppercase mb-2.5"
              style={{
                letterSpacing: '1px',
                color: '#333',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '4px',
              }}
            >
              Bildung
            </h2>
            <div className="space-y-3.5">
              {data.education.map((edu, index) => (
                <div key={index} style={{ breakInside: 'avoid' }}>
                  <div className="font-semibold text-sm">{edu.degree}</div>
                  <div className="text-sm" style={{ color: '#444' }}>
                    {edu.institution}
                  </div>
                  <div className="text-xs" style={{ color: '#777' }}>
                    {edu.timeframe}
                  </div>
                  {edu.details && (
                    <div className="text-xs mt-1" style={{ color: '#777', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {edu.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function AzubiTemplate({ data, photo, showPhoto }: CVTemplateProps) {
  const hasPhoto = showPhoto && photo;

  return (
    <div className="cv-template-container bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      <header
        className="cv-template-header rounded-b-3xl p-4 sm:p-8 mb-4 sm:mb-8 print:p-8 print:mb-8"
        style={{
          background: 'linear-gradient(135deg, #4ECDC4 0%, #3DB8AE 100%)',
        }}
      >
        {hasPhoto && (
          <img
            src={photo!}
            alt={data.name}
            className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] rounded-full object-cover mx-auto mb-4"
            style={{
              border: '4px solid #FFFFFF',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          />
        )}

        <h1 className="text-2xl sm:text-4xl font-bold text-white text-center mb-2">{data.name}</h1>
        <p className="text-base sm:text-lg text-white text-center opacity-95 mb-4">{data.jobTitle}</p>

        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 flex-wrap text-xs sm:text-sm text-white">
          <span className="flex items-center gap-2">
            <Mail size={16} />
            {data.email}
          </span>
          <span className="flex items-center gap-2">
            <Phone size={16} />
            {data.phone}
          </span>
          <span className="flex items-center gap-2">
            <MapPin size={16} />
            {data.location}
          </span>
        </div>
      </header>

      <div className="px-4 sm:px-8 pb-4 sm:pb-8 print:px-8 print:pb-8">
        <section className="mb-8" style={{ breakInside: 'avoid' }}>
          <div
            className="inline-block px-5 py-3 rounded-lg font-bold text-lg mb-4"
            style={{ background: '#F0FDFA', color: '#1E3A8A' }}
          >
            Über mich
          </div>
          <p className="text-base leading-relaxed" style={{ color: '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {data.profile}
          </p>
        </section>

        <section className="mb-8">
          <div
            className="inline-block px-5 py-3 rounded-lg font-bold text-lg mb-5"
            style={{ background: '#F0FDFA', color: '#1E3A8A' }}
          >
            Berufserfahrung
          </div>
          <div className="space-y-6">
            {data.experience.map((exp, index) => (
              <div key={index} className="pl-4" style={{ borderLeft: '3px solid #4ECDC4', breakInside: 'avoid' }}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: '#0A1929' }}>
                      {exp.position}
                    </h3>
                    <p className="font-semibold" style={{ color: '#4ECDC4' }}>
                      {exp.company}
                    </p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ background: '#FFA726', color: '#FFFFFF' }}
                  >
                    {exp.timeframe}
                  </span>
                </div>
                <ul className="space-y-2 mt-3" style={{ paddingLeft: '20px', listStyleType: 'none', margin: '12px 0 0 0' }}>
                  {exp.bullets.map((bullet, i) => (
                    <li key={i} className="text-sm relative" style={{ color: '#4B5563', paddingLeft: '20px' }}>
                      <span className="absolute left-0" style={{ color: '#4ECDC4' }}>
                        ✓
                      </span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <div
            className="inline-block px-5 py-3 rounded-lg font-bold text-lg mb-5"
            style={{ background: '#F0FDFA', color: '#1E3A8A' }}
          >
            Bildung
          </div>
          <div className="space-y-4">
            {data.education.map((edu, index) => (
              <div key={index}>
                <div className="flex justify-between">
                  <h3 className="font-bold" style={{ color: '#0A1929' }}>
                    {edu.degree}
                  </h3>
                  <span className="text-sm" style={{ color: '#6B7280' }}>
                    {edu.timeframe}
                  </span>
                </div>
                <p style={{ color: '#4ECDC4' }}>{edu.institution}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div
            className="inline-block px-5 py-3 rounded-lg font-bold text-lg mb-5"
            style={{ background: '#F0FDFA', color: '#1E3A8A' }}
          >
            Meine Skills
          </div>
          <div className="flex flex-wrap gap-3">
            {data.skills.map((skill, index) => (
              <span
                key={index}
                className="px-4 py-2 rounded-full font-medium"
                style={{
                  background: index < 3 ? '#FFA726' : '#4ECDC4',
                  color: '#FFFFFF',
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function UniTemplate({ data, photo, showPhoto }: CVTemplateProps) {
  const hasPhoto = showPhoto && photo;

  return (
    <div
      className="cv-template-container bg-white p-4 sm:p-12 print:p-12"
      style={{ fontFamily: 'Georgia, serif' }}
    >
      <header
        className="cv-template-header pb-4 sm:pb-6 mb-4 sm:mb-8 print:pb-6 print:mb-8"
        style={{ borderBottom: '2px solid #1E3A8A' }}
      >
        <div className={hasPhoto ? 'flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start' : ''}>
          {hasPhoto && (
            <img
              src={photo!}
              alt={data.name}
              className="w-[70px] h-[90px] sm:w-[90px] sm:h-[120px] rounded object-cover"
              style={{ border: '2px solid #1E3A8A' }}
            />
          )}

          <div className={hasPhoto ? 'flex-1 text-center sm:text-left' : 'text-center'}>
            <h1
              className={`text-2xl sm:text-3xl font-bold mb-2 ${hasPhoto ? '' : 'text-center'}`}
              style={{ color: '#1E3A8A' }}
            >
              {data.name}
            </h1>
            <p
              className={`text-sm sm:text-base italic mb-4 ${hasPhoto ? '' : 'text-center'}`}
              style={{ color: '#64748B' }}
            >
              {data.jobTitle}
            </p>
            <div className="text-xs sm:text-sm leading-relaxed" style={{ color: '#475569' }}>
              <p className="break-all">{data.email}</p>
              <p>{data.phone}</p>
              <p>{data.location}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mb-8" style={{ breakInside: 'avoid' }}>
        <h2
          className="text-lg font-bold uppercase tracking-wider pb-2 mb-5"
          style={{
            color: '#1E3A8A',
            borderBottom: '1px solid #CBD5E1',
            letterSpacing: '1px',
          }}
        >
          Profil
        </h2>
        <p className="leading-relaxed" style={{ color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {data.profile}
        </p>
      </section>

      <section className="mb-8">
        <h2
          className="text-lg font-bold uppercase tracking-wider pb-2 mb-5"
          style={{
            color: '#1E3A8A',
            borderBottom: '1px solid #CBD5E1',
            letterSpacing: '1px',
          }}
        >
          Berufserfahrung
        </h2>
        <div className="space-y-6">
          {data.experience.map((exp, index) => (
            <div key={index} style={{ breakInside: 'avoid' }}>
              <div className="flex justify-between mb-1">
                <h3 className="font-bold" style={{ color: '#1E3A8A' }}>
                  {exp.position}
                </h3>
                <span className="text-sm" style={{ color: '#64748B' }}>
                  {exp.timeframe}
                </span>
              </div>
              <p className="italic mb-2" style={{ color: '#64748B' }}>
                {exp.company}
              </p>
              <ul className="space-y-1" style={{ color: '#475569', paddingLeft: '20px', listStyleType: 'disc', listStylePosition: 'outside', margin: '8px 0 0 20px' }}>
                {exp.bullets.map((bullet, i) => (
                  <li key={i} className="text-sm" style={{ paddingLeft: '4px' }}>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2
          className="text-lg font-bold uppercase tracking-wider pb-2 mb-5"
          style={{
            color: '#1E3A8A',
            borderBottom: '1px solid #CBD5E1',
            letterSpacing: '1px',
          }}
        >
          Ausbildung
        </h2>
        <div className="space-y-4">
          {data.education.map((edu, index) => (
            <div key={index}>
              <div className="flex justify-between">
                <h3 className="font-bold" style={{ color: '#1E3A8A' }}>
                  {edu.degree}
                </h3>
                <span className="text-sm" style={{ color: '#64748B' }}>
                  {edu.timeframe}
                </span>
              </div>
              <p className="italic" style={{ color: '#64748B' }}>
                {edu.institution}
              </p>
              {edu.details && (
                <p className="text-sm" style={{ color: '#475569' }}>
                  {edu.details}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2
          className="text-lg font-bold uppercase tracking-wider pb-2 mb-5"
          style={{
            color: '#1E3A8A',
            borderBottom: '1px solid #CBD5E1',
            letterSpacing: '1px',
          }}
        >
          Kompetenzen
        </h2>
        <p style={{ color: '#334155' }}>{data.skills.join(' • ')}</p>
      </section>
    </div>
  );
}

export function BeratungTemplate({ data, photo, showPhoto }: CVTemplateProps) {
  const hasPhoto = showPhoto && photo;

  return (
    <div className="cv-template-container flex flex-col md:flex-row bg-white print:flex-row" style={{ fontFamily: 'Inter, sans-serif' }}>
      <aside className="w-full md:w-[35%] p-4 sm:p-10 print:w-[35%] print:p-10" style={{ background: '#1E293B', color: '#FFFFFF' }}>
        {hasPhoto && (
          <img
            src={photo!}
            alt={data.name}
            className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-full object-cover mx-auto mb-6"
            style={{ border: '4px solid #4ECDC4' }}
          />
        )}

        <h1 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">{data.name}</h1>
        <p className="text-xs sm:text-sm text-center font-semibold mb-4 sm:mb-8" style={{ color: '#4ECDC4' }}>
          {data.jobTitle}
        </p>

        <div className="space-y-8">
          <div>
            <h2
              className="text-base font-bold uppercase tracking-wide mb-4"
              style={{ color: '#4ECDC4', letterSpacing: '1px' }}
            >
              Kontakt
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail size={14} style={{ color: '#4ECDC4' }} />
                <span className="break-all">{data.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} style={{ color: '#4ECDC4' }} />
                <span>{data.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} style={{ color: '#4ECDC4' }} />
                <span>{data.location}</span>
              </div>
            </div>
          </div>

          <div>
            <h2
              className="text-base font-bold uppercase tracking-wide mb-4"
              style={{ color: '#4ECDC4', letterSpacing: '1px' }}
            >
              Skills
            </h2>
            <div className="space-y-2">
              {data.skills.map((skill, index) => (
                <div
                  key={index}
                  className="text-sm py-1 px-3 rounded"
                  style={{
                    background: index < 3 ? '#4ECDC4' : 'rgba(78, 205, 196, 0.2)',
                    color: index < 3 ? '#0F172A' : '#FFFFFF',
                    fontWeight: index < 3 ? '600' : '400',
                  }}
                >
                  {skill}
                </div>
              ))}
            </div>
          </div>

          {data.languages && data.languages.length > 0 && (
            <div>
              <h2
                className="text-base font-bold uppercase tracking-wide mb-4"
                style={{ color: '#4ECDC4', letterSpacing: '1px' }}
              >
                Sprachen
              </h2>
              <div className="space-y-2 text-sm">
                {data.languages.map((lang, index) => (
                  <div key={index}>
                    <span className="font-semibold">{lang.name}</span>
                    <span className="text-xs ml-2" style={{ color: '#94A3B8' }}>
                      {lang.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-10 print:p-10">
        <section className="mb-8" style={{ breakInside: 'avoid' }}>
          <h2
            className="text-2xl font-bold pb-3 mb-6"
            style={{
              color: '#0F172A',
              borderBottom: '3px solid #4ECDC4',
            }}
          >
            Profil
          </h2>
          <p className="leading-relaxed" style={{ color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {data.profile}
          </p>
        </section>

        <section className="mb-8">
          <h2
            className="text-2xl font-bold pb-3 mb-6"
            style={{
              color: '#0F172A',
              borderBottom: '3px solid #4ECDC4',
            }}
          >
            Berufserfahrung
          </h2>
          <div className="space-y-6">
            {data.experience.map((exp, index) => (
              <div key={index} style={{ breakInside: 'avoid' }}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: '#0F172A' }}>
                      {exp.position}
                    </h3>
                    <p className="font-semibold" style={{ color: '#4ECDC4' }}>
                      {exp.company}
                    </p>
                  </div>
                  <span
                    className="text-sm px-3 py-1 rounded"
                    style={{ background: '#F1F5F9', color: '#64748B' }}
                  >
                    {exp.timeframe}
                  </span>
                </div>
                <ul className="space-y-2 mt-3" style={{ paddingLeft: '20px', listStyleType: 'none', margin: '12px 0 0 0' }}>
                  {exp.bullets.map((bullet, i) => (
                    <li
                      key={i}
                      className="text-sm relative"
                      style={{ color: '#475569', paddingLeft: '20px' }}
                    >
                      <span
                        className="absolute left-0"
                        style={{ color: '#4ECDC4' }}
                      >
                        ▸
                      </span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2
            className="text-2xl font-bold pb-3 mb-6"
            style={{
              color: '#0F172A',
              borderBottom: '3px solid #4ECDC4',
            }}
          >
            Ausbildung
          </h2>
          <div className="space-y-4">
            {data.education.map((edu, index) => (
              <div key={index}>
                <div className="flex justify-between">
                  <h3 className="font-bold" style={{ color: '#0F172A' }}>
                    {edu.degree}
                  </h3>
                  <span className="text-sm" style={{ color: '#64748B' }}>
                    {edu.timeframe}
                  </span>
                </div>
                <p style={{ color: '#4ECDC4' }}>{edu.institution}</p>
                {edu.details && (
                  <p className="text-sm" style={{ color: '#64748B' }}>
                    {edu.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {data.projects && data.projects.length > 0 && (
          <section>
            <h2
              className="text-2xl font-bold pb-3 mb-6"
              style={{
                color: '#0F172A',
                borderBottom: '3px solid #4ECDC4',
              }}
            >
              Projekte
            </h2>
            <div className="space-y-4">
              {data.projects.map((project, index) => (
                <div key={index}>
                  <h3 className="font-bold mb-2" style={{ color: '#0F172A' }}>
                    {project.title}
                  </h3>
                  <p className="text-sm" style={{ color: '#475569' }}>
                    {project.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export function FinanceTemplate({ data, photo, showPhoto }: CVTemplateProps) {
  const hasPhoto = showPhoto && photo;

  return (
    <div
      className="cv-template-container bg-white p-4 sm:p-12 print:p-12"
      style={{ fontFamily: 'Times New Roman, Times, serif', fontSize: '11pt', lineHeight: '1.3' }}
    >
      <header className="cv-template-header mb-4 sm:mb-6 relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-0 print:mb-6 print:flex-row print:items-start print:gap-0">
        {hasPhoto && (
          <img
            src={photo!}
            alt={data.name}
            className="w-[70px] h-[90px] sm:w-[80px] sm:h-[100px] rounded object-cover sm:absolute sm:left-0 sm:top-0"
            style={{ border: '1px solid #000' }}
          />
        )}
        <div className={hasPhoto ? 'text-center sm:ml-[100px] w-full' : 'text-center w-full'}>
          <h1 className="text-lg sm:text-xl font-bold mb-1" style={{ color: '#000' }}>
            {data.name}
          </h1>
          {data.address && (
            <p className="text-xs mb-1">{data.address}</p>
          )}
          <p className="text-xs break-all">
            {data.phone} | {data.email}
          </p>
        </div>
      </header>

      <section className="mb-5">
        <h2
          className="text-sm font-bold uppercase mb-3"
          style={{
            borderBottom: '1.5px solid #000',
            paddingBottom: '2px',
            letterSpacing: '0.5px',
          }}
        >
          EDUCATION
        </h2>
        {data.education.map((edu, index) => (
          <div key={index} className="mb-4">
            <div className="flex justify-between items-baseline mb-1">
              <div className="font-bold">{edu.institution}</div>
              <div className="text-xs">
                {edu.city && edu.country && `${edu.city}, ${edu.country}`}
              </div>
            </div>
            <div className="italic mb-1">
              {edu.degree}
              {edu.timeframe && (
                <span className="float-right not-italic">
                  Expected {edu.timeframe}
                </span>
              )}
            </div>
            {(edu.gpa || edu.sat) && (
              <div className="mb-1">
                <span className="font-bold">• GPA: </span>
                {edu.gpa && `${edu.gpa} / ${edu.gpaScale || '4.0'}`}
                {edu.sat && `; SAT: ${edu.sat}`}
                {edu.honors && edu.honors.length > 0 &&
                  ` [If you're outside the US, list grades under your system here instead]`
                }
              </div>
            )}
            {edu.honors && edu.honors.length > 0 && (
              <div className="mb-1">
                <span className="font-bold">• Honors: </span>
                {edu.honors.map((honor, i) => (
                  <span key={i}>
                    {i > 0 && ' '}
                    {honor}
                    {i < edu.honors!.length - 1 ? ',' : ''}
                  </span>
                ))}
              </div>
            )}
            {edu.relevantCoursework && edu.relevantCoursework.length > 0 && (
              <div>
                <span className="font-bold">• Relevant Coursework: </span>
                {edu.relevantCoursework.join(' / ')}
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="mb-5">
        <h2
          className="text-sm font-bold uppercase mb-3"
          style={{
            borderBottom: '1.5px solid #000',
            paddingBottom: '2px',
            letterSpacing: '0.5px',
          }}
        >
          WORK & LEADERSHIP EXPERIENCE
        </h2>
        {data.experience.map((exp, index) => (
          <div key={index} className="mb-4" style={{ breakInside: 'avoid' }}>
            <div className="flex justify-between items-baseline mb-0.5">
              <div className="font-bold">{exp.company}</div>
              <div className="text-xs">
                {exp.company.includes(',') ? '' : `${data.location}`}
              </div>
            </div>
            <div className="italic mb-1">
              {exp.position}
              {exp.groupName && `, ${exp.groupName}`}
              <span className="float-right not-italic">{exp.timeframe}</span>
            </div>
            {exp.bullets && exp.bullets.length > 0 && (
              <ul className="mb-2" style={{ listStyleType: 'none', paddingLeft: '12px', margin: '8px 0 8px 12px' }}>
                {exp.bullets.map((bullet, i) => (
                  <li key={i} className="mb-1 relative" style={{ paddingLeft: '12px' }}>
                    <span className="absolute" style={{ left: '0' }}>•</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
            {exp.selectedExperience && exp.selectedExperience.length > 0 && (
              <div className="ml-3">
                <div className="mb-1">Selected {exp.groupName?.includes('Client') ? 'Client' : 'Project'} Experience:</div>
                <ul className="list-none ml-3">
                  {exp.selectedExperience.map((item, i) => (
                    <li key={i} className="mb-2 relative" style={{ paddingLeft: '0' }}>
                      <span className="absolute" style={{ left: '-12px' }}>○</span>
                      <div className="font-bold">{item.title}</div>
                      <ul className="list-none ml-3 mt-1">
                        <li className="relative" style={{ paddingLeft: '0' }}>
                          <span className="absolute" style={{ left: '-12px' }}>▪</span>
                          {item.description}
                        </li>
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </section>

      {data.activities && data.activities.length > 0 && (
        <section className="mb-5">
          {data.activities.map((activity, index) => (
            <div key={index} className="mb-3">
              <div className="flex justify-between items-baseline mb-0.5">
                <div className="font-bold">{activity.organization}</div>
                <div className="text-xs">
                  {activity.city && activity.country && `${activity.city}, ${activity.country}`}
                </div>
              </div>
              <div className="italic mb-1">
                {activity.position}
                <span className="float-right not-italic">{activity.timeframe}</span>
              </div>
              <ul className="list-none ml-3">
                {activity.bullets.map((bullet, i) => (
                  <li key={i} className="mb-1 relative" style={{ paddingLeft: '0' }}>
                    <span className="absolute" style={{ left: '-12px' }}>•</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      <section>
        <h2
          className="text-sm font-bold uppercase mb-3"
          style={{
            borderBottom: '1.5px solid #000',
            paddingBottom: '2px',
            letterSpacing: '0.5px',
          }}
        >
          SKILLS, ACTIVITIES & INTERESTS
        </h2>
        <div className="space-y-1">
          {data.languages && data.languages.length > 0 && (
            <div>
              <span className="font-bold">Languages: </span>
              {data.languages.map((lang, i) => (
                <span key={i}>
                  Fluent in {lang.name}
                  {lang.level && lang.level !== 'Fluent' && ` (${lang.level})`}
                  {i < data.languages!.length - 1 ? '; ' : ''}
                </span>
              ))}
            </div>
          )}
          {data.technicalSkills && data.technicalSkills.length > 0 && (
            <div>
              <span className="font-bold">Technical Skills: </span>
              {data.technicalSkills.join(', ')} [not MS Office/Excel]
            </div>
          )}
          {data.certifications && data.certifications.length > 0 && (
            <div>
              <span className="font-bold">Certifications & Training: </span>
              {data.certifications.join(', ')}
            </div>
          )}
          {data.activities && data.activities.length > 0 && !data.activities.some(a => a.bullets?.length > 0) && (
            <div>
              <span className="font-bold">Activities: </span>
              {data.activities.map(a => a.organization).join(', ')}
            </div>
          )}
          {data.interests && (
            <div>
              <span className="font-bold">Interests: </span>
              {data.interests}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
