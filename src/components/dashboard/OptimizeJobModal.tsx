import { useState } from 'react';
import { X, Briefcase, Building2, Link2, FileText, Loader2 } from 'lucide-react';

interface OptimizeJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobData: {
    company: string;
    jobTitle: string;
    jobLink: string;
    jobDescription: string;
  }) => Promise<void>;
}

export function OptimizeJobModal({ isOpen, onClose, onSubmit }: OptimizeJobModalProps) {
  const [formData, setFormData] = useState({
    company: '',
    jobTitle: '',
    jobLink: '',
    jobDescription: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.company || !formData.jobTitle || !formData.jobDescription) {
      setError('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Close modal on success
      onClose();
      // Reset form
      setFormData({ company: '', jobTitle: '', jobLink: '', jobDescription: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Wunschstelle eingeben</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X size={24} className="text-white/60" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <Building2 size={18} className="text-[#66c0b6]" />
              Unternehmen *
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="z.B. Google, BMW, Siemens..."
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:border-[#66c0b6] focus:ring-2 focus:ring-[#66c0b6]/20"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <Briefcase size={18} className="text-[#66c0b6]" />
              Jobtitel *
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              placeholder="z.B. Software Engineer, Marketing Manager..."
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:border-[#66c0b6] focus:ring-2 focus:ring-[#66c0b6]/20"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <Link2 size={18} className="text-[#66c0b6]" />
              Link zur Stellenanzeige (optional)
            </label>
            <input
              type="url"
              value={formData.jobLink}
              onChange={(e) => setFormData({ ...formData, jobLink: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:border-[#66c0b6] focus:ring-2 focus:ring-[#66c0b6]/20"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <FileText size={18} className="text-[#66c0b6]" />
              Stellenbeschreibung *
            </label>
            <p className="text-xs text-white/60">
              Kopiere die Stellenanzeige hier hinein für beste Ergebnisse
            </p>
            <textarea
              value={formData.jobDescription}
              onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
              placeholder="Füge hier die komplette Stellenbeschreibung ein..."
              rows={10}
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:border-[#66c0b6] focus:ring-2 focus:ring-[#66c0b6]/20 resize-none font-mono text-sm"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.company || !formData.jobTitle || !formData.jobDescription}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Speichere...
                </>
              ) : (
                'Weiter'
              )}
            </button>
          </div>

          <p className="text-xs text-white/40 text-center">* Pflichtfelder</p>
        </form>
      </div>
    </div>
  );
}
