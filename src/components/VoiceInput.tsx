import { useEffect, useRef, useState } from 'react';
import { Mic } from 'lucide-react';

type VoiceInputProps = {
  value: string;
  onChange: (v: string) => void;
  variant?: 'dark' | 'light';
  label?: string;
};

export function VoiceInput({ value, onChange, variant = 'dark', label = 'Anliegen diktieren' }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const baseRef = useRef('');

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    return () => {
      try { recRef.current?.stop(); } catch { /* bereits gestoppt */ }
    };
  }, []);

  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return null;

  const toggle = () => {
    if (listening) {
      try { recRef.current?.stop(); } catch { /* noop */ }
      return;
    }
    const rec = new SR();
    rec.lang = 'de-DE';
    rec.continuous = true;
    rec.interimResults = true;
    baseRef.current = value ? `${value.trimEnd()} ` : '';
    let interim = '';
    rec.onresult = (e: any) => {
      interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) baseRef.current += `${t} `;
        else interim += t;
      }
      onChange((baseRef.current + interim).trimStart());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  const idleCls = variant === 'dark'
    ? 'border-white/15 text-white/60 hover:text-white hover:border-white/35'
    : 'border-[#E3EBF5] text-[#55637A] hover:border-[#38BDF8] hover:text-[#38BDF8]';
  const activeCls = variant === 'dark'
    ? 'border-[#EF8A8A]/60 text-[#EF8A8A] bg-[#EF8A8A]/10'
    : 'border-[#EF5350]/50 text-[#EF5350] bg-[#EF5350]/10';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={listening}
      aria-label={listening ? 'Diktat stoppen' : label}
      title={listening ? 'Aufnahme stoppen' : 'Per Mikrofon einsprechen'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-arimo text-[11px] font-bold transition ${listening ? activeCls : idleCls}`}
    >
      <span className="relative inline-flex" aria-hidden="true">
        <Mic className="w-3.5 h-3.5" />
        {listening && <span className="absolute inset-0 rounded-full bg-[#EF5350]/50 animate-ping" />}
      </span>
      {listening ? 'Aufnahme stoppen …' : 'Einsprechen'}
    </button>
  );
}
