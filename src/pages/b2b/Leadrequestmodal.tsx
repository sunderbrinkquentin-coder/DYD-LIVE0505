import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Send, CheckCircle2, Building2, GraduationCap, Loader2 } from 'lucide-react';
// TODO: Pfad an deinen bestehenden Supabase-Client anpassen:
import { supabase } from '../lib/supabase';

type Segment = 'unternehmen' | 'bildungstraeger';

const SEGMENT_META: Record<Segment, { label: string; Icon: typeof Building2 }> = {
  unternehmen: { label: 'Unternehmen', Icon: Building2 },
  bildungstraeger: { label: 'Bildungsträger', Icon: GraduationCap },
};

type LeadRequestModalProps = {
  open: boolean;
  onClose: () => void;
  /** Aus dem CTA-Kontext übergeben – landet als Kategorie in der DB. */
  segment?: Segment;
};

const EMPTY = { name: '', email: '', phone: '', company: '', message: '' };

export default function LeadRequestModal({ open, onClose, segment }: LeadRequestModalProps) {
  const reduce = useReducedMotion() ?? false;
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const [seg, setSeg] = useState<Segment>(segment ?? 'unternehmen');
  const [form, setForm] = useState(EMPTY);
  const [company_website, setCompanyWebsite] = useState(''); // Honeypot (unsichtbar)
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Segment aus dem Kontext übernehmen, wenn das Modal geöffnet wird
  useEffect(() => {
    if (open && segment) setSeg(segment);
  }, [open, segment]);

  // Beim Öffnen: State zurücksetzen, Fokus setzen, Body-Scroll sperren
  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setCompanyWebsite('');
    setStatus('idle');
    setErrorMsg('');

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => firstFieldRef.current?.focus(), 50);

    return () => {
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [open]);

  // Escape schließt, Tab bleibt im Dialog (einfacher Focus-Trap)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose();
      if (e.key !== 'Tab') return;
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
      );
      if (!nodes || nodes.length === 0) return;
      const list = Array.from(nodes);
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const update = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;

    // Honeypot: von Bots ausgefüllt → still verwerfen (so tun als ob erfolgreich)
    if (company_website) {
      setStatus('done');
      return;
    }
    if (!form.name.trim() || !form.email.trim()) {
      setErrorMsg('Bitte Name und E-Mail ausfüllen.');
      setStatus('error');
      return;
    }

    setStatus('sending');
    setErrorMsg('');

    const { error } = await supabase.from('b2b_leads').insert({
      segment: seg,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      company: form.company.trim() || null,
      message: form.message.trim() || null,
      source: 'b2b_page',
    });

    if (error) {
      setErrorMsg('Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.');
      setStatus('error');
      return;
    }
    setStatus('done');
  };

  const inputCls =
    'w-full px-4 py-2.5 rounded-xl bg-[#F6F9FD] border border-[#E3EBF5] text-[#0F1E34] font-arimo text-sm placeholder-[#94a3b8] focus:outline-none focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/25 transition';
  const labelCls = 'block font-arimo text-xs font-bold text-[#55637A] mb-1.5';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#0A192F]/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-modal-title"
            initial={{ opacity: 0, y: reduce ? 0 : 24, scale: reduce ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : 24, scale: reduce ? 1 : 0.98 }}
            transition={{ duration: reduce ? 0 : 0.28, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Kopf mit Farbverlauf */}
            <div
              className="px-6 py-5 text-white relative"
              style={{ background: 'linear-gradient(135deg, #0A192F, #38BDF8)' }}
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Schließen"
                className="absolute top-4 right-4 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
              <h2 id="lead-modal-title" className="font-poppins font-black text-xl pr-8">
                Informationen anfragen
              </h2>
              <p className="font-arimo text-sm text-white/70 mt-1">
                Wir melden uns zeitnah mit passenden Informationen zu Ihrem Pilotprojekt.
              </p>
            </div>

            {status === 'done' ? (
              /* Erfolgsansicht */
              <div className="px-6 py-10 text-center">
                <div
                  className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(18,185,129,0.12)' }}
                >
                  <CheckCircle2 className="w-8 h-8 text-[#12b981]" aria-hidden="true" />
                </div>
                <h3 className="font-poppins font-bold text-lg text-[#0F1E34] mb-2">Vielen Dank!</h3>
                <p className="font-arimo text-sm text-[#55637A] mb-6">
                  Ihre Anfrage ist bei uns eingegangen. Wir melden uns in Kürze bei Ihnen.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center px-6 py-2.5 rounded-xl font-arimo font-bold text-sm text-[#0A192F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/50"
                  style={{ background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)' }}
                >
                  Schließen
                </button>
              </div>
            ) : (
              /* Formular */
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {/* Segment-Auswahl (vorbelegt aus dem Kontext) */}
                <div>
                  <span className={labelCls}>Ich frage an als</span>
                  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Bereich">
                    {(Object.keys(SEGMENT_META) as Segment[]).map((key) => {
                      const { label, Icon } = SEGMENT_META[key];
                      const active = seg === key;
                      return (
                        <button
                          type="button"
                          key={key}
                          role="radio"
                          aria-checked={active}
                          onClick={() => setSeg(key)}
                          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-arimo font-bold border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/40 ${
                            active
                              ? 'border-[#38BDF8] bg-[#38BDF8]/8 text-[#0F1E34]'
                              : 'border-[#E3EBF5] text-[#55637A] hover:border-[#38BDF8]/40'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="lead-name" className={labelCls}>
                    Name*
                  </label>
                  <input
                    id="lead-name"
                    ref={firstFieldRef}
                    type="text"
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={update('name')}
                    className={inputCls}
                    placeholder="Vor- und Nachname"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="lead-email" className={labelCls}>
                      E-Mail*
                    </label>
                    <input
                      id="lead-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={update('email')}
                      className={inputCls}
                      placeholder="name@firma.de"
                    />
                  </div>
                  <div>
                    <label htmlFor="lead-phone" className={labelCls}>
                      Telefon
                    </label>
                    <input
                      id="lead-phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={update('phone')}
                      className={inputCls}
                      placeholder="optional"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lead-company" className={labelCls}>
                    Unternehmen / Institution
                  </label>
                  <input
                    id="lead-company"
                    type="text"
                    autoComplete="organization"
                    value={form.company}
                    onChange={update('company')}
                    className={inputCls}
                    placeholder="Name Ihrer Organisation"
                  />
                </div>

                <div>
                  <label htmlFor="lead-message" className={labelCls}>
                    Ihre Nachricht
                  </label>
                  <textarea
                    id="lead-message"
                    rows={3}
                    value={form.message}
                    onChange={update('message')}
                    className={`${inputCls} resize-none`}
                    placeholder="Worum geht es? (optional)"
                  />
                </div>

                {/* Honeypot – für Menschen unsichtbar */}
                <div aria-hidden="true" className="hidden">
                  <label htmlFor="company_website">Website</label>
                  <input
                    id="company_website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={company_website}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                  />
                </div>

                {status === 'error' && (
                  <p className="font-arimo text-sm text-[#EF5350]" role="alert">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-arimo font-bold text-[#0A192F] transition disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/50"
                  style={{ background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)' }}
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Wird gesendet…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" aria-hidden="true" />
                      Kontakt aufnehmen
                    </>
                  )}
                </button>

                <p className="font-arimo text-[11px] text-[#94a3b8] text-center leading-relaxed">
                  Mit dem Absenden stimmen Sie der Verarbeitung Ihrer Daten gemäß unserer{' '}
                  <a href="/#/datenschutz" className="underline hover:text-[#55637A]">
                    Datenschutzerklärung
                  </a>{' '}
                  zu.
                </p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}