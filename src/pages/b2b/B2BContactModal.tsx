import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type ContactModalProps = {
  open: boolean;
  onClose: () => void;
  segment: 'unternehmen' | 'bildungstraeger';
};

type FormState = {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  message: string;
};

const emptyForm: FormState = {
  company_name: '',
  contact_name: '',
  email: '',
  phone: '',
  message: '',
};

export default function B2BContactModal({ open, onClose, segment }: ContactModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (open) {
      setStatus('idle');
      setErrorMsg('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const { error } = await supabase.from('b2b_contact_requests').insert({
        company_name: form.company_name,
        contact_name: form.contact_name,
        email: form.email,
        phone: form.phone || null,
        segment,
        message: form.message || null,
      });

      if (error) throw error;

      setStatus('success');
      setForm(emptyForm);
      setTimeout(() => onClose(), 2500);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten.');
    }
  };

  const segmentLabel = segment === 'unternehmen' ? 'Unternehmen' : 'Bildungsträger';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(10,25,47,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="relative px-6 py-5"
              style={{ background: 'linear-gradient(135deg, #0A192F, #38BDF8)' }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
              <p className="font-arimo text-xs font-bold uppercase tracking-wide text-[#DEFF9A] mb-1">
                {segmentLabel}
              </p>
              <h2 className="font-poppins font-black text-xl text-white" style={{ letterSpacing: '-0.02em' }}>
                Kontakt aufnehmen
              </h2>
              <p className="font-arimo text-sm text-white/60 mt-1">
                Wir melden uns innerhalb von 24 Stunden bei Ihnen.
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              {status === 'success' ? (
                <div className="flex flex-col items-center text-center py-8">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ background: 'rgba(56,189,248,0.10)' }}
                  >
                    <CheckCircle2 className="w-8 h-8 text-[#38BDF8]" />
                  </div>
                  <h3 className="font-poppins font-bold text-lg text-[#0F1E34] mb-2">
                    Vielen Dank!
                  </h3>
                  <p className="font-arimo text-sm text-[#55637A] max-w-xs">
                    Ihre Anfrage wurde erfolgreich übermittelt. Wir melden uns in Kürze bei Ihnen.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field
                      label="Unternehmen / Institution"
                      required
                      value={form.company_name}
                      onChange={(v) => handleChange('company_name', v)}
                      placeholder="z.B. Hochschule Fresenius"
                    />
                    <Field
                      label="Ansprechperson"
                      required
                      value={form.contact_name}
                      onChange={(v) => handleChange('contact_name', v)}
                      placeholder="Vor- und Nachname"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field
                      label="E-Mail"
                      required
                      type="email"
                      value={form.email}
                      onChange={(v) => handleChange('email', v)}
                      placeholder="name@firma.de"
                    />
                    <Field
                      label="Telefon (optional)"
                      value={form.phone}
                      onChange={(v) => handleChange('phone', v)}
                      placeholder="+49 ..."
                    />
                  </div>
                  <div>
                    <label className="block font-arimo text-sm font-bold text-[#0F1E34] mb-1.5">
                      Nachricht (optional)
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      rows={3}
                      placeholder="Wie können wir Ihnen helfen?"
                      className="w-full rounded-xl border border-[#E3EBF5] bg-[#F6F9FD] px-4 py-3 font-arimo text-sm text-[#0F1E34] placeholder:text-[#55637A]/40 outline-none focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/20 transition-all resize-none"
                    />
                  </div>

                  {status === 'error' && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#EF5350]/5 border border-[#EF5350]/20">
                      <AlertCircle className="w-4 h-4 text-[#EF5350] flex-shrink-0" />
                      <span className="font-arimo text-sm text-[#EF5350]">{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-arimo font-bold text-[#0A192F] transition-all hover:shadow-xl hover:shadow-[#38BDF8]/25 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)', borderRadius: '16px' }}
                  >
                    {status === 'submitting' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Wird gesendet...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Anfrage senden
                      </>
                    )}
                  </button>
                  <p className="font-arimo text-xs text-[#55637A]/60 text-center">
                    Mit dem Absenden stimmen Sie der Verarbeitung Ihrer Daten gemäß DSGVO zu.
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block font-arimo text-sm font-bold text-[#0F1E34] mb-1.5">
        {label} {required && <span className="text-[#38BDF8]">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#E3EBF5] bg-[#F6F9FD] px-4 py-3 font-arimo text-sm text-[#0F1E34] placeholder:text-[#55637A]/40 outline-none focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/20 transition-all"
      />
    </div>
  );
}
