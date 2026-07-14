ner_name}</Text>
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
      color: 'rgba(212,168,67,0.018)', letterSpacing: 8,
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
}// Erzeugt den reinen Datei-Blob für den automatischen Hintergrund-Upload
export async function generateFestivalTicketBlob(ticket: FestivalTicketPDFProps): Promise<Blob> {
  return await pdf(<TicketDocument ticket={ticket} />).toBlob();
}