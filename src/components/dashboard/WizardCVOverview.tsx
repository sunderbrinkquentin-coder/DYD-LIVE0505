import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, Pencil, Plus, Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { CVBuilderData, WorkExperience, ProfessionalEducation, Certificate, VolunteerWork, Stipendium } from '../../types/cvBuilder';

interface WizardCVOverviewProps {
  isOpen: boolean;
  cvData: CVBuilderData;
  cvId?: string | null;
  onClose: () => void;
  onContinue: (updatedData: CVBuilderData) => void;
}

function inputCls(extra = '') {
  return `w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#66c0b6]/60 transition-colors ${extra}`;
}

function SectionHeader({ label, count, expanded, onToggle }: { label: string; count: number; expanded: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors text-left"
    >
      <div className="flex items-center gap-2">
        {count > 0 ? (
          <span className="text-[#66c0b6] text-base leading-none">✓</span>
        ) : (
          <span className="text-white/30 text-base leading-none">○</span>
        )}
        <span className="font-semibold text-white text-sm">{label}</span>
        {count > 0 && (
          <span className="text-xs text-white/40 font-normal">({count})</span>
        )}
      </div>
      {expanded ? <ChevronUp size={15} className="text-white/40" /> : <ChevronDown size={15} className="text-white/40" />}
    </button>
  );
}

const EMPTY_EXPERIENCE: WorkExperience = {
  jobTitle: '',
  company: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  tasks: [],
  responsibilities: [],
  tools: [],
  kpis: [],
  achievements: [],
};

const EMPTY_EDU: ProfessionalEducation = {
  type: 'apprenticeship',
  institution: '',
  degree: '',
  startYear: '',
  endYear: '',
};

const EMPTY_CERT: Certificate = {
  name: '',
  issuer: '',
  year: '',
  description: '',
};

const EMPTY_VOLUNTEER: VolunteerWork = {
  role: '',
  organization: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
};

export function WizardCVOverview({ isOpen, cvData, cvId, onClose, onContinue }: WizardCVOverviewProps) {
  const navigate = useNavigate();

  const [data, setData] = useState<CVBuilderData>(() => ({
    ...cvData,
    workExperiences: cvData.workExperiences ? cvData.workExperiences.map(e => ({ ...e })) : [],
    professionalEducation: cvData.professionalEducation ? cvData.professionalEducation.map(e => ({ ...e })) : [],
    schoolEducation: cvData.schoolEducation ? cvData.schoolEducation.map(e => ({ ...e })) : [],
    certificates: cvData.certificates ? cvData.certificates.map(e => ({ ...e })) : [],
    volunteerWork: cvData.volunteerWork ? cvData.volunteerWork.map(e => ({ ...e })) : [],
    stipendien: cvData.stipendien ? cvData.stipendien.map(e => ({ ...e })) : [],
  }));

  const [confirmed, setConfirmed] = useState(false);
  const [expandedExp, setExpandedExp] = useState(true);
  const [expandedEdu, setExpandedEdu] = useState(true);
  const [expandedSchool, setExpandedSchool] = useState(false);
  const [expandedSkills, setExpandedSkills] = useState(false);
  const [expandedCerts, setExpandedCerts] = useState(false);
  const [expandedVolunteer, setExpandedVolunteer] = useState(false);
  const [expandedStipendien, setExpandedStipendien] = useState(false);

  if (!isOpen) return null;

  const p = data.personalData || {};
  const nameStr = [p.firstName, p.lastName].filter(Boolean).join(' ');

  // ── Experience helpers ──
  const updateExp = (i: number, field: keyof WorkExperience, value: any) => {
    setData(prev => {
      const exps = [...(prev.workExperiences || [])];
      exps[i] = { ...exps[i], [field]: value };
      return { ...prev, workExperiences: exps };
    });
    setConfirmed(false);
  };
  const deleteExp = (i: number) => {
    setData(prev => ({ ...prev, workExperiences: (prev.workExperiences || []).filter((_, idx) => idx !== i) }));
    setConfirmed(false);
  };
  const addExp = () => {
    setData(prev => ({ ...prev, workExperiences: [...(prev.workExperiences || []), { ...EMPTY_EXPERIENCE }] }));
    setExpandedExp(true);
    setConfirmed(false);
  };

  // ── Education helpers ──
  const updateEdu = (i: number, field: keyof ProfessionalEducation, value: any) => {
    setData(prev => {
      const edus = [...(prev.professionalEducation || [])];
      edus[i] = { ...edus[i], [field]: value };
      return { ...prev, professionalEducation: edus };
    });
    setConfirmed(false);
  };
  const deleteEdu = (i: number) => {
    setData(prev => ({ ...prev, professionalEducation: (prev.professionalEducation || []).filter((_, idx) => idx !== i) }));
    setConfirmed(false);
  };
  const addEdu = () => {
    setData(prev => ({ ...prev, professionalEducation: [...(prev.professionalEducation || []), { ...EMPTY_EDU }] }));
    setExpandedEdu(true);
    setConfirmed(false);
  };

  // ── Certificate helpers ──
  const updateCert = (i: number, field: keyof Certificate, value: any) => {
    setData(prev => {
      const certs = [...(prev.certificates || [])];
      certs[i] = { ...certs[i], [field]: value };
      return { ...prev, certificates: certs };
    });
    setConfirmed(false);
  };
  const deleteCert = (i: number) => {
    setData(prev => ({ ...prev, certificates: (prev.certificates || []).filter((_, idx) => idx !== i) }));
    setConfirmed(false);
  };
  const addCert = () => {
    setData(prev => ({ ...prev, certificates: [...(prev.certificates || []), { ...EMPTY_CERT }] }));
    setExpandedCerts(true);
    setConfirmed(false);
  };

  // ── Volunteer helpers ──
  const updateVolunteer = (i: number, field: keyof VolunteerWork, value: any) => {
    setData(prev => {
      const vols = [...(prev.volunteerWork || [])];
      vols[i] = { ...vols[i], [field]: value };
      return { ...prev, volunteerWork: vols };
    });
    setConfirmed(false);
  };
  const deleteVolunteer = (i: number) => {
    setData(prev => ({ ...prev, volunteerWork: (prev.volunteerWork || []).filter((_, idx) => idx !== i) }));
    setConfirmed(false);
  };
  const addVolunteer = () => {
    setData(prev => ({ ...prev, volunteerWork: [...(prev.volunteerWork || []), { ...EMPTY_VOLUNTEER }] }));
    setExpandedVolunteer(true);
    setConfirmed(false);
  };

  const exps = data.workExperiences || [];
  const edus = data.professionalEducation || [];
  const schools = data.schoolEducation || [];
  const hardSkills = data.hardSkills || [];
  const softSkills = data.softSkills || [];
  const certs = data.certificates || [];
  const volunteers = data.volunteerWork || [];
  const stipendien = data.stipendien || [];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0d0d14] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Status Quo prüfen</h2>
            <p className="text-sm text-white/50 mt-0.5">
              {nameStr ? `Profil von ${nameStr} — ` : ''}Überprüfe und korrigiere deine Daten vor dem Job-Targeting
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-all">
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">

          {/* ── Berufserfahrung ── */}
          <div>
            <SectionHeader
              label="Berufserfahrung"
              count={exps.length}
              expanded={expandedExp}
              onToggle={() => setExpandedExp(v => !v)}
            />
            {expandedExp && (
              <div className="mt-2 space-y-3 pl-1">
                {exps.length === 0 && (
                  <p className="text-sm text-white/30 px-2">Noch keine Berufserfahrung eingetragen.</p>
                )}
                {exps.map((exp, i) => (
                  <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/3 space-y-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#66c0b6] uppercase tracking-wider">Station {i + 1}</span>
                      <button
                        type="button"
                        onClick={() => deleteExp(i)}
                        className="p-1 hover:bg-red-500/20 rounded-md transition-colors"
                        title="Eintrag löschen"
                      >
                        <Trash2 size={13} className="text-red-400/70" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-white/40 mb-0.5 block">Position</label>
                        <input
                          className={inputCls()}
                          value={exp.jobTitle || ''}
                          onChange={e => updateExp(i, 'jobTitle', e.target.value)}
                          placeholder="z.B. Software Engineer"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/40 mb-0.5 block">Unternehmen</label>
                        <input
                          className={inputCls()}
                          value={exp.company || ''}
                          onChange={e => updateExp(i, 'company', e.target.value)}
                          placeholder="Firmenname"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-white/40 mb-0.5 block">Von (MM/YYYY)</label>
                        <input
                          className={inputCls()}
                          value={exp.startDate || ''}
                          onChange={e => updateExp(i, 'startDate', e.target.value)}
                          placeholder="03/2021"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/40 mb-0.5 block">Bis (MM/YYYY)</label>
                        <input
                          className={inputCls()}
                          value={exp.current ? 'Heute' : (exp.endDate || '')}
                          onChange={e => updateExp(i, 'endDate', e.target.value)}
                          placeholder="12/2023 oder Heute"
                          disabled={exp.current}
                        />
                      </div>
                      <div className="flex flex-col justify-end pb-0.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!exp.current}
                            onChange={e => {
                              updateExp(i, 'current', e.target.checked);
                              if (e.target.checked) updateExp(i, 'endDate', 'Heute');
                            }}
                            className="w-3.5 h-3.5 rounded accent-[#66c0b6]"
                          />
                          <span className="text-xs text-white/60">Aktuell</span>
                        </label>
                      </div>
                    </div>
                    {(exp.location !== undefined) && (
                      <div>
                        <label className="text-[10px] text-white/40 mb-0.5 block">Ort (optional)</label>
                        <input
                          className={inputCls()}
                          value={exp.location || ''}
                          onChange={e => updateExp(i, 'location', e.target.value)}
                          placeholder="Stadt / Remote"
                        />
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addExp}
                  className="flex items-center gap-1.5 text-sm text-[#66c0b6] hover:text-[#30E3CA] transition-colors px-2 py-1"
                >
                  <Plus size={14} /> Berufserfahrung hinzufügen
                </button>
              </div>
            )}
          </div>

          {/* ── Ausbildung & Studium ── */}
          <div>
            <SectionHeader
              label="Ausbildung & Studium"
              count={edus.length}
              expanded={expandedEdu}
              onToggle={() => setExpandedEdu(v => !v)}
            />
            {expandedEdu && (
              <div className="mt-2 space-y-3 pl-1">
                {edus.length === 0 && (
                  <p className="text-sm text-white/30 px-2">Noch keine Ausbildung eingetragen.</p>
                )}
                {edus.map((edu, i) => (
                  <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/3 space-y-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#66c0b6] uppercase tracking-wider">Abschluss {i + 1}</span>
                      <button
                        type="button"
                        onClick={() => deleteEdu(i)}
                        className="p-1 hover:bg-red-500/20 rounded-md transition-colors"
                      >
                        <Trash2 size={13} className="text-red-400/70" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-white/40 mb-0.5 block">Abschluss / Studiengang</label>
                        <input
                          className={inputCls()}
                          value={edu.degree || ''}
                          onChange={e => updateEdu(i, 'degree', e.target.value)}
                          placeholder="Bachelor Informatik"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/40 mb-0.5 block">Institution</label>
                        <input
                          className={inputCls()}
                          value={edu.institution || ''}
                          onChange={e => updateEdu(i, 'institution', e.target.value)}
                          placeholder="Universität / Schule"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-white/40 mb-0.5 block">Von (Jahr oder MM/YYYY)</label>
                        <input
                          className={inputCls()}
                          value={edu.startMonth ? `${edu.startMonth}/${edu.startYear}` : (edu.startYear || '')}
                          onChange={e => {
                            const val = e.target.value;
                            const mm = val.match(/^(\d{2})[./](\d{4})$/);
                            if (mm) {
                              updateEdu(i, 'startMonth', mm[1]);
                              updateEdu(i, 'startYear', mm[2]);
                            } else {
                              updateEdu(i, 'startYear', val);
                              updateEdu(i, 'startMonth', undefined as any);
                            }
                          }}
                          placeholder="2019 oder 10/2019"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/40 mb-0.5 block">Bis (Jahr oder MM/YYYY)</label>
                        <input
                          className={inputCls()}
                          value={edu.endMonth ? `${edu.endMonth}/${edu.endYear}` : (edu.endYear || '')}
                          onChange={e => {
                            const val = e.target.value;
                            const mm = val.match(/^(\d{2})[./](\d{4})$/);
                            if (mm) {
                              updateEdu(i, 'endMonth', mm[1]);
                              updateEdu(i, 'endYear', mm[2]);
                            } else {
                              updateEdu(i, 'endYear', val);
                              updateEdu(i, 'endMonth', undefined as any);
                            }
                          }}
                          placeholder="2022 oder 07/2022"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEdu}
                  className="flex items-center gap-1.5 text-sm text-[#66c0b6] hover:text-[#30E3CA] transition-colors px-2 py-1"
                >
                  <Plus size={14} /> Ausbildung hinzufügen
                </button>
              </div>
            )}
          </div>

          {/* ── Schulbildung (read-only, collapsed by default) ── */}
          {schools.length > 0 && (
            <div>
              <SectionHeader
                label="Schulbildung"
                count={schools.length}
                expanded={expandedSchool}
                onToggle={() => setExpandedSchool(v => !v)}
              />
              {expandedSchool && (
                <div className="mt-2 pl-1 space-y-1">
                  {schools.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/3 border border-white/10 text-sm text-white/70">
                      <span className="flex-1">{s.type}{s.school ? ` · ${s.school}` : ''}</span>
                      {(s.startYear || s.endYear || s.year) && (
                        <span className="text-white/40 text-xs shrink-0">
                          {s.startYear && s.endYear ? `${s.startYear}–${s.endYear}` : (s.year || '')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Zertifikate ── */}
          <div>
            <SectionHeader
              label="Zertifikate"
              count={certs.length}
              expanded={expandedCerts}
              onToggle={() => setExpandedCerts(v => !v)}
            />
            {expandedCerts && (
              <div className="mt-2 space-y-3 pl-1">
                {certs.length === 0 && (
                  <p className="text-sm text-white/30 px-2">Noch keine Zertifikate eingetragen.</p>
                )}
                {certs.map((cert, i) => (
                  <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/3 space-y-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#66c0b6] uppercase tracking-wider">Zertifikat {i + 1}</span>
                      <button
                        type="button"
                        onClick={() => deleteCert(i)}
                        className="p-1 hover:bg-red-500/20 rounded-md transition-colors"
                      >
                        <Trash2 size={13} className="text-red-400/70" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-white/40 mb-0.5 block">Zertifikat</label>
                        <input
                          className={inputCls()}
                          value={cert.name || ''}
                          onChange={e => updateCert(i, 'name', e.target.value)}
                          placeholder="z.B. AWS Certified Solutions Architect"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/40 mb-0.5 block">Aussteller</label>
                        <input
                          className={inputCls()}
                          value={cert.issuer || ''}
                          onChange={e => updateCert(i, 'issuer', e.target.value)}
                          placeholder="Amazon Web Services"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-white/40 mb-0.5 block">Jahr</label>
                      <input
                        className={inputCls('max-w-[120px]')}
                        value={cert.year || ''}
                        onChange={e => updateCert(i, 'year', e.target.value)}
                        placeholder="2023"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCert}
                  className="flex items-center gap-1.5 text-sm text-[#66c0b6] hover:text-[#30E3CA] transition-colors px-2 py-1"
                >
                  <Plus size={14} /> Zertifikat hinzufügen
                </button>
              </div>
            )}
          </div>

          {/* ── Ehrenamt & Freiwilligenarbeit ── */}
          <div>
            <SectionHeader
              label="Ehrenamt & Freiwilligenarbeit"
              count={volunteers.length}
              expanded={expandedVolunteer}
              onToggle={() => setExpandedVolunteer(v => !v)}
            />
            {expandedVolunteer && (
              <div className="mt-2 space-y-3 pl-1">
                {volunteers.length === 0 && (
                  <p className="text-sm text-white/30 px-2">Noch kein Ehrenamt eingetragen.</p>
                )}
                {volunteers.map((vol, i) => (
                  <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/3 space-y-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#66c0b6] uppercase tracking-wider">Ehrenamt {i + 1}</span>
                      <button
                        type="button"
                        onClick={() => deleteVolunteer(i)}
                        className="p-1 hover:bg-red-500/20 rounded-md transition-colors"
                      >
                        <Trash2 size={13} className="text-red-400/70" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-white/40 mb-0.5 block">Rolle / Funktion</label>
                        <input
                          className={inputCls()}
                          value={vol.role || ''}
                          onChange={e => updateVolunteer(i, 'role', e.target.value)}
                          placeholder="z.B. Trainer, Vorstand"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/40 mb-0.5 block">Organisation</label>
                        <input
                          className={inputCls()}
                          value={vol.organization || ''}
                          onChange={e => updateVolunteer(i, 'organization', e.target.value)}
                          placeholder="Verein / Initiative"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-white/40 mb-0.5 block">Von (MM/YYYY)</label>
                        <input
                          className={inputCls()}
                          value={vol.startDate || ''}
                          onChange={e => updateVolunteer(i, 'startDate', e.target.value)}
                          placeholder="01/2020"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/40 mb-0.5 block">Bis (MM/YYYY)</label>
                        <input
                          className={inputCls()}
                          value={vol.current ? 'Heute' : (vol.endDate || '')}
                          onChange={e => updateVolunteer(i, 'endDate', e.target.value)}
                          placeholder="Heute oder MM/YYYY"
                          disabled={!!vol.current}
                        />
                      </div>
                      <div className="flex flex-col justify-end pb-0.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!vol.current}
                            onChange={e => {
                              updateVolunteer(i, 'current', e.target.checked);
                              if (e.target.checked) updateVolunteer(i, 'endDate', 'Heute');
                            }}
                            className="w-3.5 h-3.5 rounded accent-[#66c0b6]"
                          />
                          <span className="text-xs text-white/60">Aktuell</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVolunteer}
                  className="flex items-center gap-1.5 text-sm text-[#66c0b6] hover:text-[#30E3CA] transition-colors px-2 py-1"
                >
                  <Plus size={14} /> Ehrenamt hinzufügen
                </button>
              </div>
            )}
          </div>

          {/* ── Stipendien (read-only, collapsed by default) ── */}
          {stipendien.length > 0 && (
            <div>
              <SectionHeader
                label="Stipendien"
                count={stipendien.length}
                expanded={expandedStipendien}
                onToggle={() => setExpandedStipendien(v => !v)}
              />
              {expandedStipendien && (
                <div className="mt-2 pl-1 space-y-1">
                  {stipendien.map((s: Stipendium, i: number) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/3 border border-white/10 text-sm text-white/70">
                      <span className="flex-1">{s.name}{s.organization ? ` · ${s.organization}` : ''}</span>
                      {s.year && <span className="text-white/40 text-xs shrink-0">{s.year}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Skills Summary (collapsed by default) ── */}
          <div>
            <SectionHeader
              label={`Skills (${hardSkills.length} Hard · ${softSkills.length} Soft)`}
              count={hardSkills.length + softSkills.length}
              expanded={expandedSkills}
              onToggle={() => setExpandedSkills(v => !v)}
            />
            {expandedSkills && (
              <div className="mt-2 pl-1">
                {hardSkills.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1 px-1">Hard Skills</p>
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {hardSkills.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full bg-white/8 border border-white/15 text-xs text-white/80">
                          {typeof s === 'string' ? s : s.skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {softSkills.length > 0 && (
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1 px-1">Soft Skills</p>
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {softSkills.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
                          {typeof s === 'string' ? s : s.skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {hardSkills.length === 0 && softSkills.length === 0 && (
                  <p className="text-sm text-white/30 px-2">Keine Skills eingetragen.</p>
                )}
              </div>
            )}
          </div>

          {/* ── Confirmation checkbox ── */}
          <div
            className={`mt-4 p-4 rounded-xl border transition-colors cursor-pointer ${
              confirmed
                ? 'border-[#66c0b6]/50 bg-[#66c0b6]/10'
                : 'border-white/15 bg-white/3 hover:border-white/25'
            }`}
            onClick={() => setConfirmed(v => !v)}
          >
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                confirmed ? 'bg-[#66c0b6] border-[#66c0b6]' : 'border-white/30 bg-white/5'
              }`}>
                {confirmed && <Check size={12} className="text-black" strokeWidth={3} />}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Daten sind korrekt und vollständig</p>
                <p className="text-xs text-white/50 mt-0.5">
                  Ich habe meine Daten geprüft – Berufserfahrung, Ausbildung, Zertifikate und Ehrenamt stimmen.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 flex flex-col sm:flex-row gap-3 border-t border-white/10 shrink-0">
          <button
            onClick={() => {
              onClose();
              if (cvId) {
                navigate(`/cv-wizard?mode=update&cvId=${cvId}`);
              } else {
                navigate('/cv-wizard');
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all text-sm"
          >
            <Pencil size={16} />
            Vollständig bearbeiten
          </button>

          <button
            onClick={() => confirmed && onContinue(data)}
            disabled={!confirmed}
            className={`flex-1 group flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-lg text-sm ${
              confirmed
                ? 'bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black hover:opacity-90 cursor-pointer'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            Weiter zum Job-Targeting
            <ArrowRight size={16} className={confirmed ? 'group-hover:translate-x-0.5 transition-transform' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
}
