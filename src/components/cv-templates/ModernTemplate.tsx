import { Mail, Phone, MapPin, Linkedin, Globe, Plus, Trash2 } from 'lucide-react';

interface TemplateProps {
  // Nimmt die Daten flexibel entgegen
  personalInfo?: any;
  summary?: string;
  sections?: Array<{
    type: string;
    title: string;
    items?: any[];
  }>;
  photoUrl?: string;
  photoPosition?: { x: number; y: number };
  
  // Die Event-Schnittstellen aus der Hauptseite
  onUpdatePersonalInfo?: (field: string, value: string) => void;
  onUpdateSummary?: (value: string) => void;
  onUpdateSection?: (sectionIndex: number, updates: any) => void;
  onUpdateSectionItem?: (sectionIndex: number, itemIndex: number, field: string, value: any) => void;
  onAddSectionItem?: (sectionIndex: number, defaultItem: any) => void;
  onDeleteSectionItem?: (sectionIndex: number, itemIndex: number) => void;
  
  // Abwärtskompatibilität für den alten Wizard-Stand
  data?: any; 
}

export function ModernCVTemplate({
  personalInfo,
  summary,
  sections = [],
  photoUrl,
  onUpdatePersonalInfo,
  onUpdateSummary,
  onUpdateSectionItem,
  onAddSectionItem,
  onDeleteSectionItem,
  data
}: TemplateProps) {
  
  // Fallback-Logik, falls die Daten noch im alten Wizard-Format reinkommen
  const effPersonal = personalInfo || data?.personalData || {};
  const effSummary = summary || data?.profileSummary || '';
  
  // Falls keine Abschnitte vorhanden sind, bauen wir sie aus den alten Wizard-Daten auf
  let effSections = sections && sections.length > 0 ? [...sections] : [];
  if (effSections.length === 0 && data) {
    if (data.experience) effSections.push({ type: 'experience', title: 'Berufserfahrung', items: data.experience });
    if (data.projects) effSections.push({ type: 'projects', title: 'Projekte', items: data.projects });
    if (data.education) effSections.push({ type: 'education', title: 'Ausbildung', items: data.education });
  }

  // 🔥 FEATURE-ERWEITERUNG (Punkt 7): Prüfen, ob Zertifikate/Stipendien bereits als Sektion existieren. 
  // Wenn nicht, stellen wir ein unsichtbares Fundament bereit, das sich beim Klick öffnet.
  const hasCertificates = effSections.some(s => s.type === 'certificates' || s.type === 'awards');
  if (!hasCertificates) {
    effSections.push({ type: 'certificates', title: 'Zertifikate & Stipendien', items: [] });
  }

  const inputStyle = "bg-transparent hover:bg-black/5 focus:bg-white focus:text-black focus:ring-1 focus:ring-[#66c0b6] rounded px-1 transition-all w-full outline-none";
  const textareaStyle = "bg-transparent hover:bg-black/5 focus:bg-white focus:text-black focus:ring-1 focus:ring-[#66c0b6] rounded px-1 transition-all w-full outline-none resize-none";

  return (
    <div className="bg-white text-gray-900 w-full flex-1 flex flex-col" style={{ width: '794px' }}>
      <div className="grid grid-cols-[280px_1fr] flex-1">
        
        {/* LINKE SPALTE (Sidebar) */}
        <div className="bg-gradient-to-b from-[#2c3e50] to-[#34495e] text-white p-8 space-y-6">
          {photoUrl && (
            <div className="flex justify-center mb-4">
              <img
                src={photoUrl}
                alt="Profilfoto"
                className="w-32 h-32 rounded-full object-cover border-4 border-white/20 shadow-lg"
              />
            </div>
          )}
          
          <div className="space-y-1">
            <input
              type="text"
              value={effPersonal.name || ''}
              onChange={(e) => onUpdatePersonalInfo?.('name', e.target.value)}
              placeholder="Dein Name"
              className={`${inputStyle} text-2xl font-bold text-white hover:bg-white/10`}
            />
          </div>

          <div className="space-y-3 text-sm border-t border-white/10 pt-4">
            <div className="flex items-center gap-2">
              <Mail size={14} className="flex-shrink-0 text-white/60" />
              <input
                type="text"
                value={effPersonal.email || ''}
                onChange={(e) => onUpdatePersonalInfo?.('email', e.target.value)}
                placeholder="E-Mail-Adresse"
                className={`${inputStyle} text-xs text-white hover:bg-white/10`}
              />
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} className="flex-shrink-0 text-white/60" />
              <input
                type="text"
                value={effPersonal.phone || ''}
                onChange={(e) => onUpdatePersonalInfo?.('phone', e.target.value)}
                placeholder="Telefonnummer"
                className={`${inputStyle} text-xs text-white hover:bg-white/10`}
              />
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="flex-shrink-0 text-white/60" />
              <input
                type="text"
                value={effPersonal.location || ''}
                onChange={(e) => onUpdatePersonalInfo?.('location', e.target.value)}
                placeholder="PLZ, Ort"
                className={`${inputStyle} text-xs text-white hover:bg-white/10`}
              />
            </div>
            <div className="flex items-center gap-2">
              <Linkedin size={14} className="flex-shrink-0 text-white/60" />
              <input
                type="text"
                value={effPersonal.linkedin || ''}
                onChange={(e) => onUpdatePersonalInfo?.('linkedin', e.target.value)}
                placeholder="LinkedIn URL"
                className={`${inputStyle} text-xs text-white hover:bg-white/10`}
              />
            </div>
          </div>
        </div>

        {/* RECHTE SPALTE (Hauptinhalt) */}
        <div className="p-10 space-y-8 flex-1">
          
          {/* PROFILZUSAMMENFASSUNG */}
          <div>
            <h2 className="text-xl font-bold text-[#2c3e50] mb-2 pb-1 border-b-2 border-[#2c3e50] uppercase tracking-wide">Profil</h2>
            <textarea
              value={effSummary}
              onChange={(e) => onUpdateSummary?.(e.target.value)}
              placeholder="Erzähle kurz etwas über dich und deine Kernkompetenzen..."
              rows={3}
              className={`${textareaStyle} text-sm text-gray-700`}
            />
          </div>

          {/* DYNAMISCHE SEKTIONEN (Berufserfahrung, Ausbildung, Projekte, Zertifikate) */}
          {effSections.map((section, sIdx) => {
            const isCert = section.type === 'certificates';
            
            // Wenn es die Zertifikate-Sektion ist und keine Einträge da sind, zeigen wir im PDF nichts,
            // aber im Editor bieten wir einen dezenten Hinzufügen-Button an.
            if (isCert && (!section.items || section.items.length === 0)) {
              return (
                <div key={section.type} className="group/sec pt-2 border-t border-dashed border-gray-200 nonce-export">
                  <button
                    type="button"
                    onClick={() => onAddSectionItem?.(sIdx, { title: '', issuer: '', date: '', description: '' })}
                    className="flex items-center gap-2 text-xs text-[#2c3e50]/60 hover:text-[#66c0b6] font-semibold bg-gray-50 hover:bg-[#66c0b6]/5 px-3 py-2 rounded-xl transition-all border border-gray-200"
                  >
                    <Plus size={14} /> + Zertifikat, Auszeichnung oder Stipendium hinzufügen
                  </button>
                </div>
              );
            }

            return (
              <div key={section.type} className="relative group/section">
                <h2 className="text-xl font-bold text-[#2c3e50] mb-4 pb-1 border-b-2 border-[#2c3e50] uppercase tracking-wide">
                  {section.title}
                </h2>

                <div className="space-y-6">
                  {section.items?.map((item, iIdx) => (
                    <div key={iIdx} className="relative group/item pl-2 border-l-2 border-transparent hover:border-gray-300 transition-all">
                      
                      {/* LÖSCH-KNOPF FÜR EINTRAG */}
                      <button
                        type="button"
                        onClick={() => onDeleteSectionItem?.(sIdx, iIdx)}
                        className="absolute -left-8 top-1 opacity-0 group-hover/item:opacity-100 p-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded transition-all nonce-export"
                      >
                        <Trash2 size={13} />
                      </button>

                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-1">
                          {/* Titel (Position, Abschluss oder Zertifikatstitel) */}
                          <input
                            type="text"
                            value={item.title || item.position || item.degree || ''}
                            onChange={(e) => onUpdateSectionItem?.(sIdx, iIdx, item.position ? 'position' : item.degree ? 'degree' : 'title', e.target.value)}
                            placeholder={isCert ? "z.B. Stipendiat der Studienstiftung" : "Titel / Position"}
                            className={`${inputStyle} font-bold text-gray-900 text-base`}
                          />
                          
                          {/* Untertitel (Unternehmen, Schule oder Aussteller) */}
                          <input
                            type="text"
                            value={item.company || item.institution || item.issuer || ''}
                            onChange={(e) => onUpdateSectionItem?.(sIdx, iIdx, item.company ? 'company' : item.institution ? 'institution' : 'issuer', e.target.value)}
                            placeholder={isCert ? "Aussteller / Organisation" : "Unternehmen / Institution"}
                            className={`${inputStyle} text-sm text-gray-600 font-medium`}
                          />
                        </div>

                        {/* ZEITRAUM */}
                        <div className="text-right flex-shrink-0 flex flex-col items-end">
                          <div className="flex items-center gap-1 text-sm text-gray-700 font-semibold">
                            <input
                              type="text"
                              value={item.date_from || item.startDate || item.date || ''}
                              onChange={(e) => onUpdateSectionItem?.(sIdx, iIdx, item.startDate ? 'startDate' : item.date ? 'date' : 'date_from', e.target.value)}
                              placeholder="MM/JJJJ"
                              className="bg-transparent hover:bg-black/5 text-right w-20 outline-none rounded"
                            />
                            {!isCert && <span>-</span>}
                            {!isCert && (
                              <input
                                type="text"
                                value={item.date_to || item.endDate || ''}
                                onChange={(e) => onUpdateSectionItem?.(sIdx, iIdx, item.endDate ? 'endDate' : 'date_to', e.target.value)}
                                placeholder="Heute"
                                className="bg-transparent hover:bg-black/5 text-left w-20 outline-none rounded"
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* BESCHREIBUNG ODER BULLETPOINTS */}
                      <div className="mt-2 text-sm text-gray-700">
                        {/* Wenn der Eintrag Freitext-Beschreibung nutzt */}
                        {typeof item.description === 'string' && (
                          <textarea
                            value={item.description}
                            onChange={(e) => onUpdateSectionItem?.(sIdx, iIdx, 'description', e.target.value)}
                            placeholder="Beschreibung der Tätigkeiten oder Erfolge..."
                            rows={2}
                            className={`${textareaStyle} text-xs text-gray-600 mt-1`}
                          />
                        )}

                        {/* 🔥 BULLETPOINTS HINZUFÜGEN & EDITIEREN (Punkt 3): Rendert bestehende Listen interaktiv */}
                        {Array.isArray(item.bulletPoints) && (
                          <div className="space-y-1 mt-2 pl-4">
                            {item.bulletPoints.map((bullet: string, bIdx: number) => (
                              <div key={bIdx} className="flex items-start gap-1 group/bullet">
                                <span className="text-gray-400 mt-1.5 shrink-0">•</span>
                                <input
                                  type="text"
                                  value={bullet}
                                  onChange={(e) => {
                                    const nextBullets = [...item.bulletPoints];
                                    nextBullets[bIdx] = e.target.value;
                                    onUpdateSectionItem?.(sIdx, iIdx, 'bulletPoints', nextBullets);
                                  }}
                                  className={`${inputStyle} text-xs text-gray-700 py-0.5`}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextBullets = item.bulletPoints.filter((_: any, b: number) => b !== bIdx);
                                    onUpdateSectionItem?.(sIdx, iIdx, 'bulletPoints', nextBullets);
                                  }}
                                  className="opacity-0 group-hover/bullet:opacity-100 text-gray-400 hover:text-red-500 text-xs px-1 nonce-export"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            
                            {/* KNOPF: Punkt hinzufügen (Reagiert jetzt sofort im LiveEditor) */}
                            <button
                              type="button"
                              onClick={() => {
                                const nextBullets = [...(item.bulletPoints || []), ''];
                                onUpdateSectionItem?.(sIdx, iIdx, 'bulletPoints', nextBullets);
                              }}
                              className="flex items-center gap-1 text-[11px] text-[#66c0b6] font-medium hover:underline mt-1 nonce-export"
                            >
                              <Plus size={10} /> Punkt hinzufügen
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  ))}

                  {/* BUTTONS: Weiteren Eintrag zur Sektion hinzufügen */}
                  <button
                    type="button"
                    onClick={() => onAddSectionItem?.(sIdx, isCert ? { title: '', issuer: '', date: '', description: '' } : { title: '', company: '', date_from: '', date_to: '', description: '', bulletPoints: [] })}
                    className="flex items-center gap-1 text-xs text-[#2c3e50]/70 hover:text-[#66c0b6] transition-colors pt-2 font-medium nonce-export"
                  >
                    <Plus size={14} /> Weitere Station zu "{section.title}" hinzufügen
                  </button>
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}