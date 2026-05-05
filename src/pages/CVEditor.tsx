import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Plus, X, Minus, ZoomIn, ZoomOut } from 'lucide-react';
import { useStore } from '../store/useStore';
import Button from '../components/Button';
import PhotoUpload from '../components/PhotoUpload';
import { ModernTemplate, AzubiTemplate, UniTemplate, BeratungTemplate } from '../components/CVTemplates';
import { dbService } from '../services/databaseService';
import { mapCVDataForDatabase } from '../utils/cvDataMapper';
import React from 'react';

type TemplateType = 'modern' | 'azubi' | 'uni' | 'beratung';

const InputField = React.memo(function InputField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: '#E5E7EB' }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 rounded text-white text-sm focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '2px solid rgba(178,186,194,0.2)',
        }}
      />
    </div>
  );
});

const CollapsibleCard = React.memo(function CollapsibleCard({
  title,
  onDelete,
  children,
}: {
  title: string;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <div className="bg-white bg-opacity-5 rounded-lg p-4 border border-white border-opacity-10">
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white font-medium hover:text-primary transition-colors"
        >
          {title}
        </button>
        <button onClick={onDelete} className="text-red-400 hover:text-red-300">
          <X size={18} />
        </button>
      </div>
      {isOpen && <div>{children}</div>}
    </div>
  );
});

export default function CVEditor() {
  const navigate = useNavigate();
  const {
    editDraft,
    hasUnsavedChanges,
    startEditing,
    updateEditDraft,
    saveAndReturn,
    cancelEdit,
    photoBase64,
    showPhotoInCV,
    selectedTemplate,
    switchTemplate,
    currentCVId,
  } = useStore();

  const [zoom, setZoom] = useState(80);
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>(selectedTemplate);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    startEditing();
  }, [startEditing]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges && editDraft && currentCVId) {
        saveToDatabase(editDraft, false);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [editDraft, hasUnsavedChanges, currentCVId]);

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('Du hast ungespeicherte Änderungen. Möchtest du wirklich zurück?')) {
        cancelEdit();
        navigate('/result');
      }
    } else {
      navigate('/result');
    }
  };

  const handleSave = async () => {
    if (!editDraft || !currentCVId) {
      saveAndReturn();
      navigate('/result');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await saveToDatabase(editDraft, true);
      saveAndReturn();
      navigate('/result');
    } catch (error) {
      console.error('Failed to save CV:', error);
      setSaveError('Fehler beim Speichern. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveToDatabase = async (data: any, isManualSave: boolean) => {
    if (!currentCVId) return;

    try {
      const mappedData = mapCVDataForDatabase(data);
      await dbService.updateOptimizedCVSections(currentCVId, mappedData);

      if (isManualSave) {
        console.log('CV successfully saved to database');
      }
    } catch (error) {
      console.error('Failed to save to database:', error);
      if (isManualSave) {
        throw error;
      }
    }
  };

  const handleTemplateChange = (template: TemplateType) => {
    setActiveTemplate(template);
    switchTemplate(template);
  };

  const updateContact = (field: string, value: string) => {
    updateEditDraft({
      contact: { ...(editDraft?.contact || {}), [field]: value },
    });
  };

  const addExperience = () => {
    const newExp = {
      position: '',
      firma: '',
      von: '',
      bis: '',
      aktuell: false,
      bullets: [''],
    };
    updateEditDraft({
      experience: [...(editDraft?.experience || []), newExp],
    });
  };

  const updateExperience = (index: number, field: string, value: any) => {
    const experiences = [...(editDraft?.experience || [])];
    experiences[index] = { ...experiences[index], [field]: value };
    updateEditDraft({ experience: experiences });
  };

  const deleteExperience = (index: number) => {
    const experiences = [...(editDraft?.experience || [])];
    experiences.splice(index, 1);
    updateEditDraft({ experience: experiences });
  };

  const addBullet = (expIndex: number) => {
    const experiences = [...(editDraft?.experience || [])];
    experiences[expIndex].bullets = [...(experiences[expIndex].bullets || []), ''];
    updateEditDraft({ experience: experiences });
  };

  const updateBullet = (expIndex: number, bulletIndex: number, value: string) => {
    const experiences = [...(editDraft?.experience || [])];
    experiences[expIndex].bullets[bulletIndex] = value;
    updateEditDraft({ experience: experiences });
  };

  const deleteBullet = (expIndex: number, bulletIndex: number) => {
    const experiences = [...(editDraft?.experience || [])];
    experiences[expIndex].bullets.splice(bulletIndex, 1);
    updateEditDraft({ experience: experiences });
  };

  const addEducation = () => {
    const newEdu = {
      institution: '',
      abschluss: '',
      von: '',
      bis: '',
      note: '',
    };
    updateEditDraft({
      education: [...(editDraft?.education || []), newEdu],
    });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const education = [...(editDraft?.education || [])];
    education[index] = { ...education[index], [field]: value };
    updateEditDraft({ education });
  };

  const deleteEducation = (index: number) => {
    const education = [...(editDraft?.education || [])];
    education.splice(index, 1);
    updateEditDraft({ education });
  };

  const addSkill = (skill: string) => {
    if (skill.trim()) {
      updateEditDraft({
        skills: [...(editDraft?.skills || []), skill.trim()],
      });
    }
  };

  const deleteSkill = (index: number) => {
    const skills = [...(editDraft?.skills || [])];
    skills.splice(index, 1);
    updateEditDraft({ skills });
  };

  const addLanguage = () => {
    const newLang = { sprache: '', niveau: '' };
    updateEditDraft({
      languages: [...(editDraft?.languages || []), newLang],
    });
  };

  const updateLanguage = (index: number, field: string, value: string) => {
    const languages = [...(editDraft?.languages || [])];
    languages[index] = { ...languages[index], [field]: value };
    updateEditDraft({ languages });
  };

  const deleteLanguage = (index: number) => {
    const languages = [...(editDraft?.languages || [])];
    languages.splice(index, 1);
    updateEditDraft({ languages });
  };

  const addCertificate = () => {
    const newCert = { titel: '', organisation: '', datum: '' };
    updateEditDraft({
      certificates: [...(editDraft?.certificates || []), newCert],
    });
  };

  const updateCertificate = (index: number, field: string, value: string) => {
    const certificates = [...(editDraft?.certificates || [])];
    certificates[index] = { ...certificates[index], [field]: value };
    updateEditDraft({ certificates });
  };

  const deleteCertificate = (index: number) => {
    const certificates = [...(editDraft?.certificates || [])];
    certificates.splice(index, 1);
    updateEditDraft({ certificates });
  };

  if (!editDraft) {
    return <div className="min-h-screen gradient-bg flex items-center justify-center">Loading...</div>;
  }

  const mockCVData = {
    name: `${editDraft.contact?.vorname || ''} ${editDraft.contact?.nachname || ''}`,
    jobTitle: editDraft.contact?.position || 'Position',
    email: editDraft.contact?.email || '',
    phone: editDraft.contact?.telefon || '',
    location: editDraft.contact?.ort || '',
    profile: editDraft.contact?.profil || '',
    experience: (editDraft.experience || []).map((exp: any) => ({
      position: exp.position || '',
      company: exp.firma || '',
      timeframe: exp.aktuell ? `${exp.von} - Heute` : `${exp.von} - ${exp.bis}`,
      bullets: exp.bullets || [],
    })),
    education: (editDraft.education || []).map((edu: any) => ({
      degree: edu.abschluss || '',
      institution: edu.institution || '',
      timeframe: `${edu.von} - ${edu.bis}`,
      details: edu.note ? `Note: ${edu.note}` : '',
    })),
    skills: editDraft.skills || [],
    languages: editDraft.languages?.map((lang: any) => ({
      name: lang.sprache,
      level: lang.niveau,
    })),
    projects: editDraft.projects,
  };

  const renderTemplate = () => {
    const props = {
      data: mockCVData,
      photo: photoBase64,
      showPhoto: showPhotoInCV,
    };

    switch (activeTemplate) {
      case 'modern':
        return <ModernTemplate {...props} />;
      case 'azubi':
        return <AzubiTemplate {...props} />;
      case 'uni':
        return <UniTemplate {...props} />;
      case 'beratung':
        return <BeratungTemplate {...props} />;
      default:
        return <ModernTemplate {...props} />;
    }
  };

  return (
    <div className="h-screen flex flex-col gradient-bg">
      <header className="h-16 bg-dark-card border-b border-white border-opacity-10 flex items-center justify-between px-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Zurück</span>
        </button>

        <h1 className="text-xl font-bold">CV Editor</h1>

        <Button icon={Check} onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Speichert...' : 'Fertig'}
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[45%] overflow-y-auto p-6 space-y-6" style={{ background: '#132F4C' }}>
          {saveError && (
            <div className="bg-error bg-opacity-10 border border-error text-error px-4 py-3 rounded-lg mb-4">
              {saveError}
            </div>
          )}
          <section>
            <h2 className="text-xl font-bold mb-4 text-white">Kontakt</h2>
            <PhotoUpload />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <InputField
                label="Vorname"
                value={editDraft.contact?.vorname || ''}
                onChange={(e) => updateContact('vorname', e.target.value)}
              />
              <InputField
                label="Nachname"
                value={editDraft.contact?.nachname || ''}
                onChange={(e) => updateContact('nachname', e.target.value)}
              />
              <InputField
                label="E-Mail"
                value={editDraft.contact?.email || ''}
                onChange={(e) => updateContact('email', e.target.value)}
              />
              <InputField
                label="Telefon"
                value={editDraft.contact?.telefon || ''}
                onChange={(e) => updateContact('telefon', e.target.value)}
              />
              <InputField
                label="Ort"
                value={editDraft.contact?.ort || ''}
                onChange={(e) => updateContact('ort', e.target.value)}
              />
              <InputField
                label="LinkedIn"
                value={editDraft.contact?.linkedin || ''}
                onChange={(e) => updateContact('linkedin', e.target.value)}
              />
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Berufserfahrung</h2>
              <button
                onClick={addExperience}
                className="flex items-center gap-1 text-primary hover:text-primary-hover transition-colors text-sm"
              >
                <Plus size={16} />
                Hinzufügen
              </button>
            </div>
            <div className="space-y-4">
              {(editDraft.experience || []).map((exp: any, index: number) => (
                <CollapsibleCard
                  key={index}
                  title={exp.position || 'Neue Position'}
                  onDelete={() => deleteExperience(index)}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Position"
                      value={exp.position || ''}
                      onChange={(e) => updateExperience(index, 'position', e.target.value)}
                    />
                    <InputField
                      label="Firma"
                      value={exp.firma || ''}
                      onChange={(e) => updateExperience(index, 'firma', e.target.value)}
                    />
                    <InputField
                      label="Von"
                      value={exp.von || ''}
                      onChange={(e) => updateExperience(index, 'von', e.target.value)}
                      placeholder="MM/JJJJ"
                    />
                    <InputField
                      label="Bis"
                      value={exp.bis || ''}
                      onChange={(e) => updateExperience(index, 'bis', e.target.value)}
                      placeholder="MM/JJJJ"
                      disabled={exp.aktuell}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-white mt-2">
                    <input
                      type="checkbox"
                      checked={exp.aktuell || false}
                      onChange={(e) => updateExperience(index, 'aktuell', e.target.checked)}
                      className="rounded"
                    />
                    Aktuell
                  </label>
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-white">Aufgaben</label>
                      <button
                        onClick={() => addBullet(index)}
                        className="text-primary hover:text-primary-hover text-xs"
                      >
                        + Aufgabe
                      </button>
                    </div>
                    {(exp.bullets || []).map((bullet: string, bulletIndex: number) => (
                      <div key={bulletIndex} className="flex gap-2 mb-2">
                        <textarea
                          value={bullet}
                          onChange={(e) => updateBullet(index, bulletIndex, e.target.value)}
                          className="flex-1 px-3 py-2 rounded bg-white bg-opacity-5 border-2 border-white border-opacity-20 text-white text-sm focus:outline-none focus:border-primary"
                          rows={2}
                        />
                        <button
                          onClick={() => deleteBullet(index, bulletIndex)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </CollapsibleCard>
              ))}
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Bildung</h2>
              <button
                onClick={addEducation}
                className="flex items-center gap-1 text-primary hover:text-primary-hover transition-colors text-sm"
              >
                <Plus size={16} />
                Hinzufügen
              </button>
            </div>
            <div className="space-y-4">
              {(editDraft.education || []).map((edu: any, index: number) => (
                <CollapsibleCard
                  key={index}
                  title={edu.abschluss || 'Neuer Abschluss'}
                  onDelete={() => deleteEducation(index)}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Institution"
                      value={edu.institution || ''}
                      onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                    />
                    <InputField
                      label="Abschluss"
                      value={edu.abschluss || ''}
                      onChange={(e) => updateEducation(index, 'abschluss', e.target.value)}
                    />
                    <InputField
                      label="Von"
                      value={edu.von || ''}
                      onChange={(e) => updateEducation(index, 'von', e.target.value)}
                      placeholder="JJJJ"
                    />
                    <InputField
                      label="Bis"
                      value={edu.bis || ''}
                      onChange={(e) => updateEducation(index, 'bis', e.target.value)}
                      placeholder="JJJJ"
                    />
                    <InputField
                      label="Note (optional)"
                      value={edu.note || ''}
                      onChange={(e) => updateEducation(index, 'note', e.target.value)}
                    />
                  </div>
                </CollapsibleCard>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 text-white">Skills</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {(editDraft.skills || []).map((skill: string, index: number) => (
                <span
                  key={index}
                  className="flex items-center gap-2 px-3 py-1 bg-primary bg-opacity-20 text-primary rounded-full text-sm"
                >
                  {skill}
                  <button onClick={() => deleteSkill(index)} className="hover:text-primary-hover">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Neuen Skill hinzufügen"
                className="flex-1 px-3 py-2 rounded bg-white bg-opacity-5 border-2 border-white border-opacity-20 text-white text-sm focus:outline-none focus:border-primary"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addSkill(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  addSkill(input.value);
                  input.value = '';
                }}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Sprachen</h2>
              <button
                onClick={addLanguage}
                className="flex items-center gap-1 text-primary hover:text-primary-hover transition-colors text-sm"
              >
                <Plus size={16} />
                Hinzufügen
              </button>
            </div>
            <div className="space-y-3">
              {(editDraft.languages || []).map((lang: any, index: number) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <InputField
                      label="Sprache"
                      value={lang.sprache || ''}
                      onChange={(e) => updateLanguage(index, 'sprache', e.target.value)}
                    />
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">Niveau</label>
                      <select
                        value={lang.niveau || ''}
                        onChange={(e) => updateLanguage(index, 'niveau', e.target.value)}
                        className="w-full px-3 py-2 rounded bg-white bg-opacity-5 border-2 border-white border-opacity-20 text-white text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="">Wählen...</option>
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="B1">B1</option>
                        <option value="B2">B2</option>
                        <option value="C1">C1</option>
                        <option value="C2">C2</option>
                        <option value="Muttersprache">Muttersprache</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteLanguage(index)}
                    className="text-red-400 hover:text-red-300 mt-6"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Zertifikate</h2>
              <button
                onClick={addCertificate}
                className="flex items-center gap-1 text-primary hover:text-primary-hover transition-colors text-sm"
              >
                <Plus size={16} />
                Hinzufügen
              </button>
            </div>
            <div className="space-y-3">
              {(editDraft.certificates || []).map((cert: any, index: number) => (
                <CollapsibleCard
                  key={index}
                  title={cert.titel || 'Neues Zertifikat'}
                  onDelete={() => deleteCertificate(index)}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Titel"
                      value={cert.titel || ''}
                      onChange={(e) => updateCertificate(index, 'titel', e.target.value)}
                    />
                    <InputField
                      label="Organisation"
                      value={cert.organisation || ''}
                      onChange={(e) => updateCertificate(index, 'organisation', e.target.value)}
                    />
                    <InputField
                      label="Datum"
                      value={cert.datum || ''}
                      onChange={(e) => updateCertificate(index, 'datum', e.target.value)}
                      placeholder="MM/JJJJ"
                    />
                  </div>
                </CollapsibleCard>
              ))}
            </div>
          </section>
        </div>

        <div className="w-[55%] overflow-y-auto p-6" style={{ background: '#0A1929' }}>
          <div className="sticky top-0 bg-opacity-95 pb-4 mb-4" style={{ background: '#0A1929' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                {(['modern', 'azubi', 'uni', 'beratung'] as TemplateType[]).map((template) => (
                  <button
                    key={template}
                    onClick={() => handleTemplateChange(template)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      activeTemplate === template
                        ? 'bg-primary text-white'
                        : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
                    }`}
                  >
                    {template.charAt(0).toUpperCase() + template.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  className="p-2 bg-white bg-opacity-10 text-white rounded hover:bg-opacity-20"
                >
                  <Minus size={16} />
                </button>
                <span className="text-white text-sm w-12 text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom(Math.min(150, zoom + 10))}
                  className="p-2 bg-white bg-opacity-10 text-white rounded hover:bg-opacity-20"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          <div
            className="mx-auto shadow-2xl"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              width: `${(100 / zoom) * 100}%`,
            }}
          >
            {renderTemplate()}
          </div>
        </div>
      </div>
    </div>
  );
}
