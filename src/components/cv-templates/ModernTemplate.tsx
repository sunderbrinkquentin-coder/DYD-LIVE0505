import { Mail, Phone, MapPin, Linkedin, Globe, Plus, Trash2 } from 'lucide-react';

interface TemplateProps {
  personalInfo?: any;
  summary?: string;
  sections?: Array<{
    type: string;
    title: string;
    items?: any[];
  }>;
  photoUrl?: string;
  onUpdatePersonalInfo?: (field: string, value: string) => void;
  onUpdateSummary?: (value: string) => void;
  onUpdateSectionItem?: (sectionIndex: number, itemIndex: number, field: string, value: any) => void;
  onAddSectionItem?: (sectionIndex: number, defaultItem: any) => void;
  onDeleteSectionItem?: (sectionIndex: number, itemIndex: number) => void;
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
  
  const effPersonal = personalInfo || data?.personalData || {};
  const effSummary = summary || data?.profileSummary || '';
  
  let effSections = sections && sections.length > 0 ? [...sections] : [];
  if (effSections.length === 0 && data) {
    if (data.experience) effSections.push({ type: 'experience', title: 'Berufserfahrung', items: data.experience });
    if (data.projects) effSections.push({ type: 'projects', title: 'Projekte', items: data.projects });
    if (data.education) effSections.push({ type: 'education', title: 'Ausbildung', items: data.education });
  }

  // Sektion für Zertifikate & Stipendien sicherstellen
  const hasCertificates = effSections.some(s => s.type === 'certificates');
  if (!hasCertificates) {
    effSections.push({ type: 'certificates', title: 'Zertifikate & Stipendien', items: [] });
  }

  // Trennung der Sektionen: Wir teilen sie logisch auf, um echtes A4-Rendering zu simulieren
  const sidebarSections = effSections.filter(s => s.type === 'skills' || s.type === 'soft_skills' || s.type === 'languages');
  const mainSections = effSections.filter(s => s.type !== 'skills' && s.type !== 'soft_skills' && s.type !== 'languages');

  return (
    <> {/* 🔥 FIX: Dieses übergeordnete Fragment umschließt nun alle Elemente regelkonform */}
      <div className="modern-page-container grid grid-cols-[260px_1fr]" data-pdf-root>
        
        {/* LINKE SPALTE */}
        <div className="modern-sidebar-fix bg-[#2c3e50] text-white p-6 space-y-6">
          {photoUrl && (
            <div className="flex justify-center mb-4">
              <img src={photoUrl} alt="Profil" className="w-28 h-28 rounded-full object-cover border-4 border-white/10 shadow-lg" />
            </div>
          )}
          
          <div className="space-y-1">
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onUpdatePersonalInfo?.('name', e.target.innerText)}
              className="text-xl font-bold text-white p-1 rounded hover:bg-white/5 outline-none min-w-[50px]"
            >
              {effPersonal.name || 'Dein Name'}
            </div>
          </div>

          <div className="space-y-3 text-xs border-t border-white/10 pt-4">
            <div className="flex items-center gap-2">
              <Mail size={12} className="text-white/50 shrink-0" />
              <div contentEditable suppressContentEditableWarning onBlur={(e) => onUpdatePersonalInfo?.('email', e.target.innerText)} className="p-0.5 w-full hover:bg-white/5 rounded outline-none">{effPersonal.email || 'E-Mail'}</div>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={12} className="text-white/50 shrink-0" />
              <div contentEditable suppressContentEditableWarning onBlur={(e) => onUpdatePersonalInfo?.('phone', e.target.innerText)} className="p-0.5 w-full hover:bg-white/5 rounded outline-none">{effPersonal.phone || 'Telefon'}</div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={12} className="text-white/50 shrink-0" />
              <div contentEditable suppressContentEditableWarning onBlur={(e) => onUpdatePersonalInfo?.('location', e.target.innerText)} className="p-0.5 w-full hover:bg-white/5 rounded outline-none">{effPersonal.location || 'Adresse'}</div>
            </div>
          </div>

          {/* RENDERT FEEDBACK-SEKTIONEN IN DER SIDEBAR */}
          {sidebarSections.map((section, sIdx) => (
            <div key={section.type} className="pt-4 border-t border-white/10 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">{section.title}</h3>
              <div className="space-y-1 text-xs">
                {section.items?.map((item, iIdx) => (
                  <div key={iIdx} className="hover:bg-white/5 p-0.5 rounded outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => onUpdateSectionItem?.(effSections.indexOf(section), iIdx, 'name', e.target.innerText)}>
                    {item.name || String(item)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* RECHTE SPALTE */}
        <div className="p-8 space-y-6 overflow-hidden bg-white">
          
          {/* PROFIL */}
          <div>
            <h2 className="text-sm font-bold text-[#2c3e50] uppercase tracking-wider mb-2 pb-0.5 border-b border-[#2c3e50]">Profil</h2>
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onUpdateSummary?.(e.target.innerText)}
              className="text-xs text-gray-700 leading-relaxed p-1 hover:bg-gray-50 rounded outline-none min-h-[20px]"
            >
              {effSummary || 'Klicke hier, um ein Profil hinzuzufügen...'}
            </div>
          </div>

          {/* RENDERT HAUPTSEKTIONEN */}
          {mainSections.map((section) => {
            const sIdx = effSections.indexOf(section);
            const isCert = section.type === 'certificates';
            
            if (isCert && (!section.items || section.items.length === 0)) {
              return (
                <div key={section.type} className="pt-2 border-t border-dashed border-gray-200 nonce-export">
                  <button
                    type="button"
                    onClick={() => onAddSectionItem?.(sIdx, { title: 'Name des Stipendiums / Zertifikats', issuer: 'Organisation', date_from: '01/2026', description: '' })}
                    className="flex items-center gap-1.5 text-[11px] text-[#2c3e50]/60 hover:text-[#66c0b6] font-semibold bg-gray-50 hover:bg-[#66c0b6]/5 px-2.5 py-1.5 rounded-lg border border-gray-200 transition-all"
                  >
                    <Plus size={12} /> + Zertifikat oder Stipendium hinzufügen
                  </button>
                </div>
              );
            }

            return (
              <div key={section.type} className="space-y-3">
                <h2 className="text-sm font-bold text-[#2c3e50] uppercase tracking-wider pb-0.5 border-b border-[#2c3e50]">
                  {section.title}
                </h2>

                <div className="space-y-4">
                  {section.items?.map((item, iIdx) => (
                    <div key={iIdx} className="relative group/item pl-1">
                      
                      <button
                        type="button"
                        onClick={() => onDeleteSectionItem?.(sIdx, iIdx)}
                        className="absolute -left-6 top-0.5 opacity-0 group-hover/item:opacity-100 p-0.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded transition-all nonce-export"
                      >
                        <Trash2 size={11} />
                      </button>

                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => onUpdateSectionItem?.(sIdx, iIdx, item.position ? 'position' : item.degree ? 'degree' : 'title', e.target.innerText)}
                            className="font-bold text-gray-900 text-sm hover:bg-gray-50 rounded px-0.5 outline-none truncate"
                          >
                            {item.title || item.position || item.degree || 'Titel eintragen'}
                          </div>
                          
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => onUpdateSectionItem?.(sIdx, iIdx, item.company ? 'company' : item.institution ? 'institution' : 'issuer', e.target.innerText)}
                            className="text-xs text-gray-600 hover:bg-gray-50 rounded px-0.5 outline-none truncate font-medium"
                          >
                            {item.company || item.institution || item.issuer || 'Unternehmen / Aussteller'}
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 font-semibold whitespace-nowrap flex gap-1">
                          <div contentEditable suppressContentEditableWarning onBlur={(e) => onUpdateSectionItem?.(sIdx, iIdx, item.startDate ? 'startDate' : item.date ? 'date' : 'date_from', e.target.innerText)} className="hover:bg-gray-50 rounded px-0.5 outline-none">{item.date_from || item.startDate || item.date || '01/2026'}</div>
                          {!isCert && <span>-</span>}
                          {!isCert && <div contentEditable suppressContentEditableWarning onBlur={(e) => onUpdateSectionItem?.(sIdx, iIdx, item.endDate ? 'endDate' : 'date_to', e.target.innerText)} className="hover:bg-gray-50 rounded px-0.5 outline-none">{item.date_to || item.endDate || 'Heute'}</div>}
                        </div>
                      </div>

                      <div className="mt-1.5 text-xs text-gray-700">
                        {Array.isArray(item.bulletPoints) && (
                          <ul className="space-y-1 pl-2">
                            {item.bulletPoints.map((bullet: string, bIdx: number) => (
                              <li key={bIdx} className="flex items-start gap-1 group/bullet">
                                <span className="text-gray-400 select-none mt-0.5">•</span>
                                <div
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => {
                                    const nextBullets = [...item.bulletPoints];
                                    nextBullets[bIdx] = e.target.innerText;
                                    onUpdateSectionItem?.(sIdx, iIdx, 'bulletPoints', nextBullets);
                                  }}
                                  className="w-full hover:bg-gray-50 rounded px-0.5 outline-none py-0.5 text-xs text-gray-700"
                                >
                                  {bullet || 'Neuer Stichpunkt...'}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextBullets = item.bulletPoints.filter((_: any, b: number) => b !== bIdx);
                                    onUpdateSectionItem?.(sIdx, iIdx, 'bulletPoints', nextBullets);
                                  }}
                                  className="opacity-0 group-hover/bullet:opacity-100 text-gray-400 hover:text-red-500 px-1 text-xs nonce-export"
                                >
                                  ✕
                                </button>
                              </li>
                            ))}
                            
                            <button
                              type="button"
                              onClick={() => {
                                const nextBullets = [...(item.bulletPoints || []), 'Neuer Stichpunkt...'];
                                onUpdateSectionItem?.(sIdx, iIdx, 'bulletPoints', nextBullets);
                              }}
                              className="flex items-center gap-1 text-[10px] text-[#66c0b6] font-semibold hover:underline mt-1 nonce-export"
                            >
                              <Plus size={10} /> + Punkt hinzufügen
                            </button>
                          </ul>
                        )}
                      </div>

                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => onAddSectionItem?.(sIdx, isCert ? { title: 'Neues Zertifikat', issuer: 'Aussteller', date_from: '2026', description: '' } : { title: 'Neue Position', company: 'Firma', date_from: '01/2026', date_to: 'Heute', bulletPoints: ['Beschreibung...'] })}
                    className="flex items-center gap-1 text-[10px] text-[#2c3e50]/50 hover:text-[#66c0b6] font-semibold pt-1 nonce-export"
                  >
                    <Plus size={12} /> + Eintrag zu "{section.title}" hinzufügen
                  </button>
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </>
  );
}