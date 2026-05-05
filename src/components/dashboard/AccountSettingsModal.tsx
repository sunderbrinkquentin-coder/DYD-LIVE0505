import { useState } from 'react';
import { X, Lock, Trash2, Eye, EyeOff, AlertTriangle, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AccountSettingsModalProps {
  onClose: () => void;
  onAccountDeleted: () => void;
}

type ActiveTab = 'password' | 'delete';

export function AccountSettingsModal({ onClose, onAccountDeleted }: AccountSettingsModalProps) {
  const { changePassword, deleteAccount, user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('password');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const DELETE_CONFIRM_PHRASE = 'KONTO LÖSCHEN';

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Die Passwörter stimmen nicht überein.');
      return;
    }

    setPasswordLoading(true);
    const result = await changePassword(newPassword);
    setPasswordLoading(false);

    if (!result.success) {
      setPasswordError(result.error || 'Fehler beim Ändern des Passworts.');
      return;
    }

    setPasswordSuccess(true);
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 4000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== DELETE_CONFIRM_PHRASE) return;
    setDeleteError('');
    setDeleteLoading(true);
    const result = await deleteAccount();
    setDeleteLoading(false);

    if (!result.success) {
      setDeleteError(result.error || 'Fehler beim Löschen des Kontos.');
      return;
    }

    onAccountDeleted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="relative w-full max-w-md rounded-2xl text-white" style={{ background: 'linear-gradient(135deg, #0f1a19 0%, #0d1514 100%)', border: '1px solid rgba(102,192,182,0.2)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Konto-Einstellungen</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-all text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all ${activeTab === 'password' ? 'text-[#66c0b6] border-b-2 border-[#66c0b6]' : 'text-white/50 hover:text-white/80'}`}
          >
            <Lock size={15} />
            Passwort ändern
          </button>
          <button
            onClick={() => setActiveTab('delete')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all ${activeTab === 'delete' ? 'text-red-400 border-b-2 border-red-400' : 'text-white/50 hover:text-white/80'}`}
          >
            <Trash2 size={15} />
            Konto löschen
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <p className="text-sm text-white/60 mb-4">
                Lege ein neues Passwort für <span className="text-white/80 font-medium">{user?.email}</span> fest.
              </p>

              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">Neues Passwort</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mindestens 8 Zeichen"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-[#66c0b6]/50 transition-all text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-all"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">Passwort bestätigen</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Passwort wiederholen"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-[#66c0b6]/50 transition-all text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-all"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertTriangle size={15} className="flex-shrink-0" />
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                  <Check size={15} className="flex-shrink-0" />
                  Passwort erfolgreich geändert!
                </div>
              )}

              <button
                type="submit"
                disabled={passwordLoading || !newPassword || !confirmPassword}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #66c0b6, #30E3CA)', color: '#000' }}
              >
                {passwordLoading ? 'Wird gespeichert...' : 'Passwort speichern'}
              </button>
            </form>
          )}

          {activeTab === 'delete' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-300 mb-1">Diese Aktion ist unwiderruflich</p>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Dein Konto, alle gespeicherten Lebensläufe, Credits und Daten werden dauerhaft gelöscht. Eine Wiederherstellung ist nicht möglich.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                  Zur Bestätigung <span className="text-red-400">"{DELETE_CONFIRM_PHRASE}"</span> eingeben
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={DELETE_CONFIRM_PHRASE}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-red-500/50 transition-all text-sm"
                />
              </div>

              {deleteError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertTriangle size={15} className="flex-shrink-0" />
                  {deleteError}
                </div>
              )}

              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== DELETE_CONFIRM_PHRASE || deleteLoading}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all bg-red-600 hover:bg-red-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleteLoading ? 'Konto wird gelöscht...' : 'Konto unwiderruflich löschen'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
