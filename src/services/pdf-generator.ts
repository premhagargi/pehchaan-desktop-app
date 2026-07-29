import { PDFDocument, StandardFonts, rgb, degrees, PDFPage } from 'pdf-lib';
import { RenderElement, RecordItem, PhotoItem, PrintProfileItem, TemplateItem } from '../types';
import { generateBarcodeDataUrl } from './barcode-generator';
import { computeGridAssignment, gridPositionToRowCol } from './imposition-engine';

const MM_TO_PT = 2.8346456693;
const mmToPt = (mm: number) => mm * MM_TO_PT;

function hexToRgb(hex?: string) {
  if (!hex || hex === 'transparent') return rgb(0, 0, 0);
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return rgb(r || 0, g || 0, b || 0);
}

function interpolateText(textTemplate: string, recordData: Record<string, any>): string {
  if (!textTemplate) return '';
  return textTemplate.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const cleanKey = key.trim();
    const val = recordData[cleanKey];
    return val !== undefined && val !== null ? String(val) : '';
  });
}

export async function renderSingleCardPdf(opts: {
  elements: RenderElement[];
  cardWidthMm: number;
  cardHeightMm: number;
  recordData: Record<string, any>;
  photoDataUrl?: string | null;
  backgroundColor?: string;
}): Promise<Uint8Array> {
  const { elements, cardWidthMm, cardHeightMm, recordData, photoDataUrl, backgroundColor } = opts;

  const pdfDoc = await PDFDocument.create();
  const pageWidthPt = mmToPt(cardWidthMm);
  const pageHeightPt = mmToPt(cardHeightMm);
  const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

  if (backgroundColor && backgroundColor !== 'transparent') {
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidthPt,
      height: pageHeightPt,
      color: hexToRgb(backgroundColor),
    });
  }

  const helveticaRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const timesRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const courierRegular = await pdfDoc.embedFont(StandardFonts.Courier);
  const courierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

  const getFont = (family?: string, isBold?: boolean) => {
    const f = (family ?? 'Helvetica').toLowerCase();
    if (f.includes('times') || f.includes('serif')) {
      return isBold ? timesBold : timesRegular;
    }
    if (f.includes('courier') || f.includes('mono') || f.includes('jetbrains')) {
      return isBold ? courierBold : courierRegular;
    }
    return isBold ? helveticaBold : helveticaRegular;
  };

  for (const el of elements) {
    if (el.visible === false) continue;

    const xPt = mmToPt(el.x);
    const wPt = mmToPt(el.width);
    const hPt = mmToPt(el.height);
    const topYPt = pageHeightPt - mmToPt(el.y);

    if (el.type === 'shape') {
      const shapeOpts = {
        color: el.fill ? hexToRgb(el.fill) : undefined,
        borderColor: el.stroke ? hexToRgb(el.stroke) : undefined,
        borderWidth: el.stroke ? mmToPt(el.strokeWidth ?? 0.25) : undefined,
        opacity: el.opacity ?? 1,
        rotate: el.rotation ? degrees(-el.rotation) : undefined,
      };
      if (el.shapeType === 'circle') {
        page.drawEllipse({
          x: xPt + wPt / 2,
          y: topYPt - hPt / 2,
          xScale: wPt / 2,
          yScale: hPt / 2,
          ...shapeOpts,
        });
      } else {
        page.drawRectangle({
          x: xPt,
          y: topYPt - hPt,
          width: wPt,
          height: hPt,
          ...shapeOpts,
        });
      }
      continue;
    }

    if (el.type === 'photo_placeholder') {
      if (photoDataUrl && photoDataUrl.startsWith('data:image/')) {
        try {
          const base64Data = photoDataUrl.split(',')[1];
          const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const isPng = photoDataUrl.includes('image/png') || photoDataUrl.includes('image/svg');
          const img = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
          page.drawImage(img, {
            x: xPt,
            y: topYPt - hPt,
            width: wPt,
            height: hPt,
          });
        } catch (e) {
          // Draw placeholder fallback
          page.drawRectangle({
            x: xPt,
            y: topYPt - hPt,
            width: wPt,
            height: hPt,
            color: hexToRgb(el.fill || '#1e293b'),
            borderColor: hexToRgb(el.stroke || '#38bdf8'),
            borderWidth: 1,
          });
        }
      } else {
        page.drawRectangle({
          x: xPt,
          y: topYPt - hPt,
          width: wPt,
          height: hPt,
          color: hexToRgb(el.fill || '#1e293b'),
          borderColor: hexToRgb(el.stroke || '#38bdf8'),
          borderWidth: 1,
        });
      }
      continue;
    }

    if (el.type === 'barcode' && el.barcode) {
      const bindingKey = el.binding;
      const textToEncode = bindingKey ? String(recordData[bindingKey] || '12345678') : '12345678';
      try {
        const barcodeDataUrl = await generateBarcodeDataUrl(textToEncode, el.barcode);
        const base64Data = barcodeDataUrl.split(',')[1];
        const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const img = await pdfDoc.embedPng(bytes);
        page.drawImage(img, {
          x: xPt,
          y: topYPt - hPt,
          width: wPt,
          height: hPt,
        });
      } catch (e) {
        console.warn('Failed barcode PDF render:', e);
      }
      continue;
    }

    if (el.type === 'text') {
      let text = el.binding ? String(recordData[el.binding] ?? '') : (el.text || '');
      text = interpolateText(text, recordData);
      if (!text) continue;

      const isBold = el.style?.fontWeight === 'bold';
      const font = getFont(el.style?.fontFamily, isBold);
      const fontSizePt = el.style?.fontSize ?? 8;
      const color = hexToRgb(el.style?.color ?? '#ffffff');

      const textWidth = font.widthOfTextAtSize(text, fontSizePt);
      let drawX = xPt;
      if (el.style?.align === 'center') {
        drawX = xPt + (wPt - textWidth) / 2;
      } else if (el.style?.align === 'right') {
        drawX = xPt + wPt - textWidth;
      }

      page.drawText(text, {
        x: drawX,
        y: topYPt - hPt + (hPt - fontSizePt) / 2, // middle baseline align
        size: fontSizePt,
        font,
        color,
      });
    }
  }

  return await pdfDoc.save();
}

export async function composeImpositionSheetPdf(opts: {
  template: TemplateItem;
  records: RecordItem[];
  photos: PhotoItem[];
  printProfile: PrintProfileItem;
  onProgress?: (current: number, total: number) => void;
}): Promise<Uint8Array> {
  const { template, records, photos, printProfile, onProgress } = opts;

  const pdfDoc = await PDFDocument.create();
  const sheetWidthPt = mmToPt(printProfile.sheetWidthMm);
  const sheetHeightPt = mmToPt(printProfile.sheetHeightMm);

  const photoMap = new Map<string, string>();
  photos.forEach(p => {
    if (p.recordId && p.dataUrl) {
      photoMap.set(p.recordId, p.dataUrl);
    }
  });

  // Calculate copies according to record.quantity
  const expandedRecords: RecordItem[] = [];
  records.forEach(r => {
    const qty = Math.max(1, r.quantity || 1);
    for (let q = 0; q < qty; q++) {
      expandedRecords.push(r);
    }
  });

  const assignment = computeGridAssignment({
    recordCount: expandedRecords.length,
    rows: printProfile.rows,
    cols: printProfile.cols,
    impositionMode: printProfile.impositionMode,
  });

  // Cache rendered single card PDFs to avoid re-rendering duplicate records
  const renderedCardMap = new Map<string, PDFDocument>();
  const renderedBackCardMap = new Map<string, PDFDocument>();
  const hasBack = template.sceneGraphBack && template.sceneGraphBack.length > 0;

  for (let sheetIdx = 0; sheetIdx < assignment.sheetCount; sheetIdx++) {
    onProgress?.(sheetIdx + 1, assignment.sheetCount);

    const sheetPage = pdfDoc.addPage([sheetWidthPt, sheetHeightPt]);
    const backSheetPage = hasBack ? pdfDoc.addPage([sheetWidthPt, sheetHeightPt]) : null;
    const positions = assignment.sheets[sheetIdx];

    for (let posIdx = 0; posIdx < positions.length; posIdx++) {
      const recIdx = positions[posIdx];
      if (recIdx === null || recIdx >= expandedRecords.length) continue;

      const record = expandedRecords[recIdx];
      const photoUrl = photoMap.get(record.id);

      // Render front single card
      let singleCardDoc = renderedCardMap.get(record.id);
      if (!singleCardDoc) {
        const cardBytes = await renderSingleCardPdf({
          elements: template.sceneGraph,
          cardWidthMm: template.cardWidthMm,
          cardHeightMm: template.cardHeightMm,
          recordData: record.recordData,
          photoDataUrl: photoUrl,
          backgroundColor: template.backgroundColor,
        });
        singleCardDoc = await PDFDocument.load(cardBytes);
        renderedCardMap.set(record.id, singleCardDoc);
      }

      const [embeddedCardPage] = await pdfDoc.embedPages(singleCardDoc.getPages());

      // Render back single card if needed
      let singleBackCardDoc = null;
      let embeddedBackCardPage = null;
      if (hasBack) {
        singleBackCardDoc = renderedBackCardMap.get(record.id);
        if (!singleBackCardDoc) {
          const backCardBytes = await renderSingleCardPdf({
            elements: template.sceneGraphBack!,
            cardWidthMm: template.cardWidthMm,
            cardHeightMm: template.cardHeightMm,
            recordData: record.recordData,
            photoDataUrl: photoUrl,
            backgroundColor: template.backgroundColor,
          });
          singleBackCardDoc = await PDFDocument.load(backCardBytes);
          renderedBackCardMap.set(record.id, singleBackCardDoc);
        }
        [embeddedBackCardPage] = await pdfDoc.embedPages(singleBackCardDoc.getPages());
      }

      // Position math
      const { row, col } = gridPositionToRowCol(
        posIdx + 1,
        printProfile.rows,
        printProfile.cols,
        printProfile.positionOrder
      );

      // Front Position
      const posXMm =
        printProfile.marginLeftMm + col * (printProfile.cardTrimWidthMm + printProfile.gutterXMm);
      const posYMm =
        printProfile.marginTopMm + row * (printProfile.cardTrimHeightMm + printProfile.gutterYMm);

      const xPt = mmToPt(posXMm);
      const yPt = sheetHeightPt - mmToPt(posYMm) - mmToPt(printProfile.cardTrimHeightMm);
      const wPt = mmToPt(printProfile.cardTrimWidthMm);
      const hPt = mmToPt(printProfile.cardTrimHeightMm);

      sheetPage.drawPage(embeddedCardPage, {
        x: xPt,
        y: yPt,
        width: wPt,
        height: hPt,
      });

      // Back Position (Mirrored column)
      if (backSheetPage && embeddedBackCardPage) {
        const mirroredCol = (printProfile.cols - 1) - col;
        const backPosXMm =
          printProfile.marginLeftMm + mirroredCol * (printProfile.cardTrimWidthMm + printProfile.gutterXMm);
        const backXPt = mmToPt(backPosXMm);

        backSheetPage.drawPage(embeddedBackCardPage, {
          x: backXPt,
          y: yPt, // Y is same
          width: wPt,
          height: hPt,
        });
      }

      // Draw Crop Marks if enabled
      if (printProfile.cropMarkStyle !== 'NONE') {
        const cropLen = mmToPt(4);
        const cropColor = rgb(0.3, 0.3, 0.3);
        const strokeWidth = 0.5;

        const drawMarks = (page: PDFPage, cx: number, cy: number) => {
          // Top-Left corner
          page.drawLine({ start: { x: cx - cropLen, y: cy + hPt }, end: { x: cx, y: cy + hPt }, color: cropColor, thickness: strokeWidth });
          page.drawLine({ start: { x: cx, y: cy + hPt + cropLen }, end: { x: cx, y: cy + hPt }, color: cropColor, thickness: strokeWidth });

          // Top-Right corner
          page.drawLine({ start: { x: cx + wPt + cropLen, y: cy + hPt }, end: { x: cx + wPt, y: cy + hPt }, color: cropColor, thickness: strokeWidth });
          page.drawLine({ start: { x: cx + wPt, y: cy + hPt + cropLen }, end: { x: cx + wPt, y: cy + hPt }, color: cropColor, thickness: strokeWidth });

          // Bottom-Left corner
          page.drawLine({ start: { x: cx - cropLen, y: cy }, end: { x: cx, y: cy }, color: cropColor, thickness: strokeWidth });
          page.drawLine({ start: { x: cx, y: cy - cropLen }, end: { x: cx, y: cy }, color: cropColor, thickness: strokeWidth });

          // Bottom-Right corner
          page.drawLine({ start: { x: cx + wPt + cropLen, y: cy }, end: { x: cx + wPt, y: cy }, color: cropColor, thickness: strokeWidth });
          page.drawLine({ start: { x: cx + wPt, y: cy - cropLen }, end: { x: cx + wPt, y: cy }, color: cropColor, thickness: strokeWidth });
        };

        drawMarks(sheetPage, xPt, yPt);
        if (backSheetPage) {
          const backXPt = mmToPt(printProfile.marginLeftMm + ((printProfile.cols - 1) - col) * (printProfile.cardTrimWidthMm + printProfile.gutterXMm));
          drawMarks(backSheetPage, backXPt, yPt);
        }
      }
    }
  }

  return await pdfDoc.save();
}
