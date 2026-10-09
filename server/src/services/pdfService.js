import { dayName, formatInTz } from '../utils/time.js';

const INDIGO = '#4f46e5';
const NAVY = '#0b1220';
const SLATE = '#64748b';
const BORDER = '#cbd5e1';

/**
 * Streams a professional A4 date sheet PDF to the response.
 * pdfkit is imported lazily to keep cold starts fast.
 */
export async function streamDateSheetPdf(res, { student, branch, dateSheet }) {
  const { default: PDFDocument } = await import('pdfkit');
  const doc = new PDFDocument({ size: 'A4', margin: 46 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="ExamSlot-DateSheet-${student.registrationNumber}.pdf"`
  );
  doc.pipe(res);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Header band
  doc.rect(doc.page.margins.left, doc.page.margins.top - 10, pageWidth, 64).fill(NAVY);
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('ExamSlot', doc.page.margins.left + 14, doc.page.margins.top + 2);
  doc.fontSize(10).font('Helvetica').fillColor('#c7d2fe').text(
    'Virtual University — Examination Date Sheet',
    doc.page.margins.left + 14,
    doc.page.margins.top + 30
  );

  doc.moveDown(4);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(14).text('Examination Date Sheet', { align: 'left' });
  doc.moveDown(0.4);

  // Student details
  const details = [
    ['Student Name', student.fullName],
    ['Registration No.', student.registrationNumber],
    ['Program', student.program],
    ['Semester', String(student.semester)],
    ['Examination Branch', branch ? `${branch.name} (${branch.code}), ${branch.city}` : '—'],
    ['Saved On', formatInTz(dateSheet.savedAt, 'dd MMM yyyy, HH:mm')],
  ];

  doc.font('Helvetica').fontSize(10);
  const col1X = doc.page.margins.left;
  const col2X = doc.page.margins.left + pageWidth / 2 + 6;
  let y = doc.y;
  details.forEach((row, idx) => {
    const x = idx % 2 === 0 ? col1X : col2X;
    const currentY = y + Math.floor(idx / 2) * 18;
    doc.fillColor(SLATE).text(`${row[0]}:`, x, currentY, { width: 110, continued: false });
    doc.fillColor(NAVY).font('Helvetica-Bold').text(String(row[1]), x + 110, currentY, {
      width: pageWidth / 2 - 116,
    });
    doc.font('Helvetica');
  });
  doc.y = y + Math.ceil(details.length / 2) * 18 + 8;

  // Table
  const cols = [
    { key: 'idx', label: '#', width: 26 },
    { key: 'courseCode', label: 'Code', width: 62 },
    { key: 'courseTitle', label: 'Course Title', width: pageWidth - 26 - 62 - 78 - 78 - 78 },
    { key: 'examDate', label: 'Date', width: 78 },
    { key: 'day', label: 'Day', width: 78 },
    { key: 'time', label: 'Time', width: 78 },
  ];

  const startX = doc.page.margins.left;
  let rowY = doc.y;

  const drawHeaderRow = () => {
    doc.rect(startX, rowY, pageWidth, 22).fill(INDIGO);
    let x = startX;
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    cols.forEach((c) => {
      doc.text(c.label, x + 5, rowY + 6, { width: c.width - 8, lineBreak: false });
      x += c.width;
    });
    rowY += 22;
    doc.font('Helvetica');
  };

  drawHeaderRow();

  dateSheet.items.forEach((item, i) => {
    if (rowY > doc.page.height - doc.page.margins.bottom - 120) {
      doc.addPage();
      rowY = doc.page.margins.top;
      drawHeaderRow();
    }
    if (i % 2 === 0) doc.rect(startX, rowY, pageWidth, 20).fill('#f1f5f9');
    const time = item.endTime ? `${item.startTime}–${item.endTime}` : `${item.startTime} (default 3h)`;
    const row = {
      idx: String(i + 1),
      courseCode: item.courseCode,
      courseTitle: item.courseTitle,
      examDate: item.examDate,
      day: dayName(item.examDate),
      time,
    };
    let x = startX;
    doc.fillColor(NAVY).fontSize(9);
    cols.forEach((c) => {
      doc.text(String(row[c.key] ?? ''), x + 5, rowY + 6, { width: c.width - 8, lineBreak: false });
      x += c.width;
    });
    doc.moveTo(startX, rowY + 20).lineTo(startX + pageWidth, rowY + 20).strokeColor(BORDER).lineWidth(0.5).stroke();
    rowY += 20;
  });

  doc.y = rowY + 12;
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10).text(`Total Examinations: ${dateSheet.items.length}`, startX, doc.y);
  doc.moveDown(0.6);

  doc.font('Helvetica').fontSize(8.5).fillColor(SLATE);
  doc.text(
    'Instructions: Report to your examination branch at least 30 minutes before each paper. Bring your student card and this date sheet. ' +
      'Examinations follow the university timezone. This document is system-generated and authoritative.',
    { align: 'left' }
  );
  doc.moveDown(0.5);
  doc.text(`Verification ID: ${String(dateSheet._id).slice(-10).toUpperCase()}`, { align: 'left' });

  doc.end();
}

export default { streamDateSheetPdf };
