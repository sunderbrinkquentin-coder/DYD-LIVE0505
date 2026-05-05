import { useState } from 'react';
import { Edit2, Trash2, ExternalLink, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Props = {
  cv: any;
  onEdit: (cv: any) => void;
  onDelete: (cvId: string) => void;
  onUpdate: () => void;
};

export function DraftCVCard({ cv, onEdit, onDelete, onUpdate }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    company: cv.job_data?.company || '',
    jobTitle: cv.job_data?.jobTitle || '',
    contactPerson: cv.contact_person || '',
    applicationDeadline: cv.application_deadline || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.company || !formData.jobTitle) {
      alert('Firma und Jobtitel sind erforderlich');
      return;
    }

    setIsSaving(true);
    try {
      const updatedJobData = {
        ...(cv.job_data || {}),
        company: formData.company,
        jobTitle: formData.jobTitle,
      };

      const { error } = await supabase
        .from('stored_cvs')
        .update({
          job_data: updatedJobData,
          contact_person: formData.contactPerson || null,
          application_deadline: formData.applicationDeadline || null,
        })
        .eq('id', cv.id);

      if (error) throw error;

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating draft:', error);
      alert('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Diesen Entwurf wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('stored_cvs')
        .delete()
        .eq('id', cv.id);

      if (error) throw error;
      onDelete(cv.id);
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert('Fehler beim Löschen');
    }
  };

  if (isEditing) {
    return (
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-lg p-3 sm:p-4">
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white">Entwurf bearbeiten</h3>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Firma *</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-2 py-1.5 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#66c0b6] transition-all"
                placeholder="z.B. Google"
              />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Jobtitel *</label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                className="w-full px-2 py-1.5 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#66c0b6] transition-all"
                placeholder="z.B. Software Engineer"
              />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Ansprechpartner</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-2 py-1.5 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#66c0b6] transition-all"
                placeholder="z.B. Max Mustermann"
              />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Bewerbungsfrist</label>
              <input
                type="date"
                value={formData.applicationDeadline}
                onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                className="w-full px-2 py-1.5 text-sm rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#66c0b6] transition-all"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-[#66c0b6] text-black font-medium hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Speichert...' : 'Speichern'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-all"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if CV is still processing
  const isProcessing = cv.status === 'processing';

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-lg p-3 sm:p-4">
      <div className="space-y-3">
        {isProcessing ? (
          <div className="flex items-center gap-3 py-2">
            <div className="w-8 h-8 border-2 border-[#66c0b6]/30 border-t-[#66c0b6] rounded-full animate-spin flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                {formData.jobTitle || cv.file_name || 'CV wird analysiert'}
              </h3>
              <p className="text-xs text-[#66c0b6] font-medium">KI analysiert deinen CV...</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white mb-1 truncate">{formData.jobTitle}</h3>
              <p className="text-xs sm:text-sm text-white/60 truncate">{formData.company}</p>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
              <AlertCircle size={12} />
              Entwurf
            </span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-2 text-xs sm:text-sm">
          {formData.contactPerson && (
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-white/50 mb-1">Ansprechpartner</p>
              <p className="text-white font-medium truncate">{formData.contactPerson}</p>
            </div>
          )}

          {formData.applicationDeadline && (
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-white/50 mb-1">Bewerbungsfrist</p>
              <p className="text-white font-medium">
                {new Date(formData.applicationDeadline).toLocaleDateString('de-DE')}
              </p>
            </div>
          )}
        </div>

        {!isProcessing && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onEdit(cv)}
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink size={16} />
              <span className="hidden sm:inline">Editor öffnen</span>
              <span className="sm:hidden">Editor</span>
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-all flex items-center justify-center"
              title="Bearbeiten"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 font-medium transition-all flex items-center justify-center"
              title="Löschen"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
