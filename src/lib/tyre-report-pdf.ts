import jsPDF from "jspdf";
import type { TyreAnalysis } from "./tyre-analyze.functions";

const BRAND = {
  name: "Manoj Wheels",
  tagline: "AI-Powered Tyre Diagnostics",
  phone: "+91 8897230858",
  whatsapp: "+91 8897230858",
  email: "manojwheels.official@gmail.com",
  address: "Manoj Puncture Shop, Pulivendula, Andhra Pradesh",
};

export function generateTyreReportPDF(
  result: TyreAnalysis,
  imageDataUrl?: string | null,
  options?: { save?: boolean }
): { blob: Blob; filename: string; dataUrl: string } {
  const save = options?.save !== false;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;

  // Header bar
  doc.setFillColor(220, 38, 38); // primary red
  doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(BRAND.name, M, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(BRAND.tagline, M, 60);
  doc.setFontSize(9);
  doc.text(`${BRAND.phone}  |  ${BRAND.email}`, M, 76);

  // Report title
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("AI Tyre Diagnostic Report", M, 130);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  const now = new Date();
  doc.text(`Generated: ${now.toLocaleString()}`, M, 148);
  doc.text(`Report ID: MW-${now.getTime().toString(36).toUpperCase()}`, M, 162);

  let y = 190;

  // Tyre image
  if (imageDataUrl) {
    try {
      const fmt = imageDataUrl.includes("image/png") ? "PNG" : "JPEG";
      doc.addImage(imageDataUrl, fmt, M, y, 180, 180, undefined, "FAST");
    } catch {
      // ignore
    }
  }

  // Right side: validity panel
  const px = M + 200;
  const pw = W - px - M;
  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(px, y, pw, 180, 8, 8, "FD");

  if (!result.isTyre) {
    doc.setTextColor(220, 38, 38);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Invalid Image", px + 16, y + 30);
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(result.notes || "The image is not a clear tyre photo.", pw - 32), px + 16, y + 52);
  } else {
    // Health Score big
    doc.setTextColor(220, 38, 38);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(46);
    doc.text(String(result.score), px + 16, y + 60);
    doc.setTextColor(110, 110, 110);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("/ 100  Overall Health Score", px + 16 + doc.getTextWidth(String(result.score)) + 8, y + 60);

    // Recommendation badge
    const recColor: [number, number, number] =
      result.recommendation === "Safe to Use"
        ? [22, 163, 74]
        : result.recommendation === "Monitor Soon"
        ? [202, 138, 4]
        : [220, 38, 38];
    doc.setFillColor(...recColor);
    doc.roundedRect(px + 16, y + 80, pw - 32, 28, 6, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(result.recommendation, px + 28, y + 99);

    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(result.notes || "", pw - 32), px + 16, y + 128);
  }

  y += 200;

  // Metrics grid (only if tyre)
  if (result.isTyre) {
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Diagnostic Metrics", M, y);
    y += 14;

    const metrics: Array<[string, string]> = [
      ["Tread Wear", `${result.tread}%`],
      ["Crack Detection", result.cracks],
      ["Estimated Life Left", `${result.remainingKm.toLocaleString()} km`],
      ["AI Confidence", `${result.confidence}%`],
    ];

    const cellW = (W - M * 2) / 2;
    const cellH = 56;
    metrics.forEach((m, i) => {
      const cx = M + (i % 2) * cellW;
      const cy = y + Math.floor(i / 2) * (cellH + 8);
      doc.setDrawColor(230, 230, 230);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(cx, cy, cellW - 8, cellH, 6, 6, "FD");
      doc.setTextColor(120, 120, 120);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(m[0].toUpperCase(), cx + 12, cy + 20);
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(m[1], cx + 12, cy + 42);
    });
    y += Math.ceil(metrics.length / 2) * (cellH + 8) + 12;

    // Observations
    if (result.observations.length) {
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("AI Observations", M, y);
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      result.observations.forEach((o) => {
        const lines = doc.splitTextToSize(`• ${o}`, W - M * 2);
        if (y + lines.length * 14 > H - 80) {
          doc.addPage();
          y = M;
        }
        doc.text(lines, M, y);
        y += lines.length * 14 + 4;
      });
    }
  }

  // Footer
  const fy = H - 60;
  doc.setDrawColor(230, 230, 230);
  doc.line(M, fy, W - M, fy);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text(
    "This AI report is advisory. For final certification, visit Manoj Wheels workshop.",
    M,
    fy + 16,
  );
  doc.text(BRAND.address, M, fy + 30);
  doc.text(`WhatsApp: ${BRAND.whatsapp}`, M, fy + 44);

  const filename = `Manoj-Wheels-Tyre-Report-${now.getTime()}.pdf`;
  if (save) doc.save(filename);
  const blob = doc.output("blob") as Blob;
  const dataUrl = doc.output("datauristring") as string;
  return { blob, filename, dataUrl };
}
