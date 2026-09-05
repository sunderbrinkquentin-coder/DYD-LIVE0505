import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Minimaler Ersatz für die gelöschte utils/pdfExport.tsx — wird nur noch von
 * der Legacy-Vorschauseite (CVPreview.tsx, Route /result) gebraucht, die
 * noch die alten Templates aus components/CVTemplates rendert (nicht das
 * neue breakEngine-System aus components/cv-templates, siehe pdfExportClient.ts
 * und pdfExportServer.ts für den aktuellen Export-Pfad im CV-Editor).
 *
 * Rastert das übergebene, bereits gerenderte Element als Bild und schneidet
 * es in A4-Seiten — der klassische html2canvas+jsPDF-Ansatz, den auch die
 * ursprüngliche pdfExport.tsx vermutlich benutzt hat. Kein Anspruch auf
 * ATS-lesbaren Text; für den echten CV-Editor gilt der neue Server-Export.
 */
export async function downloadAsPDF(
  element: HTMLElement,
  filename = `Lebenslauf_${new Date().toISOString().split('T')[0]}.pdf`
): Promise<void> {
  // Aktuellen Zoom-Level (CSS transform: scale(...) in CVPreview.tsx) für die
  // Aufnahme ignorieren, damit die PDF-Auflösung nicht vom UI-Zoom abhängt.
  const prevTransform = element.style.transform;
  element.style.transform = 'none';

  try {
    // `as any`: die im Projekt installierten @types/html2canvas (0.5) kennen
    // `scale`/`backgroundColor` nicht — html2canvas selbst (v1.4.1, siehe
    // package.json) unterstützt beide zur Laufzeit. Gleicher Workaround wie
    // in pdfExportClient.ts (dort ebenfalls `(html2canvas as any)(...)`).
    const canvas = await (html2canvas as any)(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidthMm = 210;
    const pageHeightMm = 297;
    const imgWidthMm = pageWidthMm;
    const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;
    const imgData = canvas.toDataURL('image/png');

    let heightLeftMm = imgHeightMm;
    let positionMm = 0;

    pdf.addImage(imgData, 'PNG', 0, positionMm, imgWidthMm, imgHeightMm);
    heightLeftMm -= pageHeightMm;

    while (heightLeftMm > 0) {
      positionMm = heightLeftMm - imgHeightMm;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, positionMm, imgWidthMm, imgHeightMm);
      heightLeftMm -= pageHeightMm;
    }

    pdf.save(filename);
  } finally {
    element.style.transform = prevTransform;
  }
}
