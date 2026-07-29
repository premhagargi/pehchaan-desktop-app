import React, { useState } from 'react';
import { ProjectItem, FieldDefinition } from '../../types';
import { db } from '../../services/db';
import { parseExcelOrCsv, ParsedSheet } from '../../services/excel-parser';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle,
  ArrowRight,
  Plus,
  Trash2,
  Table,
  Sparkles,
  FolderOpen
} from 'lucide-react';

interface ImportPanelProps {
  project: ProjectItem;
  onImportComplete: () => void;
}

export const ImportPanel: React.FC<ImportPanelProps> = ({ project, onImportComplete }) => {
  const [parsedData, setParsedData] = useState<ParsedSheet | null>(null);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({}); // sourceCol -> fieldKey
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fields = db.getFields(project.id);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleNativeOpen = async () => {
    if ((window as any).electronAPI?.openFile) {
      try {
        setIsParsing(true);
        setErrorMsg(null);
        const res = await (window as any).electronAPI.openFile({
          title: 'Select Excel or CSV Spreadsheet',
          properties: ['openFile'],
          filters: [{ name: 'Spreadsheets', extensions: ['xlsx', 'csv', 'xls'] }],
        });

        if (!res.canceled && res.filePaths && res.filePaths.length > 0) {
          const filePath = res.filePaths[0];
          const base64Data = await (window as any).electronAPI.readFile(filePath, 'base64');
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const fileName = filePath.split(/[/\\]/).pop() || 'imported_spreadsheet.xlsx';
          const fileObj = new File([bytes], fileName, { type: 'application/octet-stream' });
          await processFile(fileObj);
        } else {
          setIsParsing(false);
        }
      } catch (e: any) {
        console.error(e);
        setErrorMsg(e.message || 'Error opening file');
        setIsParsing(false);
      }
    }
  };

  const processFile = async (file: File) => {
    setIsParsing(true);
    setErrorMsg(null);
    try {
      const sheet = await parseExcelOrCsv(file);
      setParsedData(sheet);

      // Auto-map matching column names
      const initialMap: Record<string, string> = {};
      sheet.columns.forEach((col) => {
        const cleanCol = col.toLowerCase().trim();
        const matchedField = fields.find(
          (f) => f.label.toLowerCase().trim() === cleanCol || f.key.toLowerCase().trim() === cleanCol
        );
        if (matchedField) {
          initialMap[col] = matchedField.key;
        } else if (cleanCol.includes('photo') || cleanCol.includes('img') || cleanCol.includes('image')) {
          initialMap[col] = 'photo';
        } else {
          initialMap[col] = col.toLowerCase().replace(/[^a-z0-9]/g, '_');
        }
      });
      setColumnMap(initialMap);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to parse file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleMapChange = (sourceCol: string, targetKey: string) => {
    setColumnMap((prev) => ({ ...prev, [sourceCol]: targetKey }));
  };

  const handleCommit = () => {
    if (!parsedData) return;

    // Create any new fields that don't exist yet
    const existingFieldKeys = new Set(fields.map((f) => f.key));
    const newFields = [...fields];

    Object.values(columnMap).forEach((targetKey) => {
      if (targetKey && targetKey !== 'IGNORE' && !existingFieldKeys.has(targetKey)) {
        existingFieldKeys.add(targetKey);
        const isPhoto = targetKey.toLowerCase().includes('photo') || targetKey.toLowerCase().includes('image');
        newFields.push({
          id: 'f_' + Math.random().toString(36).substring(2, 7),
          projectId: project.id,
          key: targetKey,
          label: targetKey.replace(/_/g, ' ').toUpperCase(),
          type: isPhoto ? 'PHOTO_REF' : 'TEXT',
          isRequired: false,
          isUnique: false,
          order: newFields.length + 1,
        });
      }
    });

    db.saveFields(project.id, newFields);

    // Transform imported rows according to mapping
    const importedRecords = parsedData.rows.map((row) => {
      const recordData: Record<string, any> = {};
      Object.entries(columnMap).forEach(([sourceCol, targetKey]) => {
        if (targetKey && targetKey !== 'IGNORE') {
          recordData[targetKey] = row[sourceCol] !== undefined ? row[sourceCol] : '';
        }
      });
      return {
        id: 'rec_' + Math.random().toString(36).substring(2, 9),
        projectId: project.id,
        recordData,
        quantity: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    // Save into local DB
    const currentRecords = db.getRecords(project.id);
    db.saveRecords(project.id, [...currentRecords, ...importedRecords]);

    alert(`Successfully imported ${importedRecords.length} records!`);
    onImportComplete();
  };

  const isDesktop = (window as any).electronAPI?.isDesktop;

  return (
    <div className="max-w-[1500px] mx-auto px-6 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-sky-400" />
          Import Data Spreadsheet
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Upload Excel (.xlsx) or CSV (.csv) containing recipient details for {project.name}.
        </p>
      </div>

      {!parsedData ? (
        /* File Upload Box */
        <div className="glass-panel rounded-2xl p-12 text-center border-2 border-dashed border-slate-800 hover:border-sky-500/50 transition-colors">
          <input
            type="file"
            accept=".xlsx,.csv,.xls"
            onChange={handleFileChange}
            id="file-upload"
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-4 border border-sky-500/20">
            <Upload className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-display font-semibold text-white mb-1">
            Select or drag & drop Excel / CSV file
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Supports .xlsx and .csv files. Columns like Name, Roll No, DOB, and Photo Filename will be auto-detected.
          </p>

          <div className="flex items-center justify-center gap-3">
            {isDesktop ? (
              <button
                onClick={handleNativeOpen}
                className="gradient-button px-6 py-3 rounded-xl text-xs font-semibold text-white shadow-lg flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4" /> Open Native File Dialog
              </button>
            ) : (
              <label htmlFor="file-upload" className="gradient-button px-6 py-3 rounded-xl text-xs font-semibold text-white cursor-pointer inline-flex items-center gap-2">
                <FolderOpen className="w-4 h-4" /> Browse Local Files
              </label>
            )}
          </div>

          {isParsing && <p className="text-xs text-sky-400 mt-4 animate-pulse">Parsing spreadsheet data...</p>}
          {errorMsg && <p className="text-xs text-rose-400 mt-4 font-mono bg-rose-500/10 p-2 rounded max-w-md mx-auto">{errorMsg}</p>}
        </div>
      ) : (
        /* Mapping & Preview Matrix */
        <div className="space-y-8">
          {/* Header Summary */}
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="text-sm font-bold text-white">{parsedData.filename}</h4>
                <p className="text-xs text-slate-400">
                  {parsedData.totalRows} records found • {parsedData.columns.length} columns detected
                </p>
              </div>
            </div>
            <button
              onClick={() => setParsedData(null)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800"
            >
              Choose Different File
            </button>
          </div>

          {/* Column Mapping Grid */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-base font-display font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Column Mapping Setup
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {parsedData.columns.map((col) => (
                <div key={col} className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-xs font-semibold text-slate-300 block mb-1.5 truncate" title={col}>
                    Source Column: <span className="text-sky-400">{col}</span>
                  </span>
                  <select
                    value={columnMap[col] || ''}
                    onChange={(e) => handleMapChange(col, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="IGNORE">-- Ignore Column --</option>
                    <optgroup label="Existing Fields">
                      {fields.map((f) => (
                        <option key={f.id} value={f.key}>
                          {f.label} ({f.key})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Create New Field">
                      <option value={col.toLowerCase().replace(/[^a-z0-9]/g, '_')}>
                        + New Field "{col}"
                      </option>
                    </optgroup>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Data Preview Table */}
          <div className="glass-panel p-6 rounded-2xl overflow-hidden">
            <h3 className="text-base font-display font-bold text-white mb-4 flex items-center gap-2">
              <Table className="w-4 h-4 text-purple-400" />
              Preview First 5 Records
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    {Object.entries(columnMap).map(
                      ([col, target]) =>
                        target !== 'IGNORE' && (
                          <th key={col} className="p-2.5 font-semibold bg-slate-900/50">
                            {col} <span className="text-sky-400">→ {target}</span>
                          </th>
                        )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.rows.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                      {Object.entries(columnMap).map(
                        ([col, target]) =>
                          target !== 'IGNORE' && (
                            <td key={col} className="p-2.5 max-w-[180px] truncate">
                              {row[col] !== undefined ? String(row[col]) : '-'}
                            </td>
                          )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Commit Button */}
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={handleCommit}
              className="gradient-button px-6 py-3 rounded-xl text-xs font-bold text-white shadow-xl shadow-blue-500/20 flex items-center gap-2"
            >
              Commit & Save {parsedData.totalRows} Records to Local Database
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
