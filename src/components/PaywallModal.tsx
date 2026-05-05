import { useState } from 'react';
import { X, Check, CreditCard, Star, Shield, Zap } from 'lucide-react';
import { cvStorageService } from '../services/cvStorageService';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => Promise<void>;
  onSuccess?: () => void;
  type?: 'single' | 'bundle';
  context?: 'download' | 'application' | 'learning_path';
  feature?: string;
}

export function PaywallModal({ isOpen, onClose, onConfirm, onSuccess, type = 'single', context = 'download', feature }: PaywallModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'single' | 'bundle-3' | 'bundle-5'>('single');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      if (onConfirm) {
        await onConfirm();
      }
      if (onSuccess) {
        onSuccess();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const plans = {
    single: {
      price: '9,90',
      title: 'Einzelner CV',
      description: 'Perfekt für eine Bewerbung',
      cvs: 1,
      pricePerCv: '9,90'
    },
    'bundle-3': {
      price: '24,90',
      title: '3 CV Bundle',
      description: 'Spare 25% - Ideal für mehrere Bewerbungen',
      cvs: 3,
      pricePerCv: '8,30',
      savings: '25%'
    },
    'bundle-5': {
      price: '34,90',
      title: '5 CV Bundle',
      description: 'Spare 40% - Bestes Angebot',
      cvs: 5,
      pricePerCv: '6,98',
      savings: '40%',
      popular: true
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-b border-white/10 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-[#66c0b6] to-[#30E3CA]">
              <Star size={24} className="text-black" />
            </div>
            <h2 className="text-2xl font-bold text-white">Schalte deinen optimierten CV frei</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
            disabled={isProcessing}
          >
            <X size={24} className="text-white/60" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            {context === 'download' ? (
              <>
                <p className="text-lg text-white/80">
                  Du hast deinen CV bereits optimiert – um ihn herunterzuladen, schalte ihn jetzt frei.
                </p>
                <p className="text-white/60">
                  So sicherst du dir den nächsten Schritt zu deinem Traumjob mit DYD.
                </p>
              </>
            ) : context === 'learning_path' ? (
              <>
                <p className="text-lg text-white/80">
                  Schalte deinen personalisierten Lernpfad frei und erreiche deine Karriereziele
                </p>
                <p className="text-white/60">
                  Strukturierte Module, kuratierte Ressourcen und ein offizielles Zertifikat nach Abschluss
                </p>
              </>
            ) : (
              <>
                <p className="text-lg text-white/80">
                  Erstelle optimierte CVs für deine Bewerbungen – kaufe jetzt Credits und starte durch!
                </p>
                <p className="text-white/60">
                  Mit unseren Bundles sparst du bis zu 40% und kannst mehrere CVs optimieren.
                </p>
              </>
            )}
          </div>

          {context === 'application' ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white text-center mb-4">
                Wähle dein Paket
              </h3>

              <div className="grid gap-3">
                {(Object.keys(plans) as Array<keyof typeof plans>).map((planKey) => {
                  const plan = plans[planKey];
                  return (
                    <button
                      key={planKey}
                      onClick={() => setSelectedPlan(planKey)}
                      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                        selectedPlan === planKey
                          ? 'border-[#66c0b6] bg-[#66c0b6]/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-2 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black text-xs font-bold">
                          Beliebt
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-white text-lg">{plan.title}</div>
                          <div className="text-white/60 text-sm mt-1">{plan.description}</div>
                          <div className="text-white/80 text-sm mt-2">
                            {plan.cvs} {plan.cvs === 1 ? 'CV' : 'CVs'} • {plan.pricePerCv}€ pro CV
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-white">{plan.price}€</div>
                          {plan.savings && (
                            <div className="text-[#66c0b6] text-sm font-semibold">
                              Spare {plan.savings}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-[#66c0b6]/20 to-[#30E3CA]/20 border border-[#66c0b6]/30 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-white mb-2">9,90 €</div>
              <div className="text-white/60 text-sm">Einmalige Zahlung</div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield size={20} className="text-[#66c0b6]" />
              Das bekommst du:
            </h3>

            {context === 'learning_path' ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#66c0b6]/20 flex items-center justify-center mt-0.5">
                    <Check size={16} className="text-[#66c0b6]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">5-10 strukturierte Lernmodule</div>
                    <div className="text-sm text-white/60">
                      Schritt für Schritt zu deinem Ziel
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#66c0b6]/20 flex items-center justify-center mt-0.5">
                    <Check size={16} className="text-[#66c0b6]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Kuratierte Lernressourcen</div>
                    <div className="text-sm text-white/60">
                      Hochwertige Kurse, Artikel und Videos
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#66c0b6]/20 flex items-center justify-center mt-0.5">
                    <Check size={16} className="text-[#66c0b6]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Fortschritts-Tracking</div>
                    <div className="text-sm text-white/60">
                      Behalte deinen Lernfortschritt im Blick
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#66c0b6]/20 flex items-center justify-center mt-0.5">
                    <Check size={16} className="text-[#66c0b6]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Offizielles Abschlusszertifikat</div>
                    <div className="text-sm text-white/60">
                      PDF-Zertifikat nach erfolgreicher Absolvierung
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#66c0b6]/20 flex items-center justify-center mt-0.5">
                    <Check size={16} className="text-[#66c0b6]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Lebenslanger Zugriff</div>
                    <div className="text-sm text-white/60">
                      Einmal kaufen, für immer nutzen
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#66c0b6]/20 flex items-center justify-center mt-0.5">
                    <Check size={16} className="text-[#66c0b6]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">ATS-optimiertes Format</div>
                    <div className="text-sm text-white/60">
                      Dein CV ist perfekt für Bewerbermanagementsysteme optimiert
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#66c0b6]/20 flex items-center justify-center mt-0.5">
                    <Check size={16} className="text-[#66c0b6]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">3 professionelle Layouts</div>
                    <div className="text-sm text-white/60">
                      Wähle zwischen Klassisch, Modern und Kompakt
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#66c0b6]/20 flex items-center justify-center mt-0.5">
                    <Check size={16} className="text-[#66c0b6]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Unbegrenzte Downloads</div>
                    <div className="text-sm text-white/60">
                      Downloade deinen CV so oft du möchtest
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#66c0b6]/20 flex items-center justify-center mt-0.5">
                    <Check size={16} className="text-[#66c0b6]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Jederzeit bearbeitbar</div>
                    <div className="text-sm text-white/60">
                      Passe deinen CV im Dashboard jederzeit an
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#66c0b6]/20 flex items-center justify-center mt-0.5">
                    <Check size={16} className="text-[#66c0b6]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">HR-optimierte Formulierungen</div>
                    <div className="text-sm text-white/60">
                      Professionelle Sprache, die überzeugt
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#66c0b6]/20 flex items-center justify-center mt-0.5">
                    <Check size={16} className="text-[#66c0b6]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Sofortiger Zugriff</div>
                    <div className="text-sm text-white/60">
                      Download direkt nach der Zahlung
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
            <Zap size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-yellow-200 mb-1">
                Einführungspreis: Nur 9,90 € statt 19,90 €
              </div>
              <div className="text-yellow-200/70">
                Spare 50% - Angebot gilt nur für kurze Zeit!
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all disabled:opacity-50"
            >
              Später
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  <span>Wird verarbeitet...</span>
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  <span>Jetzt freischalten</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center text-xs text-white/40">
            <p>
              Nach dem Freischalten kannst du deinen CV jederzeit im Dashboard
              bearbeiten und erneut downloaden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
