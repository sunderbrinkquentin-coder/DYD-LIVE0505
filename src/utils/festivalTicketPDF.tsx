import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

interface FestivalTicketPDFProps {
  ticket_label: string;
  ticket_type: string;
  ticket_number?: string;
  buyer_name?: string;
  buyer_email?: string;
  amount_paid?: number;
  created_at?: string;
  bierpong_team_name?: string;
  bierpong_partner_name?: string;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatPrice(amountInCents?: number): string {
  if (!amountInCents) return '–';
  return (amountInCents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' EUR';
}

const C = {
  bg:          '#09080a',
  gold:        '#c89b4a',
  goldLight:   '#ddc06e',
  goldDim:     '#9a7430',
  goldGlow:    'rgba(200,155,74,0.12)',
  goldBorder:  'rgba(200,155,74,0.22)',
  cream:       '#f2ead8',
  creamDim:    'rgba(242,234,216,0.60)',
  creamFaint:  'rgba(242,234,216,0.28)',
  green:       '#6dc87a',
  greenBg:     'rgba(109,200,122,0.08)',
  greenBorder: 'rgba(109,200,122,0.25)',
  divider:     'rgba(200,155,74,0.16)',
  textDim:     'rgba(242,234,216,0.36)',
};

const ACCENT_BY_TYPE: Record<string, string> = {
  early_bird: C.gold,
  concert:    '#7db8c8',
  standup:    '#c47a3c',
  dj:         '#6e9ab5',
  bierpong:   '#a8b84a',
};

const PROGRAM = [
  { time: '16:30', label: 'Stand-Up Comedy',  sub: 'Newcomer der lokalen Stand-Up Szene', color: '#c47a3c' },
  { time: '18:00', label: 'Bierpong Turnier', sub: 'Gewinnen = free drinks',              color: '#a8b84a' },
  { time: '20:30', label: 'Zirkel.WTF Live',  sub: 'Pop-Punk aus Hamburg',                color: '#7db8c8' },
  { time: '22:00', label: 'DJ Sets',           sub: 'House & Techno bis 02:00',            color: '#6e9ab5' },
];

function TicketPDFDocument({ ticket }: { ticket: FestivalTicketPDFProps }) {
  const accent = ACCENT_BY_TYPE[ticket.ticket_type] || C.gold;
  const isEarlyBird = ticket.ticket_type === 'early_bird';

  const s = StyleSheet.create({
    page: {
      backgroundColor: C.bg,
      padding: 0,
      fontFamily: 'Helvetica',
    },

    accentBar: {
      height: 5,
      backgroundColor: accent,
    },

    header: {
      paddingHorizontal: 30,
      paddingTop: 18,
      paddingBottom: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
    },
    eventName: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      color: C.cream,
      letterSpacing: 5,
      marginBottom: 3,
    },
    eventSub: {
      fontSize: 6.5,
      color: accent,
      letterSpacing: 2.5,
    },
    headerDate: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: accent,
      letterSpacing: 0.5,
      marginBottom: 2,
      textAlign: 'right',
    },
    headerLoc: {
      fontSize: 8,
      color: C.creamDim,
      textAlign: 'right',
    },

    content: {
      flexDirection: 'row',
      flex: 1,
      paddingHorizontal: 30,
      paddingTop: 20,
      paddingBottom: 16,
      gap: 22,
    },

    leftCol: {
      flex: 1.1,
    },
    rightCol: {
      flex: 0.9,
      borderLeftWidth: 1,
      borderLeftColor: C.divider,
      paddingLeft: 22,
    },

    categoryLabel: {
      fontSize: 6,
      color: C.textDim,
      letterSpacing: 2.5,
      marginBottom: 4,
    },
    ticketTitle: {
      fontSize: 26,
      fontFamily: 'Helvetica-Bold',
      color: C.cream,
      letterSpacing: 0.5,
      marginBottom: 3,
    },
    purchasedOn: {
      fontSize: 7.5,
      color: accent,
      letterSpacing: 0.5,
      marginBottom: 14,
    },

    earlyBirdBox: {
      backgroundColor: 'rgba(200,155,74,0.10)',
      borderWidth: 1,
      borderColor: 'rgba(200,155,74,0.30)',
      borderRadius: 4,
      paddingVertical: 7,
      paddingHorizontal: 10,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    earlyBirdStar: {
      fontSize: 13,
      color: C.gold,
      marginRight: 8,
    },
    earlyBirdText: {
      fontSize: 9,
      color: C.cream,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 1,
    },
    earlyBirdSub: {
      fontSize: 7,
      color: C.goldDim,
    },

    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 10,
    },
    infoItem: {
      width: '50%',
      marginBottom: 11,
      paddingRight: 8,
    },
    infoLabel: {
      fontSize: 5.5,
      color: C.textDim,
      letterSpacing: 2,
      marginBottom: 3,
    },
    infoValue: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: C.creamDim,
    },
    ticketNum: {
      fontSize: 10,
      fontFamily: 'Courier',
      color: accent,
    },

    paidBadge: {
      backgroundColor: C.greenBg,
      borderWidth: 1,
      borderColor: C.greenBorder,
      borderRadius: 3,
      paddingVertical: 3,
      paddingHorizontal: 7,
      alignSelf: 'flex-start',
    },
    paidText: {
      fontSize: 7,
      fontFamily: 'Helvetica-Bold',
      color: C.green,
      letterSpacing: 1.2,
    },

    bierpongBox: {
      backgroundColor: 'rgba(168,184,74,0.07)',
      borderWidth: 1,
      borderColor: 'rgba(168,184,74,0.22)',
      borderRadius: 4,
      padding: 9,
      marginBottom: 10,
    },
    bierpongLabel: {
      fontSize: 6,
      fontFamily: 'Helvetica-Bold',
      color: '#a8b84a',
      letterSpacing: 2,
      marginBottom: 6,
    },

    divider: {
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
      marginBottom: 10,
    },

    programLabel: {
      fontSize: 6,
      color: C.textDim,
      letterSpacing: 2.5,
      marginBottom: 10,
    },
    actRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    actTime: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: C.cream,
      width: 36,
      marginTop: 1,
    },
    actBar: {
      width: 2.5,
      height: 28,
      borderRadius: 2,
      marginRight: 8,
      marginTop: 2,
    },
    actBlock: { flex: 1 },
    actName: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 1,
    },
    actSub: {
      fontSize: 7,
      color: C.creamFaint,
    },

    hinweisBox: {
      backgroundColor: C.goldGlow,
      borderWidth: 1,
      borderColor: C.goldBorder,
      borderRadius: 4,
      padding: 9,
      marginTop: 12,
    },
    hinweisTitle: {
      fontSize: 5.5,
      fontFamily: 'Helvetica-Bold',
      color: C.textDim,
      letterSpacing: 2,
      marginBottom: 7,
    },
    hinweisRow: {
      flexDirection: 'row',
      marginBottom: 5,
    },
    hinweisDot: {
      fontSize: 7,
      color: accent,
      marginRight: 6,
      marginTop: 0.5,
    },
    hinweisText: {
      fontSize: 7.5,
      color: C.creamDim,
      flex: 1,
    },
    timingNote: {
      fontSize: 6.5,
      color: C.textDim,
      marginTop: 6,
      fontStyle: 'italic',
    },

    footer: {
      borderTopWidth: 1,
      borderTopColor: C.divider,
      paddingTop: 9,
      paddingHorizontal: 30,
      paddingBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    footerLine: {
      fontSize: 6.5,
      color: C.textDim,
      marginBottom: 2,
    },
    footerWebsite: {
      fontSize: 7,
      fontFamily: 'Helvetica-Bold',
      color: accent,
    },
    footerRight: { alignItems: 'flex-end' },
    footerLoc: {
      fontSize: 7,
      color: accent,
      marginBottom: 1,
    },
    footerAddr: {
      fontSize: 6.5,
      color: C.textDim,
    },

    watermark: {
      position: 'absolute',
      bottom: 28,
      right: 28,
      fontSize: 52,
      fontFamily: 'Helvetica-Bold',
      color: 'rgba(200,155,74,0.022)',
      letterSpacing: 5,
      transform: 'rotate(-9deg)',
    },
  });

  return (
    <Document>
      <Page size="A5" orientation="landscape" style={s.page}>
        <View style={s.accentBar} />
        <Text style={s.watermark}>HARMONY</Text>

        <View style={s.header}>
          <View>
            <Text style={s.eventName}>HARMONY 2026</Text>
            <Text style={s.eventSub}>EINTRITTSKARTE · KLUB KULB · DÜSSELDORF</Text>
          </View>
          <View>
            <Text style={s.headerDate}>22. August 2026</Text>
            <Text style={s.headerLoc}>16:30 – 02:00 Uhr</Text>
          </View>
        </View>

        <View style={s.content}>
          <View style={s.leftCol}>
            <Text style={s.categoryLabel}>TICKET-KATEGORIE</Text>
            <Text style={s.ticketTitle}>{ticket.ticket_label}</Text>
            {ticket.created_at && (
              <Text style={s.purchasedOn}>Gekauft am {formatDate(ticket.created_at)}</Text>
            )}

            {isEarlyBird && (
              <View style={s.earlyBirdBox}>
                <Text style={s.earlyBirdStar}>★</Text>
                <View>
                  <Text style={s.earlyBirdText}>Early Bird: 1 Freigetränk inklusive</Text>
                  <Text style={s.earlyBirdSub}>Ticket an der Bar vorzeigen zur Einlösung</Text>
                </View>
              </View>
            )}

            <View style={s.infoGrid}>
              {ticket.buyer_name && (
                <View style={s.infoItem}>
                  <Text style={s.infoLabel}>NAME</Text>
                  <Text style={s.infoValue}>{ticket.buyer_name}</Text>
                </View>
              )}
              {ticket.ticket_number && (
                <View style={s.infoItem}>
                  <Text style={s.infoLabel}>TICKET-NR.</Text>
                  <Text style={s.ticketNum}>{ticket.ticket_number}</Text>
                </View>
              )}
              <View style={s.infoItem}>
                <Text style={s.infoLabel}>DATUM</Text>
                <Text style={s.infoValue}>22.08.2026</Text>
              </View>
              <View style={s.infoItem}>
                <Text style={s.infoLabel}>PREIS</Text>
                <Text style={s.infoValue}>{formatPrice(ticket.amount_paid)}</Text>
              </View>
              {ticket.buyer_email && (
                <View style={s.infoItem}>
                  <Text style={s.infoLabel}>E-MAIL</Text>
                  <Text style={[s.infoValue, { fontSize: 7.5 }]}>{ticket.buyer_email}</Text>
                </View>
              )}
              <View style={s.infoItem}>
                <Text style={s.infoLabel}>STATUS</Text>
                <View style={s.paidBadge}>
                  <Text style={s.paidText}>BEZAHLT</Text>
                </View>
              </View>
            </View>

            {ticket.bierpong_team_name && (
              <View style={s.bierpongBox}>
                <Text style={s.bierpongLabel}>BIERPONG-TURNIER</Text>
                <View style={s.infoGrid}>
                  <View style={s.infoItem}>
                    <Text style={s.infoLabel}>TEAMNAME</Text>
                    <Text style={[s.infoValue, { color: '#a8b84a' }]}>{ticket.bierpong_team_name}</Text>
                  </View>
                  {ticket.bierpong_partner_name && (
                    <View style={s.infoItem}>
                      <Text style={s.infoLabel}>TEAMMITGLIED</Text>
                      <Text style={s.infoValue}>{ticket.bierpong_partner_name}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>

          <View style={s.rightCol}>
            <Text style={s.programLabel}>ABENDPROGRAMM</Text>
            {PROGRAM.map((act) => (
              <View key={act.time} style={s.actRow}>
                <Text style={s.actTime}>{act.time}</Text>
                <View style={[s.actBar, { backgroundColor: act.color }]} />
                <View style={s.actBlock}>
                  <Text style={[s.actName, { color: act.color }]}>{act.label}</Text>
                  <Text style={s.actSub}>{act.sub}</Text>
                </View>
              </View>
            ))}

            <Text style={s.timingNote}>* Alle Zeiten sind Richtwerte und können sich noch ändern.</Text>

            <View style={s.hinweisBox}>
              <Text style={s.hinweisTitle}>WICHTIGE HINWEISE</Text>
              <View style={s.hinweisRow}>
                <Text style={s.hinweisDot}>›</Text>
                <Text style={s.hinweisText}>Einlass ab 16:00 · Kein Zutritt unter 18 Jahren</Text>
              </View>
              <View style={s.hinweisRow}>
                <Text style={s.hinweisDot}>›</Text>
                <Text style={s.hinweisText}>Ticket + Ausweis am Eingang vorzeigen</Text>
              </View>
              <View style={s.hinweisRow}>
                <Text style={s.hinweisDot}>›</Text>
                <Text style={s.hinweisText}>Nicht übertragbar · gilt für eine Person</Text>
              </View>
              {isEarlyBird && (
                <View style={s.hinweisRow}>
                  <Text style={[s.hinweisDot, { color: C.gold }]}>★</Text>
                  <Text style={[s.hinweisText, { color: C.goldLight }]}>Freigetränk an der Bar – Ticket vorzeigen</Text>
                </View>
              )}
              <View style={s.hinweisRow}>
                <Text style={s.hinweisDot}>›</Text>
                <Text style={s.hinweisText}>U-Bahn: Heinrich-Heine-Allee (3 min)</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.footer}>
          <View>
            <Text style={s.footerLine}>Einlass ab 16:00 Uhr · Burgplatz 11, 40213 Düsseldorf</Text>
            <Text style={s.footerLine}>Veranstaltet durch DYD – Decide Your Dream</Text>
            <Text style={s.footerWebsite}>www.decide-your-dream.de</Text>
          </View>
          <View style={s.footerRight}>
            <Text style={s.footerLoc}>Klub Kulb</Text>
            <Text style={s.footerAddr}>Burgplatz 11 · 40213 Düsseldorf</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadFestivalTicketPDF(ticket: FestivalTicketPDFProps): Promise<void> {
  const blob = await pdf(<TicketPDFDocument ticket={ticket} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ticketNum = ticket.ticket_number ? `-${ticket.ticket_number}` : '';
  a.download = `harmony-ticket${ticketNum}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
