import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { ApplicationStatus, TrackedApplication } from '../../../types/applications';
import { STATUSES } from '../../../types/applications';
import { applicationService } from '../../../services/applicationService';

interface AddApplicationModalProps {
  initialStatus: ApplicationStatus;
  onClose: () => void;
  onCreated: (app: TrackedApplication) => void;
}

const input =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#66c0b6] focus:ring-2 focus:ring-[#66c0b6]/20';

export function AddApplicationModal({ initialStatus, onClose, onCreated }: AddApplicationModalProps) {
  const [form, setForm] = useState({
    job_title: '',
    company: '',
    job_url: '',
    status: initialStatus,
    applied_at: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.job_title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const app = await applicationService.create({
        job_title: form.job_title.trim(),
        company: form.company.trim() || null,
        job_url: form.job_url.trim() || null,
        status: form.status,
        applied_at: form.applied_at || null,
      });
      onCreated(app);
    } catch {
      setError('Speichern fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">Bewerbung hinzufügen</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Stelle *</label>
            <input className={input} value={form.job_title} onChange={set('job_title')} required autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Unternehmen</label>
            <input className={input} value={form.company} onChange={set('company')} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Link zur Stellenanzeige</label>
            <input className={input} type="url" placeholder="https://…" value={form.job_url} onChange={set('job_url')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Status</label>
              <select className={input} value={form.status} onChange={set('status')}>
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Beworben am</label>
              <input className={input} type="date" value={form.applied_at} onChange={set('applied_at')} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={saving || !form.job_title.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {saving ? 'Speichere…' : 'Hinzufügen'}
          </button>
        </div>
      </form>
    </div>
  );
}
