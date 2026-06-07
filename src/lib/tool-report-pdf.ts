import jsPDF from "jspdf";
import { NOTO_SANS_REGULAR_BASE64, NOTO_SANS_BOLD_BASE64 } from "./pdf-fonts";

const BRAND = {
  name: "Manoj Wheels",
  tagline: "Smart Tools for Smarter Driving",
  phone: "+91 8897230858",
  email: "manojwheels.official@gmail.com",
  address: "Manoj Puncture Shop, Pulivendula, Andhra Pradesh",
};

const FONT = "NotoSans";

export interface ToolReportInput {
  toolName: string;
  summary?: string;
  headline?: string;
  headlineLabel?: string;
  recommendation?: string;
  inputs?: Array<{ label: string; value: string }>;
  results?: Array<{ label: string; value: string }>;
  notes?: string[];
  fileSlug?: string;
}

let fontsRegistered: WeakSet<jsPDF> | null = null;
function ensureFonts(doc: jsPDF) {
  if (!fontsRegistered) fontsRegistered = new WeakSet();
  if (fontsRegistered.has(doc)) return;
  doc.addFileToVFS("NotoSans-Regular.ttf", NOTO_SANS_REGULAR_BASE64);
  doc.addFont("NotoSans-Regular.ttf", FONT, "normal");
  doc.addFileToVFS("NotoSans-Bold.ttf", NOTO_SANS_BOLD_BASE64);
  doc.addFont("NotoSans-Bold.ttf", FONT, "bold");
  fontsRegistered.add(doc);
}

/** Normalise stray characters that the embedded subset doesn't cover. */
function s(text: string | undefined | null): string {
  if (text == null) return "";
  return String(text).replace(/\u00A0/g, " ");
}

export function generateToolReportPDF(
  input: ToolReportInput,
  options?: { save?: boolean }
): { blob: Blob; filename: string; dataUrl: string } {
  const save = options?.save !== false;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  ensureFonts(doc);

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const FOOTER_RESERVE = 80; // keep clear for footer band
  const CONTENT_TOP = 60;    // top margin on continuation pages

  const now = new Date();
  let pageNo = 1;

  function drawHeaderBand() {
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, W, 90, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont(FONT, "bold");
    doc.setFontSize(22);
    doc.text(s(BRAND.name), M, 40);
    doc.setFont(FONT, "normal");
    doc.setFontSize(11);
    doc.text(s(BRAND.tagline), M, 60);
    doc.setFontSize(9);
    doc.text(s(`${BRAND.phone}  |  ${BRAND.email}`), M, 76);
  }

  function drawFooter() {
    const footerY = H - 50;
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(1);
    doc.line(M, footerY, W - M, footerY);
    doc.setFont(FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(s(BRAND.address), M, footerY + 14);
    doc.text(`Page ${pageNo}`, W / 2, footerY + 14, { align: "center" });
    doc.text("manojwheels.com", W - M, footerY + 14, { align: "right" });
  }

  function newPage() {
    drawFooter();
    doc.addPage();
    pageNo += 1;
    y = CONTENT_TOP;
  }

  /** Ensure `needed` vertical space is available before next draw, else paginate. */
  function ensureSpace(needed: number) {
    if (y + needed > H - FOOTER_RESERVE) newPage();
  }

  // === PAGE 1 HEADER + TITLE ===
  drawHeaderBand();

  doc.setTextColor(20, 20, 20);
  doc.setFont(FONT, "bold");
  doc.setFontSize(18);
  doc.text(s(input.toolName), M, 128);

  doc.setFont(FONT, "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text(s(`Generated: ${now.toLocaleString()}`), M, 146);
  doc.text(s(`Report ID: MW-${now.getTime().toString(36).toUpperCase()}`), M, 160);

  let y = 184;
  if (input.summary) {
    doc.setTextColor(60, 60, 60);
    doc.setFont(FONT, "normal");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(s(input.summary), W - M * 2);
    doc.text(lines, M, y);
    y += lines.length * 14 + 12;
  } else {
    y += 8;
  }

  // === HEADLINE METRIC CARD ===
  if (input.headline) {
    const boxH = 100;
    ensureSpace(boxH + 16);
    doc.setDrawColor(220, 38, 38);
    doc.setFillColor(252, 232, 232);
    doc.roundedRect(M, y, W - M * 2, boxH, 10, 10, "FD");

    const headline = s(input.headline);
    const leftColW = (W - M * 2) * 0.5 - 22;
    let hSize = 34;
    doc.setFont(FONT, "bold");
    doc.setFontSize(hSize);
    while (doc.getTextWidth(headline) > leftColW && hSize > 14) {
      hSize -= 2;
      doc.setFontSize(hSize);
    }
    doc.setTextColor(220, 38, 38);
    doc.text(headline, M + 22, y + 52);

    if (input.headlineLabel) {
      doc.setTextColor(80, 80, 80);
      doc.setFont(FONT, "normal");
      doc.setFontSize(11);
      const labelLines = doc.splitTextToSize(s(input.headlineLabel), leftColW + 22);
      doc.text(labelLines, M + 22, y + 78);
    }
    if (input.recommendation) {
      doc.setTextColor(20, 20, 20);
      doc.setFont(FONT, "bold");
      doc.setFontSize(12);
      const recX = M + (W - M * 2) * 0.55;
      const recW = W - M - recX - 14;
      const recLines = doc.splitTextToSize(s(input.recommendation), recW);
      doc.text(recLines, recX, y + 44);
    }
    y += boxH + 22;
  }

  // === KEY/VALUE TABLES ===
  function table(title: string, rows: Array<{ label: string; value: string }>) {
    if (!rows.length) return;
    ensureSpace(46);
    doc.setTextColor(20, 20, 20);
    doc.setFont(FONT, "bold");
    doc.setFontSize(13);
    doc.text(s(title), M, y);
    y += 12;
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.line(M, y, W - M, y);
    y += 14;

    doc.setFont(FONT, "normal");
    doc.setFontSize(11);
    rows.forEach((r) => {
      const valueLines = doc.splitTextToSize(s(r.value), (W - M * 2) * 0.55);
      const labelLines = doc.splitTextToSize(s(r.label), (W - M * 2) * 0.4);
      const rowH = Math.max(valueLines.length, labelLines.length) * 14 + 6;
      ensureSpace(rowH);
      doc.setTextColor(110, 110, 110);
      doc.setFont(FONT, "normal");
      doc.text(labelLines, M, y);
      doc.setTextColor(20, 20, 20);
      doc.setFont(FONT, "bold");
      doc.text(valueLines, W - M, y, { align: "right" });
      y += rowH;
    });
    y += 10;
  }

  table("Inputs", input.inputs ?? []);
  table("Results", input.results ?? []);

  // === NOTES ===
  if (input.notes && input.notes.length) {
    ensureSpace(40);
    doc.setFont(FONT, "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text("Notes & recommendations", M, y);
    y += 16;
    doc.setFont(FONT, "normal");
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    input.notes.forEach((n) => {
      const lines = doc.splitTextToSize(s(`• ${n}`), W - M * 2);
      const blockH = lines.length * 14 + 6;
      ensureSpace(blockH);
      doc.text(lines, M, y);
      y += blockH;
    });
  }

  drawFooter();

  const slug =
    input.fileSlug ??
    input.toolName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const filename = `manoj-wheels-${slug}-${now.getTime()}.pdf`;
  const blob = doc.output("blob");
  const dataUrl = doc.output("dataurlstring");
  if (save) doc.save(filename);
  return { blob, filename, dataUrl };
}
