import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sessionManager } from '../../utils/sessionManager';
import { KanbanStatus } from './KanbanBoard';

interface AddManualCardModalProps {
  initialStatus: KanbanStatus;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_LABELS: Record<KanbanStatus, string> = {
  draft: 'Entwurf',
  applied: 'Beworben',
  interview: 'Interview',
  offer: 'Angebot',
  rejected: 'Absage',
};

export function AddManualCardModal({ initialStatus, onClose, onSuccess }: AddManualCardModalProps) {
  const [position, setPosition] = useState('');
  const [company, setCompany] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [applicationDate, setApplicationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position.trim() || !company.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const jobData = {
        positionTitle: position.trim(),
        company: company.trim(),
        contactPerson: contactPerson.trim(),
        applicationDate: applicationDate.trim(),
        notes: notes.trim(),
      };

      const { error: insertError } = await supabase
        .from('stored_cvs')
        .insert({
          user_id: user?.id || null,
          session_id: sessionManager.getSessionId(),
          job_data: jobData,
          cv_data: {},
          status: initialStatus,
          source: 'manual',
          is_paid: false,
          download_unlocked: false,
        });

      if (insertError) {
        setError('Fehler beim Erstellen der Kachel. Bitte versuche es erneut.');
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError('Ein unbekannter Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Bewerbung hinzufugen</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Spalte: <span className="font-medium text-gray-700">{STATUS_LABELS[initialStatus]}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Position <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="z.B. Marketing Manager"
              required
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#66c0b6]/40 focus:border-[#66c0b6] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Unternehmen <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="z.B. Google GmbH"
              required
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#66c0b6]/40 focus:border-[#66c0b6] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Ansprechpartner
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="z.B. Frau Muller"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#66c0b6]/40 focus:border-[#66c0b6] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Bewerbungsdatum
            </label>
            <input
              type="text"
              value={applicationDate}
              onChange={(e) => setApplicationDate(e.target.value)}
              placeholder="z.B. 15.03.2026"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#66c0b6]/40 focus:border-[#66c0b6] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Notizen
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Weitere Informationen zur Bewerbung..."
              rows={3}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#66c0b6]/40 focus:border-[#66c0b6] transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!position.trim() || !company.trim() || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black rounded-lg text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Kachel erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
