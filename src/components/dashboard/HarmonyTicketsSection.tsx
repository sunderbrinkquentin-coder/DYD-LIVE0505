import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, CheckCircle, MapPin, Trophy, Music, ExternalLink, Download } from 'lucide-react';
import { downloadFestivalTicketPDF } from '../../utils/festivalTicketPDF';

interface HarmonyTicket {
  id: string;
  ticket_type: string;
  ticket_label: string;
  buyer_name?: string;
  buyer_email?: string;
  ticket_number?: string;
  amount_paid?: number;
  bierpong_team_name?: string;
  bierpong_partner_name?: string;
  created_at?: string;
  payment_status?: string;
}

interface HarmonyTicketsSectionProps {
  tickets: HarmonyTicket[];
}

const ACCENT_MAP: Record<string, string> = {
  early_bird: '#00d4d4',
  concert: '#1e90d4',
  standup: '#f07820',
  dj: '#4dc8e8',
  bierpong: '#c8e840',
};

function formatPaidDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function TicketCard({ ticket }: { ticket: HarmonyTicket }) {
  const navigate = useNavigate();
  const accent = ACCENT_MAP[ticket.ticket_type] || '#00d4d4';
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadFestivalTicketPDF(ticket);
    } finally {
      setDownloading(false);
    }
  };

  const paidDate = formatPaidDate(ticket.created_at);

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${accent}22` }}
    >
      <div
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: `linear-gradient(to right, transparent, ${accent}80, transparent)` }}
      />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: accent,
                opacity: 0.7,
                marginBottom: '4px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              HARMONY 2026
            </p>
            <h3 className="font-bold text-white text-base">{ticket.ticket_label}</h3>
          </div>
          <CheckCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: accent }} />
        </div>

        {paidDate && (
          <div
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 mb-3 text-xs font-semibold"
            style={{ background: 'rgba(0,200,80,0.08)', border: '1px solid rgba(0,200,80,0.2)', color: '#00c850' }}
          >
            <CheckCircle size={12} />
            Bezahlt am {paidDate}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          {ticket.buyer_name && (
            <div>
              <p className="text-white/40 text-xs mb-0.5">Name</p>
              <p className="text-white/80 font-medium">{ticket.buyer_name}</p>
            </div>
          )}
          <div>
            <p className="text-white/40 text-xs mb-0.5">Datum</p>
            <p className="text-white/80 font-medium">22.08.2026</p>
          </div>
          {ticket.ticket_number && (
            <div>
              <p className="text-white/40 text-xs mb-0.5">Ticket-Nr.</p>
              <p className="font-mono text-xs font-semibold" style={{ color: accent }}>
                {ticket.ticket_number}
              </p>
            </div>
          )}
          <div>
            <p className="text-white/40 text-xs mb-0.5">Preis</p>
            <p className="text-white/80 font-medium">
              {ticket.amount_paid
                ? (ticket.amount_paid / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €'
                : '–'}
            </p>
          </div>
        </div>

        {ticket.bierpong_team_name && (
          <div
            className="rounded-xl p-3 mt-2"
            style={{
              background: 'rgba(200,232,64,0.05)',
              border: '1px solid rgba(200,232,64,0.15)',
            }}
          >
            <p
              className="text-xs font-bold mb-1.5 flex items-center gap-1.5"
              style={{ color: '#c8e840', letterSpacing: '0.2em', textTransform: 'uppercase' }}
            >
              <Trophy size={11} /> Bierpong-Team
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <p className="text-white/40 text-xs mb-0.5">Teamname</p>
                <p className="font-bold" style={{ color: '#c8e840' }}>
                  {ticket.bierpong_team_name}
                </p>
              </div>
              {ticket.bierpong_partner_name && (
                <div>
                  <p className="text-white/40 text-xs mb-0.5">Teammitglied</p>
                  <p className="text-white/80 font-medium">{ticket.bierpong_partner_name}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-white/30 text-xs">
            <MapPin size={11} /> Burgplatz, Düsseldorf · 17:00–02:00 Uhr
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all"
              style={{
                background: `${accent}14`,
                border: `1px solid ${accent}30`,
                color: accent,
                opacity: downloading ? 0.5 : 1,
              }}
            >
              <Download size={12} />
              {downloading ? 'Wird erstellt...' : 'PDF'}
            </button>
            <button
              onClick={() => navigate('/festival#tickets')}
              className="text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: accent }}
            >
              Zum Festival →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyHarmonyState() {
  const navigate = useNavigate();

  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: 'rgba(0,212,212,0.03)',
        border: '1px solid rgba(0,212,212,0.15)',
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: 'linear-gradient(to right, transparent, rgba(0,212,212,0.5), transparent)' }}
      />
      <div className="p-6 flex flex-col sm:flex-row items-center gap-5">
        <div
          className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(0,212,212,0.08)', border: '1px solid rgba(0,212,212,0.2)' }}
        >
          <Music size={26} style={{ color: '#00d4d4' }} />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#00d4d4',
              opacity: 0.7,
              marginBottom: '4px',
            }}
          >
            HARMONY 2026
          </p>
          <h3 className="font-bold text-white text-base mb-1">
            22. August 2026 · Burgplatz, Düsseldorf
          </h3>
          <p className="text-white/50 text-sm">
            Noch kein Ticket? Sichere dir jetzt deinen Platz beim Harmony Festival.
          </p>
        </div>
        <button
          onClick={() => navigate('/festival#tickets')}
          className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-80"
          style={{ background: 'rgba(0,212,212,0.12)', color: '#00d4d4', border: '1px solid rgba(0,212,212,0.3)' }}
        >
          <ExternalLink size={15} />
          Tickets kaufen
        </button>
      </div>
    </div>
  );
}

export function HarmonyTicketsSection({ tickets }: HarmonyTicketsSectionProps) {
  return (
    <div>
      <h2 className="text-base sm:text-lg font-bold text-white mb-2 flex items-center gap-2">
        <Ticket size={20} style={{ color: '#00d4d4' }} />
        Harmony Festival 2026
      </h2>
      <p className="text-xs sm:text-sm text-white/60 mb-3">
        22.08.2026 · Burgplatz, Düsseldorf
      </p>

      {tickets.length === 0 ? (
        <EmptyHarmonyState />
      ) : (
        <div className="mt-1">
          <p className="text-xs font-semibold mb-3" style={{ color: '#00d4d4', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            Deine Tickets
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
