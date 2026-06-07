import jsPDF from "jspdf";

const BRAND = {
  name: "Manoj Wheels",
  tagline: "Smart Tools for Smarter Driving",
  phone: "+91 8897230858",
  email: "manojwheels.official@gmail.com",
  address: "Manoj Puncture Shop, Pulivendula, Andhra Pradesh",
};

export interface ToolReportInput {
  /** Human title shown at the top of the PDF, e.g. "Tyre Mileage Calculator". */
  toolName: string;
  /** A short subtitle/summary line shown under the title. */
  summary?: string;
  /** Optional headline metric (e.g. "82/100", "32 PSI"). Rendered big. */
  headline?: string;
  headlineLabel?: string;
  /** Recommendation / verdict line under the headline. */
  recommendation?: string;
  /** Key/value rows in the "Inputs" table. */
  inputs?: Array<{ label: string; value: string }>;
  /** Key/value rows in the "Results" table. */
  results?: Array<{ label: string; value: string }>;
  /** Bullet observations / tips. */
  notes?: string[];
  /** File name slug, e.g. "tyre-mileage". Defaults to a sanitised toolName. */
  fileSlug?: string;
}

export function generateToolReportPDF(
  input: ToolReportInput,
  options?: { save?: boolean }
): { blob: Blob; filename: string; dataUrl: string } {
  const save = options?.save !== false;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;

  // Header band
  doc.setFillColor(220, 38, 38);
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

  // Title
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(input.toolName, M, 130);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  const now = new Date();
  doc.text(`Generated: ${now.toLocaleString()}`, M, 148);
  doc.text(`Report ID: MW-${now.getTime().toString(36).toUpperCase()}`, M, 162);
  if (input.summary) {
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    doc.text(doc.splitTextToSize(input.summary, W - M * 2), M, 184);
  }

  let y = 220;

  // Headline metric
  if (input.headline) {
    doc.setDrawColor(220, 38, 38);
    doc.setFillColor(252, 232, 232);
    doc.roundedRect(M, y, W - M * 2, 90, 10, 10, "FD");
    doc.setTextColor(220, 38, 38);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.text(input.headline, M + 22, y + 56);
    if (input.headlineLabel) {
      doc.setTextColor(80, 80, 80);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(input.headlineLabel, M + 22, y + 76);
    }
    if (input.recommendation) {
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      const lines = doc.splitTextToSize(input.recommendation, W - M * 2 - 220);
      doc.text(lines, M + 220, y + 48);
    }
    y += 110;
  }

  function table(title: string, rows: Array<{ label: string; value: string }>) {
    if (!rows.length) return;
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(title, M, y);
    y += 14;
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.line(M, y, W - M, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    rows.forEach((r) => {
      if (y > 760) {
        doc.addPage();
        y = 60;
      }
      doc.setTextColor(110, 110, 110);
      doc.text(r.label, M, y);
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.text(r.value, W - M, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      y += 18;
    });
    y += 10;
  }

  table("Inputs", input.inputs ?? []);
  table("Results", input.results ?? []);

  if (input.notes && input.notes.length) {
    if (y > 720) {
      doc.addPage();
      y = 60;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text("Notes & recommendations", M, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    input.notes.forEach((n) => {
      const lines = doc.splitTextToSize(`• ${n}`, W - M * 2);
      if (y + lines.length * 14 > 780) {
        doc.addPage();
        y = 60;
      }
      doc.text(lines, M, y);
      y += lines.length * 14 + 4;
    });
  }

  // Footer
  const footerY = 820;
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(1);
  doc.line(M, footerY, W - M, footerY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text(BRAND.address, M, footerY + 14);
  doc.text("manojwheels.com", W - M, footerY + 14, { align: "right" });

  const slug =
    input.fileSlug ??
    input.toolName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const filename = `manoj-wheels-${slug}-${now.getTime()}.pdf`;
  const blob = doc.output("blob");
  const dataUrl = doc.output("dataurlstring");
  if (save) doc.save(filename);
  return { blob, filename, dataUrl };
}
