import ExcelJS from 'exceljs';
import Papa from 'papaparse';

export interface ParsedSheet {
  filename: string;
  columns: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

export async function parseExcelOrCsv(file: File): Promise<ParsedSheet> {
  const filename = file.name;
  const lowerName = filename.toLowerCase();

  if (lowerName.endsWith('.csv')) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: 'greedy',
        complete: (results) => {
          const columns = (results.meta.fields || []).map((f) => f.trim()).filter(Boolean);
          const rows = results.data as Record<string, any>[];
          resolve({
            filename,
            columns,
            rows,
            totalRows: rows.length,
          });
        },
        error: (err) => reject(new Error(`CSV Parsing Error: ${err.message}`)),
      });
    });
  }

  if (lowerName.endsWith('.xls') && !lowerName.endsWith('.xlsx')) {
    throw new Error(
      'Legacy binary .xls files are not supported directly. Please resave your spreadsheet as .xlsx or .csv.'
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('No worksheet found in Excel file');
    }

    const columns: string[] = [];
    const rows: Record<string, any>[] = [];

    // Parse Header Row (Row 1) including empty cells
    const headerRow = worksheet.getRow(1);
    const maxCols = worksheet.columnCount || headerRow.cellCount || 100;

    for (let c = 1; c <= maxCols; c++) {
      const cell = headerRow.getCell(c);
      let colName = getCellValueAsString(cell.value).trim();
      if (!colName) {
        // If header is empty but column has data, generate default column label
        colName = `Column_${c}`;
      }
      columns[c - 1] = colName;
    }

    // Parse Data Rows
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const rowData: Record<string, any> = {};
      let hasValue = false;

      for (let c = 1; c <= columns.length; c++) {
        const colName = columns[c - 1];
        if (!colName) continue;

        const cell = row.getCell(c);
        const valStr = getCellValueAsString(cell.value).trim();
        rowData[colName] = valStr;
        if (valStr !== '') hasValue = true;
      }

      if (hasValue) {
        rows.push(rowData);
      }
    });

    // Remove unused default trailing columns
    const activeColumns = columns.filter((col) =>
      rows.some((r) => r[col] !== undefined && r[col] !== '')
    );

    return {
      filename,
      columns: activeColumns.length > 0 ? activeColumns : columns.filter(Boolean),
      rows,
      totalRows: rows.length,
    };
  } catch (err: any) {
    console.error('Excel Parsing Failure:', err);
    throw new Error(err.message || 'Failed to read Excel file. Please ensure it is a valid .xlsx document.');
  }
}

function getCellValueAsString(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (val instanceof Date) return val.toISOString().split('T')[0];

  // Complex ExcelJS Cell Values (RichText, Hyperlinks, Formulas, Objects)
  if (typeof val === 'object') {
    if ('result' in val && val.result !== undefined && val.result !== null) {
      return String(val.result);
    }
    if ('text' in val && val.text !== undefined && val.text !== null) {
      return String(val.text);
    }
    if ('hyperlink' in val) {
      return String(val.text || val.hyperlink || '');
    }
    if (Array.isArray(val.richText)) {
      return val.richText.map((rt: any) => rt.text || '').join('');
    }
  }

  return String(val);
}

export async function exportRecordsToExcel(
  filename: string,
  columns: { key: string; label: string }[],
  rows: Record<string, any>[]
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Records');

  worksheet.columns = columns.map((c) => ({ header: c.label, key: c.key, width: 20 }));

  rows.forEach((r) => {
    worksheet.addRow(r);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
