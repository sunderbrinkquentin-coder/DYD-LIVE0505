import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, pdf, Image,
  Svg, Line, Polygon,
} from '@react-pdf/renderer';

import logoSskdd        from '/SSKDD_Logo3.png?url';
import logoFuechschen   from '/logo_fuechschen-alt.jpg?url';
import logoMonsterslush from '/monsterslush-logo.png?url';
import logoGrunerBier   from '/gruner_bier_radeberger_gruppe_41338-167277218.png?url';
import logoHofmann      from '/Hofmann.png?url';
import logoGreif        from '/brauerei-greif.png?url';

// ── Typen ────────────────────────────────────────────────────────────────────

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

// ── Sponsoren ─────────────────────────────────────────────────────────────────

const SPONSORS = [
  { name: 'Stadtsparkasse Düsseldorf', logo: logoSskdd        },
  { name: 'Füchschen Alt',             logo: logoFuechschen   },
  { name: 'Monsterslush',              logo: logoMonsterslush },
  { name: 'Grüner Bier',               logo: logoGrunerBier   },
  { name: 'Hofmann',                   logo: logoHofmann      },
  { name: 'Greif Bräu',                logo: logoGreif        },
];

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}
function formatPrice(amountInCents?: number): string {
  if (!amountInCents) return '-';
  return (amountInCents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' EUR';
}

// ── Farben ───────────────────────────────────────────────────────────────────

const C = {
  bg: '#131b2e', dydBg: '#1c2745',
  gold: '#d4a843', goldBorder: 'rgba(212,168,67,0.22)',
  cream: '#ffffff', creamDim: 'rgba(255,255,255,0.65)', creamFaint: 'rgba(255,255,255,0.30)',
  green: '#4ade80', greenBg: 'rgba(74,222,128,0.10)', greenBorder: 'rgba(74,222,128,0.28)',
  teal: '#7db8c8',
  divider: 'rgba(212,168,67,0.12)', textDim: 'rgba(255,255,255,0.28)',
};

const ACCENT_BY_TYPE: Record<string, string> = {
  early_bird: C.gold, concert: C.teal, standup: '#c47a3c', dj: '#6e9ab5', bierpong: '#a8b84a',
};

const PROGRAM = [
  { time: '16:30', label: 'Stand-Up Comedy',  sub: 'Newcomer der lokalen Stand-Up Szene', color: '#c47a3c'  },
  { time: '18:00', label: 'Bierpong Turnier', sub: 'Gewinnen = free drinks',              color: '#a8b84a', bierpongNote: true },
  { time: '20:30', label: 'Zirkel.WTF Live',  sub: 'Pop-Punk aus Hamburg',                color: C.teal    },
  { time: '22:00', label: 'DJ Sets',           sub: 'House & Techno bis 02:00',            color: '#6e9ab5' },
];

const WAVE_HEIGHTS = [4,7,11,15,9,17,12,20,16,10,18,13,7,23,14,18,11,20,13,17,22,8,16,19,11,14,20,12,17,8,19,14,12,18,10,16,13,7];
const WAVE_COLORS  = ['#c47a3c','#a8b84a',C.teal,C.gold];

const DRIPS = [
  {left:'9%',  h:32, c:'#c47a3c', op:0.11}, {left:'14%', h:48, c:'#c47a3c', op:0.08},
  {left:'20%', h:24, c:'#c47a3c', op:0.09}, {left:'30%', h:36, c:'#a8b84a', op:0.10},
  {left:'37%', h:22, c:'#a8b84a', op:0.08}, {left:'44%', h:50, c:'#a8b84a', op:0.07},
  {left:'52%', h:28, c:'#7db8c8', op:0.10}, {left:'59%', h:42, c:'#7db8c8', op:0.08},
  {left:'65%', h:20, c:'#7db8c8', op:0.09}, {left:'73%', h:34, c:'#d4a843', op:0.10},
  {left:'79%', h:24, c:'#d4a843', op:0.08},
];

// Graffiti als heller Fill-Text (kein SVG-Stroke – pdfkit rendert das unzuverlässig)
const GRAFFITI = [
  { txt:'2026', top:55,   right:8,   sz:58, col:'rgba(125,184,200,0.10)', rot:-7  },
  { txt:'LIVE', top:105,  left:22,   sz:36, col:'rgba(196,122,60,0.08)',  rot:13  },
  { txt:'DUS',  bottom:30,left:140,  sz:30, col:'rgba(168,184,74,0.09)',  rot:-11 },
  { txt:'HRM',  top:150,  left:210,  sz:26, col:'rgba(212,168,67,0.07)',  rot:16  },
  { txt:'KULB', bottom:48, right:18, sz:19, col:'rgba(212,168,67,0.07)',  rot:-18 },
];

const FEATURES = [
  'ATS-Lebenslauf-Check', 'One-Click-Optimierung', 'CV-Wizard in 5 min',
  'Skill Gap-Analyse', 'Lernpfade & Zertifikate', 'Bewerbungsmanagement',
];

// ════════════════════════════════════════════════════════════════════════════
// VORDERSEITE
// ════════════════════════════════════════════════════════════════════════════

function FrontPage({ ticket }: { ticket: FestivalTicketPDFProps }) {
  const accent     = ACCENT_BY_TYPE[ticket.ticket_type] || C.gold;
  const isEarlyBird = ticket.ticket_type === 'early_bird';

  const s = StyleSheet.create({
    page:         { backgroundColor: C.bg, padding: 0, fontFamily: 'Helvetica' },
    topBar:       { flexDirection: 'row', height: 5 },
    mainRow:      { flexDirection: 'row', flex: 1 },
    mainTicket:   { flex: 1 },
    absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

    header:      { paddingHorizontal: 26, paddingTop: 13, paddingBottom: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: C.divider },
    pill:        { backgroundColor: 'rgba(212,168,67,0.12)', borderWidth: 1, borderColor: C.goldBorder, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginRight: 7 },
    pillText:    { fontSize: 6, color: C.gold, letterSpacing: 2.5, fontFamily: 'Helvetica-Bold' },
    eventName:   { fontSize: 21, fontFamily: 'Helvetica-Bold', color: C.cream, letterSpacing: 3.5, marginBottom: 2 },
    eventSub:    { fontSize: 6, color: 'rgba(212,168,67,0.65)', letterSpacing: 2.5 },
    datebox:     { backgroundColor: 'rgba(212,168,67,0.10)', borderWidth: 1, borderColor: C.goldBorder, borderRadius: 5, paddingHorizontal: 11, paddingVertical: 7, alignItems: 'flex-end' },
    dateboxDate: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.gold, marginBottom: 2 },
    dateboxTime: { fontSize: 6.5, color: 'rgba(255,255,255,0.40)' },

    content:   { flexDirection: 'row', paddingHorizontal: 26, paddingTop: 11, paddingBottom: 9, flex: 1 },
    leftCol:   { flex: 1.1, paddingRight: 10 },
    rightCol:  { flex: 0.9, borderLeftWidth: 1, borderLeftColor: C.divider, paddingLeft: 13 },

    catLabel:    { fontSize: 5.5, color: C.textDim, letterSpacing: 2.5, marginBottom: 2 },
    ticketTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.cream, marginBottom: 1 },
    purchasedOn: { fontSize: 7, color: accent, marginBottom: 8 },
    earlyStrip:  { borderLeftWidth: 3, borderLeftColor: C.gold, backgroundColor: 'rgba(212,168,67,0.07)', paddingHorizontal: 7, paddingVertical: 5, marginBottom: 9 },
    earlyText:   { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.cream, marginBottom: 1 },
    earlySub:    { fontSize: 6, color: 'rgba(255,255,255,0.38)' },
    infoGrid:    { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 9 },
    infoItem:    { width: '50%', marginBottom: 7, paddingRight: 6 },
    infoLabel:   { fontSize: 5.5, color: C.textDim, letterSpacing: 2, marginBottom: 2 },
    infoValue:   { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.creamDim },
    ticketNum:   { fontSize: 8.5, fontFamily: 'Courier', color: C.gold, letterSpacing: 0.5 },
    paidBadge:   { backgroundColor: C.greenBg, borderWidth: 1, borderColor: C.greenBorder, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
    paidDot:     { width: 4, height: 4, borderRadius: 2, backgroundColor: C.green, marginRight: 3 },
    paidText:    { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.green, letterSpacing: 1 },
    hinweiseBox: { backgroundColor: 'rgba(212,168,67,0.06)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.13)', borderRadius: 4, padding: 7 },
    hinweisLbl:  { fontSize: 5.5, color: C.textDim, letterSpacing: 2, marginBottom: 4 },
    hinweisRow:  { flexDirection: 'row', marginBottom: 3 },
    hinweisDot:  { fontSize: 6.5, color: C.gold, marginRight: 4 },
    hinweisText: { fontSize: 6.5, color: 'rgba(255,255,255,0.48)', flex: 1 },

    programLbl:  { fontSize: 5.5, color: C.textDim, letterSpacing: 2.5, marginBottom: 8 },
    actRow:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 7 },
    actTime:     { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.cream, width: 28, marginTop: 1 },
    actBar:      { width: 3, height: 26, borderRadius: 1.5, marginRight: 7, marginTop: 1 },
    actBlock:    { flex: 1 },
    actName:     { fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 1 },
    actSub:      { fontSize: 6, color: 'rgba(255,255,255,0.28)' },
    timingNote:  { fontSize: 5.5, color: 'rgba(255,255,255,0.20)', marginTop: 4, fontStyle: 'italic' },

    // Bierpong-Hinweis (positiv zuerst, Anmeldung als Zusatz)
    bpNoteBox:  { backgroundColor: 'rgba(74,222,128,0.07)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.22)', borderRadius: 3, paddingHorizontal: 6, paddingVertical: 5, marginLeft: 35, marginTop: 2, marginBottom: 5 },
    bpNoteMain: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.green, marginBottom: 2 },
    bpNoteSub:  { fontSize: 6, color: 'rgba(255,255,255,0.45)' },

    bierpongBox: { backgroundColor: 'rgba(168,184,74,0.07)', borderWidth: 1, borderColor: 'rgba(168,184,74,0.22)', borderRadius: 4, padding: 7, marginBottom: 8 },
    bierpongLbl: { fontSize: 5.5, fontFamily: 'Helvetica-Bold', color: '#a8b84a', letterSpacing: 2, marginBottom: 5 },

    footer:      { borderTopWidth: 1, borderTopColor: 'rgba(212,168,67,0.10)', paddingHorizontal: 26, paddingVertical: 7, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    footerLine:  { fontSize: 5.5, color: C.textDim, marginBottom: 1.5 },
    footerWeb:   { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.gold },
    footerRight: { alignItems: 'flex-end' },
    footerHash:  { fontSize: 5.5, color: 'rgba(255,255,255,0.20)' },
    footerSmall: { fontSize: 5, color: 'rgba(255,255,255,0.14)', marginTop: 1 },

    separator:   { width: 20, backgroundColor: C.bg },

    dydPanel:    { width: 140, backgroundColor: C.dydBg, paddingHorizontal: 11, paddingVertical: 12, flexDirection: 'column' },
    dydLogoWrap: { alignItems: 'center', marginBottom: 8 },
    dydBadge:    { backgroundColor: C.gold, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 3 },
    dydBadgeTxt: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0f1623', letterSpacing: 2 },
    dydSub:      { fontSize: 6, color: 'rgba(255,255,255,0.30)', letterSpacing: 0.5 },
    taglineBox:  { backgroundColor: 'rgba(212,168,67,0.09)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.20)', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 7, alignItems: 'center', marginBottom: 8 },
    taglineTxt:  { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.gold, letterSpacing: 0.5, lineHeight: 1.7 },
    dydDivider:  { borderBottomWidth: 1, borderBottomColor: 'rgba(212,168,67,0.10)', marginBottom: 8 },
    featLbl:     { fontSize: 5.5, color: 'rgba(255,255,255,0.28)', letterSpacing: 2, marginBottom: 5 },
    featChip:    { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2.5, marginBottom: 3, flexDirection: 'row', alignItems: 'center' },
    featCheck:   { fontSize: 6, color: C.gold, marginRight: 4 },
    featText:    { fontSize: 6.5, color: 'rgba(255,255,255,0.65)' },
    ctaBtn:      { backgroundColor: C.gold, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 6, alignItems: 'center', marginBottom: 8, marginTop: 7 },
    ctaLbl:      { fontSize: 5.5, color: '#0f1623', fontFamily: 'Helvetica-Bold', letterSpacing: 1.2, opacity: 0.75, marginBottom: 1 },
    ctaUrl:      { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#0f1623', letterSpacing: 0.3 },
    socialLbl:   { fontSize: 5.5, color: 'rgba(255,255,255,0.28)', letterSpacing: 2, marginBottom: 6 },
    socialRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    socialIG:    { width: 16, height: 16, borderRadius: 4, backgroundColor: '#e1306c', alignItems: 'center', justifyContent: 'center', marginRight: 5 },
    socialTT:    { width: 16, height: 16, borderRadius: 4, backgroundColor: '#010101', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 5 },
    socialLI:    { width: 16, height: 16, borderRadius: 4, backgroundColor: '#0077b5', alignItems: 'center', justifyContent: 'center', marginRight: 5 },
    socialIcon:  { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#fff' },
    socialHdl:   { fontSize: 6.5, color: 'rgba(255,255,255,0.58)', flex: 1 },
  });

  return (
    <Page size="A5" orientation="landscape" style={s.page}>

      {/* Top-Balken */}
      <View style={s.topBar}>
        {['#c47a3c','#a8b84a',C.teal,C.gold].map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>

      <View style={s.mainRow}>

        {/* ════ MAIN TICKET ════ */}
        <View style={s.mainTicket}>

          {/* HARMONY Wasserzeichen */}
          <Text style={{ position:'absolute', bottom:8, left:0, right:0, textAlign:'center', fontSize:112, fontFamily:'Helvetica-Bold', color:'rgba(212,168,67,0.05)', letterSpacing:8 }}>
            HARMONY
          </Text>

          {/* Spotlight – KORRIGIERT: Opacity 0.004 statt 0.016 */}
          <Svg style={s.absoluteFill} viewBox="0 0 420 300">
            <Polygon points="181,0 239,0 318,300 103,300" fill="rgba(255,255,230,0.004)" />
            <Polygon points="59,0 92,0 143,300 8,300"     fill="rgba(196,122,60,0.005)" />
            <Polygon points="286,0 319,0 378,300 227,300" fill="rgba(125,184,200,0.005)" />
          </Svg>

          {/* Farb-Drips */}
          {DRIPS.map((d, i) => (
            <View key={i} style={{ position:'absolute', top:5, left:d.left, width:2.5, height:d.h, backgroundColor:d.c, opacity:d.op, borderBottomLeftRadius:3, borderBottomRightRadius:3 }} />
          ))}

          {/* Graffiti – einfacher heller Text, kein SVG-Stroke */}
          {GRAFFITI.map((g, i) => (
            <Text key={i} style={{
              position: 'absolute',
              ...(g.top    !== undefined ? { top:    g.top }    : { bottom: (g as any).bottom }),
              ...(g.right  !== undefined ? { right:  g.right }  : { left:   (g as any).left  }),
              fontSize: g.sz, fontFamily: 'Helvetica-Bold',
              color: g.col, transform: `rotate(${g.rot}deg)`,
            }}>
              {g.txt}
            </Text>
          ))}

          {/* Soundwave-Equalizer */}
          <View style={{ position:'absolute', bottom:0, left:0, right:0, height:26, flexDirection:'row', alignItems:'flex-end', paddingHorizontal:8 }}>
            {WAVE_HEIGHTS.map((h, i) => (
              <View key={i} style={{ flex:1, height:h, backgroundColor:WAVE_COLORS[i%4], opacity:0.08, borderTopLeftRadius:1, borderTopRightRadius:1, marginHorizontal:0.8 }} />
            ))}
          </View>

          {/* ── HEADER ── */}
          <View style={s.header}>
            <View>
              <View style={{ flexDirection:'row', alignItems:'center', marginBottom:5 }}>
                <View style={s.pill}><Text style={s.pillText}>FESTIVAL</Text></View>
                <View style={{ width:16, height:1, backgroundColor:'rgba(212,168,67,0.22)', marginRight:7 }} />
                <Text style={{ fontSize:6.5, color:C.creamFaint, letterSpacing:1 }}>Düsseldorf · 2026</Text>
              </View>
              <Text style={s.eventName}>HARMONY 2026</Text>
              <Text style={s.eventSub}>EINTRITTSKARTE · KLUB KULB · BURGPLATZ 11</Text>
            </View>
            <View style={s.datebox}>
              <Text style={s.dateboxDate}>22. August 2026</Text>
              <Text style={s.dateboxTime}>Sa · 16:30 – 02:00 Uhr</Text>
            </View>
          </View>

          {/* ── CONTENT ── */}
          <View style={s.content}>

            {/* Linke Spalte */}
            <View style={s.leftCol}>
              <Text style={s.catLabel}>TICKET-KATEGORIE</Text>
              <Text style={s.ticketTitle}>{ticket.ticket_label}</Text>
              {ticket.created_at && (
                <Text style={s.purchasedOn}>Erworben am {formatDate(ticket.created_at)}</Text>
              )}

              {isEarlyBird && (
                <View style={s.earlyStrip}>
                  <Text style={s.earlyText}>Freigetraenk inklusive</Text>
                  <Text style={s.earlySub}>Ticket an der Bar vorzeigen</Text>
                </View>
              )}

              <View style={s.infoGrid}>
                {ticket.buyer_name && (
                  <View style={s.infoItem}>
                    <Text style={s.infoLabel}>INHABER</Text>
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
                    <Text style={[s.infoValue, { fontSize:7 }]}>{ticket.buyer_email}</Text>
                  </View>
                )}
                <View style={s.infoItem}>
                  <Text style={s.infoLabel}>STATUS</Text>
                  <View style={s.paidBadge}>
                    <View style={s.paidDot} />
                    <Text style={s.paidText}>BEZAHLT</Text>
                  </View>
                </View>
                <View style={s.infoItem}>
                  <Text style={s.infoLabel}>EINLASS</Text>
                  <Text style={s.infoValue}>16:00 Uhr</Text>
                </View>
              </View>

              {ticket.bierpong_team_name && (
                <View style={s.bierpongBox}>
                  <Text style={s.bierpongLbl}>BIERPONG-TURNIER</Text>
                  <View style={s.infoGrid}>
                    <View style={s.infoItem}>
                      <Text style={s.infoLabel}>TEAMNAME</Text>
                      <Text style={[s.infoValue, { color:'#a8b84a' }]}>{ticket.bierpong_team_name}</Text>
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

              <View style={s.hinweiseBox}>
                <Text style={s.hinweisLbl}>HINWEISE</Text>
                <View style={s.hinweisRow}>
                  <Text style={s.hinweisDot}>›</Text>
                  <Text style={[s.hinweisText, { color:'rgba(255,255,255,0.65)' }]}>Einlass um 16:00 Uhr · Bitte puenktlich sein!</Text>
                </View>
                <View style={s.hinweisRow}>
                  <Text style={s.hinweisDot}>›</Text>
                  <Text style={s.hinweisText}>Ticket + Personalausweis am Eingang · Nicht uebertragbar · 18+</Text>
                </View>
                <View style={[s.hinweisRow, { marginBottom:0 }]}>
                  <Text style={s.hinweisDot}>›</Text>
                  <Text style={s.hinweisText}>U-Bahn: Heinrich-Heine-Allee (3 min)</Text>
                </View>
                {isEarlyBird && (
                  <View style={[s.hinweisRow, { marginBottom:0, marginTop:3 }]}>
                    <Text style={[s.hinweisDot, { color:C.gold }]}>*</Text>
                    <Text style={[s.hinweisText, { color:'rgba(212,168,67,0.80)' }]}>Freigetraenk an der Bar – Ticket vorzeigen</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Rechte Spalte: Programm */}
            <View style={s.rightCol}>
              <Text style={s.programLbl}>ABENDPROGRAMM</Text>
              {PROGRAM.map((act) => (
                <View key={act.time}>
                  <View style={s.actRow}>
                    <Text style={s.actTime}>{act.time}</Text>
                    <View style={[s.actBar, { backgroundColor: act.color }]} />
                    <View style={s.actBlock}>
                      <Text style={[s.actName, { color: act.color }]}>{act.label}</Text>
                      <Text style={s.actSub}>{act.sub}</Text>
                    </View>
                  </View>
                  {act.bierpongNote && (
                    <View style={s.bpNoteBox}>
                      <Text style={s.bpNoteMain}>Zuschauen & Feiern fuer alle – kein Extra-Ticket noetig</Text>
                      <Text style={s.bpNoteSub}>Wer mitspielen moechte: separate Team-Anmeldung erforderlich (nicht im Bundle enthalten)</Text>
                    </View>
                  )}
                </View>
              ))}
              <Text style={s.timingNote}>* Zeiten sind Richtwerte</Text>
            </View>
          </View>

          {/* ── FOOTER ── */}
          <View style={s.footer}>
            <View>
              <Text style={s.footerLine}>Burgplatz 11 · 40213 Duesseldorf · Veranstaltet durch DYD – Decide Your Dream</Text>
              <Text style={s.footerWeb}>www.decide-your-dream.de</Text>
            </View>
            <View style={s.footerRight}>
              <Text style={s.footerHash}>#HARMONY2026 · © DYD 2026</Text>
              <Text style={s.footerSmall}>Nicht uebertragbar · Nur gueltig mit Lichtbildausweis</Text>
            </View>
          </View>
        </View>

        {/* ════ DIAGONALER SEPARATOR ════ */}
        <View style={s.separator}>
          <Svg viewBox="0 0 20 420" style={{ position:'absolute', top:0, left:0, width:20, height:420 }}>
            <Line x1="20" y1="0" x2="0" y2="420"
              stroke="rgba(212,168,67,0.45)" strokeWidth="1.5" strokeDasharray="5,4" />
          </Svg>
        </View>

        {/* ════ DYD PANEL ════ */}
        <View style={s.dydPanel}>
          <View style={s.dydLogoWrap}>
            <View style={s.dydBadge}><Text style={s.dydBadgeTxt}>DYD</Text></View>
            <Text style={s.dydSub}>Decide Your Dream</Text>
          </View>
          <View style={s.taglineBox}>
            <Text style={s.taglineTxt}>Einfach.</Text>
            <Text style={s.taglineTxt}>Fair.</Text>
            <Text style={s.taglineTxt}>Bewerben.</Text>
          </View>
          <View style={s.dydDivider} />
          <Text style={s.featLbl}>FEATURES</Text>
          {FEATURES.map((f) => (
            <View key={f} style={s.featChip}>
              <Text style={s.featCheck}>+</Text>
              <Text style={s.featText}>{f}</Text>
            </View>
          ))}
          <View style={s.ctaBtn}>
            <Text style={s.ctaLbl}>KOSTENLOS TESTEN</Text>
            <Text style={s.ctaUrl}>decide-your-dream.de</Text>
          </View>
          <View style={s.dydDivider} />
          <Text style={s.socialLbl}>SOCIAL MEDIA</Text>
          <View style={s.socialRow}>
            <View style={s.socialIG}><Text style={s.socialIcon}>IG</Text></View>
            <Text style={s.socialHdl}>@harmonyfestivaldus</Text>
          </View>
          <View style={s.socialRow}>
            <View style={s.socialTT}><Text style={s.socialIcon}>TT</Text></View>
            <Text style={s.socialHdl}>@harmonyfestival2026</Text>
          </View>
          <View style={[s.socialRow, { marginBottom:0 }]}>
            <View style={s.socialLI}><Text style={[s.socialIcon, { fontSize:7 }]}>in</Text></View>
            <Text style={s.socialHdl}>DYD – Decide Your Dream</Text>
          </View>
        </View>
      </View>
    </Page>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// RÜCKSEITE – SPONSOREN
// ════════════════════════════════════════════════════════════════════════════

function BackPage() {
  const s = StyleSheet.create({
    page:        { backgroundColor: C.bg, padding: 0, fontFamily: 'Helvetica' },
    topBar:      { flexDirection: 'row', height: 5 },
    inner:       { flex: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 18 },

    // Header
    tagLabel:    { fontSize: 6, color: 'rgba(212,168,67,0.55)', letterSpacing: 3, marginBottom: 5 },
    heading:     { fontSize: 26, fontFamily: 'Helvetica-Bold', color: C.cream, letterSpacing: 2, marginBottom: 3 },
    headingSub:  { fontSize: 8, color: 'rgba(255,255,255,0.30)', letterSpacing: 0.5, marginBottom: 18 },

    // Sponsoren-Grid: 3 Spalten x 2 Zeilen
    grid:        { flexDirection: 'row', flexWrap: 'wrap' },

    // Jede Karte: (595 - 56 Padding - 2*12 Gap) / 3 = 171pt
    card:        {
      width: 171,
      marginRight: 12,
      marginBottom: 12,
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderWidth: 1,
      borderColor: 'rgba(212,168,67,0.12)',
      borderRadius: 8,
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 10,
    },
    // Dritte Karte jeder Zeile: kein marginRight
    cardLast:    { marginRight: 0 },

    logoBox:     {
      width: 110,
      height: 55,
      backgroundColor: '#ffffff',
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
      overflow: 'hidden',
    },
    logoImg:     { width: 96, height: 44, objectFit: 'contain' },

    sponsorName: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: C.creamDim,
      textAlign: 'center',
      letterSpacing: 0.3,
    },

    // HARMONY Wasserzeichen
    watermark:   {
      position: 'absolute', bottom: 10, left: 0, right: 0,
      textAlign: 'center', fontSize: 112, fontFamily: 'Helvetica-Bold',
      color: 'rgba(212,168,67,0.04)', letterSpacing: 8,
    },

    // Footer
    footer:      {
      borderTopWidth: 1, borderTopColor: 'rgba(212,168,67,0.10)',
      paddingTop: 10, marginTop: 4,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    footerLeft:  { fontSize: 6, color: 'rgba(255,255,255,0.22)' },
    footerRight: { fontSize: 6, color: C.gold, fontFamily: 'Helvetica-Bold' },
  });

  return (
    <Page size="A5" orientation="landscape" style={s.page}>

      {/* Top-Balken */}
      <View style={s.topBar}>
        {['#c47a3c','#a8b84a',C.teal,C.gold].map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>

      <View style={s.inner}>

        {/* HARMONY Wasserzeichen */}
        <Text style={s.watermark}>HARMONY</Text>

        {/* Header */}
        <Text style={s.tagLabel}>PARTNER & SPONSOREN</Text>
        <Text style={s.heading}>Unsere Unterstuetzer</Text>
        <Text style={s.headingSub}>Diese lokalen Partner machen HARMONY 2026 moeglich. Danke!</Text>

        {/* 3×2 Sponsoren-Grid */}
        <View style={s.grid}>
          {SPONSORS.map((sponsor, i) => {
            const isLastInRow = (i + 1) % 3 === 0;
            return (
              <View key={sponsor.name} style={[s.card, isLastInRow && s.cardLast]}>
                <View style={s.logoBox}>
                  <Image src={sponsor.logo} style={s.logoImg} />
                </View>
                <Text style={s.sponsorName}>{sponsor.name}</Text>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerLeft}>Harmony 2026 · 22. August · Klub Kulb, Duesseldorf</Text>
          <Text style={s.footerRight}>decide-your-dream.de</Text>
        </View>
      </View>
    </Page>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DOKUMENT & DOWNLOAD
// ════════════════════════════════════════════════════════════════════════════

function TicketDocument({ ticket }: { ticket: FestivalTicketPDFProps }) {
  return (
    <Document>
      <FrontPage ticket={ticket} />
      <BackPage />
    </Document>
  );
}

export async function downloadFestivalTicketPDF(ticket: FestivalTicketPDFProps): Promise<void> {
  const blob = await pdf(<TicketDocument ticket={ticket} />).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `harmony-ticket${ticket.ticket_number ? `-${ticket.ticket_number}` : ''}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}