import { PrintProfileItem, ImpositionMode, PositionOrder } from '../types';

export interface SheetFit {
  requiredWidthMm: number;
  requiredHeightMm: number;
  availableWidthMm: number;
  availableHeightMm: number;
  overflowXMm: number;
  overflowYMm: number;
  fits: boolean;
  maxCols: number;
  maxRows: number;
}

export function computeSheetFit(pp: PrintProfileItem): SheetFit {
  const gridWidthMm = pp.cols * pp.cardTrimWidthMm + Math.max(0, pp.cols - 1) * pp.gutterXMm;
  const gridHeightMm = pp.rows * pp.cardTrimHeightMm + Math.max(0, pp.rows - 1) * pp.gutterYMm;

  const requiredWidthMm = pp.marginLeftMm + gridWidthMm + pp.marginRightMm;
  const requiredHeightMm = pp.marginTopMm + gridHeightMm + pp.marginBottomMm;
  const availableWidthMm = pp.sheetWidthMm - pp.marginLeftMm - pp.marginRightMm;
  const availableHeightMm = pp.sheetHeightMm - pp.marginTopMm - pp.marginBottomMm;

  const fitCount = (available: number, card: number, gutter: number) =>
    card <= 0 ? 0 : Math.max(0, Math.floor((available + gutter) / (card + gutter) + 1e-9));

  return {
    requiredWidthMm,
    requiredHeightMm,
    availableWidthMm,
    availableHeightMm,
    overflowXMm: Math.max(0, requiredWidthMm - pp.sheetWidthMm),
    overflowYMm: Math.max(0, requiredHeightMm - pp.sheetHeightMm),
    fits: requiredWidthMm <= pp.sheetWidthMm + 0.1 && requiredHeightMm <= pp.sheetHeightMm + 0.1,
    maxCols: fitCount(availableWidthMm, pp.cardTrimWidthMm, pp.gutterXMm),
    maxRows: fitCount(availableHeightMm, pp.cardTrimHeightMm, pp.gutterYMm),
  };
}

export function computeGridAssignment(opts: {
  recordCount: number;
  rows: number;
  cols: number;
  impositionMode: ImpositionMode;
}) {
  const positionsPerSheet = opts.rows * opts.cols;
  const sheetCount = Math.max(1, Math.ceil(opts.recordCount / positionsPerSheet));

  const sheets: (number | null)[][] = [];
  for (let p = 1; p <= sheetCount; p++) {
    const positions: (number | null)[] = [];
    for (let i = 1; i <= positionsPerSheet; i++) {
      const recordIndex1Based =
        opts.impositionMode === 'CUT_STACK_TRANSPOSE'
          ? (i - 1) * sheetCount + p
          : (p - 1) * positionsPerSheet + i;
      positions.push(recordIndex1Based <= opts.recordCount ? recordIndex1Based - 1 : null);
    }
    sheets.push(positions);
  }

  const blanksOnLastSheet = positionsPerSheet * sheetCount - opts.recordCount;

  return { sheetCount, positionsPerSheet, sheets, blanksOnLastSheet };
}

export function gridPositionToRowCol(
  i: number,
  rows: number,
  cols: number,
  positionOrder: PositionOrder
) {
  const idx = i - 1;
  if (positionOrder === 'COLUMN_MAJOR') {
    return { row: idx % rows, col: Math.floor(idx / rows) };
  }
  return { row: Math.floor(idx / cols), col: idx % cols };
}
