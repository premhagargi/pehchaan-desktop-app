import React, { useState } from 'react';
import { ProjectItem, PrintProfileItem, ImpositionMode, CropMarkStyle } from '../../types';
import { db } from '../../services/db';
import { computeSheetFit, computeGridAssignment } from '../../services/imposition-engine';
import { composeImpositionSheetPdf } from '../../services/pdf-generator';
import {
  Printer,
  Download,
  CheckCircle,
  AlertTriangle,
  Grid,
  Layers,
  Sparkles,
  RefreshCw,
  FileText
} from 'lucide-react';

interface ExportPanelProps {
  project: ProjectItem;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ project }) => {
  const printProfiles = db.getPrintProfiles();
  const records = db.getRecords(project.id);
  const templates = db.getTemplates(project.id);
  const photos = db.getPhotos(project.id);

  const [activeProfile, setActiveProfile] = useState<PrintProfileItem>(
    printProfiles[0] || {
      id: 'pp_' + Math.random().toString(36).substring(2, 9),
      name: '12×18 Sheet — 10-Up Cut-Stack Transpose',
      sheetWidthMm: 304.8,
      sheetHeightMm: 457.2,
      cardTrimWidthMm: 85.6,
      cardTrimHeightMm: 53.98,
      bleedMm: 2,
      safeZoneMm: 2,
      rows: 5,
      cols: 2,
      marginTopMm: 15,
      marginBottomMm: 15,
      marginLeftMm: 15,
      marginRightMm: 15,
      gutterXMm: 5,
      gutterYMm: 5,
      cropMarkStyle: 'CORNER',
      positionOrder: 'ROW_MAJOR',
      impositionMode: 'CUT_STACK_TRANSPOSE',
      createdAt: new Date().toISOString(),
    }
  );

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

  const fit = computeSheetFit(activeProfile);
  const assignment = computeGridAssignment({
    recordCount: records.length,
    rows: activeProfile.rows,
    cols: activeProfile.cols,
    impositionMode: activeProfile.impositionMode,
  });

  const updateProfileProp = (key: string, val: any) => {
    setActiveProfile((prev) => {
      const updated = { ...prev, [key]: val };
      db.savePrintProfile(updated);
      return updated;
    });
  };

  const handleExportImpositionPdf = async () => {
    const template = templates[0];
    if (!template) {
      alert('Please create a card template first!');
      return;
    }
    if (records.length === 0) {
      alert('No records available for export!');
      return;
    }

    setIsExporting(true);
    try {
      const sheetPdfBytes = await composeImpositionSheetPdf({
        template,
        records,
        photos,
        printProfile: activeProfile,
        onProgress: (current, total) => setExportProgress({ current, total }),
      });

      if ((window as any).electronAPI) {
        const res = await (window as any).electronAPI.saveFile({
          defaultPath: `${project.name}_PrintSheet_CutStack.pdf`,
          filters: [{ name: 'PDF Print Sheet', extensions: ['pdf'] }],
        });
        if (!res.canceled && res.filePath) {
          await (window as any).electronAPI.writeFile(res.filePath, Buffer.from(sheetPdfBytes));
          alert('Exported Imposition PDF Print Sheet!');
        }
      } else {
        const blob = new Blob([new Uint8Array(sheetPdfBytes)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name}_PrintSheet_CutStack.pdf`;
        a.click();
      }
    } catch (e: any) {
      console.error(e);
      alert('Imposition export failed: ' + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-[1700px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <Printer className="w-6 h-6 text-sky-400" />
            Print Imposition Sheet Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure multi-card paper sheet layouts with Cut-Stack-Transpose pre-sorted paper cutting math.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportImpositionPdf}
            disabled={isExporting || !fit.fits}
            className="gradient-button px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting
              ? `Exporting Sheet ${exportProgress.current} / ${exportProgress.total}...`
              : 'Export Print-Ready PDF Sheet'}
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Print Profile Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Fit Status Alert */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 ${
              fit.fits
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {fit.fits ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">
                {fit.fits ? 'Sheet Fit Confirmed' : 'Sheet Overflow Warning'}
              </h4>
              <p className="text-[11px] mt-0.5 opacity-90">
                {fit.fits
                  ? `Grid consumes ${fit.requiredWidthMm.toFixed(1)}mm × ${fit.requiredHeightMm.toFixed(
                      1
                    )}mm of paper sheet space.`
                  : `Grid exceeds sheet dimensions! Paper fits max ${fit.maxCols} cols × ${fit.maxRows} rows.`}
              </p>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-2">
              Sheet & Paper Layout Setup
            </h3>

            {/* Imposition Mode Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Imposition Algorithm
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateProfileProp('impositionMode', 'CUT_STACK_TRANSPOSE')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    activeProfile.impositionMode === 'CUT_STACK_TRANSPOSE'
                      ? 'border-sky-500 bg-sky-500/10 text-sky-400 shadow-md shadow-sky-500/10'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  Cut-Stack-Transpose
                  <span className="block text-[9px] font-normal text-slate-500 mt-0.5">Pre-sorted paper stack</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateProfileProp('impositionMode', 'SEQUENTIAL_FILL')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    activeProfile.impositionMode === 'SEQUENTIAL_FILL'
                      ? 'border-sky-500 bg-sky-500/10 text-sky-400 shadow-md shadow-sky-500/10'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  Sequential Fill
                  <span className="block text-[9px] font-normal text-slate-500 mt-0.5">Standard row/col fill</span>
                </button>
              </div>
            </div>

            {/* Paper Sheet Sizes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Sheet Width (mm)</label>
                <input
                  type="number"
                  value={activeProfile.sheetWidthMm}
                  onChange={(e) => updateProfileProp('sheetWidthMm', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Sheet Height (mm)</label>
                <input
                  type="number"
                  value={activeProfile.sheetHeightMm}
                  onChange={(e) => updateProfileProp('sheetHeightMm', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            {/* Grid Rows & Cols */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Columns (N-Up)</label>
                <input
                  type="number"
                  min={1}
                  value={activeProfile.cols}
                  onChange={(e) => updateProfileProp('cols', parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Rows (N-Up)</label>
                <input
                  type="number"
                  min={1}
                  value={activeProfile.rows}
                  onChange={(e) => updateProfileProp('rows', parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                />
              </div>
            </div>

            {/* Margins & Gutters */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Left Margin (mm)</label>
                <input
                  type="number"
                  value={activeProfile.marginLeftMm}
                  onChange={(e) => updateProfileProp('marginLeftMm', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Top Margin (mm)</label>
                <input
                  type="number"
                  value={activeProfile.marginTopMm}
                  onChange={(e) => updateProfileProp('marginTopMm', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Gutter X (mm)</label>
                <input
                  type="number"
                  value={activeProfile.gutterXMm}
                  onChange={(e) => updateProfileProp('gutterXMm', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Gutter Y (mm)</label>
                <input
                  type="number"
                  value={activeProfile.gutterYMm}
                  onChange={(e) => updateProfileProp('gutterYMm', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                />
              </div>
            </div>

            {/* Crop Marks */}
            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">Crop Marks Style</label>
              <select
                value={activeProfile.cropMarkStyle}
                onChange={(e) => updateProfileProp('cropMarkStyle', e.target.value as CropMarkStyle)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="NONE">None</option>
                <option value="CORNER">Corner Lines</option>
                <option value="FULL">Full Crosshairs</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Paper Sheet Grid Preview */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl flex flex-col items-center justify-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <Grid className="w-4 h-4 text-purple-400" />
            Imposition Sheet Layout ({assignment.sheetCount} Printed Sheets Required)
          </h3>

          {/* Visual Paper Box */}
          <div
            className="border-2 border-slate-700 bg-slate-900 rounded-xl relative p-3 flex flex-col justify-between shadow-2xl"
            style={{
              width: 320,
              height: Math.round((320 * activeProfile.sheetHeightMm) / activeProfile.sheetWidthMm),
            }}
          >
            {/* Margins box */}
            <div
              className="w-full h-full border border-dashed border-sky-500/40 relative grid gap-1 p-1"
              style={{
                gridTemplateColumns: `repeat(${activeProfile.cols}, 1fr)`,
                gridTemplateRows: `repeat(${activeProfile.rows}, 1fr)`,
              }}
            >
              {Array.from({ length: activeProfile.rows * activeProfile.cols }).map((_, i) => (
                <div
                  key={i}
                  className="bg-sky-500/20 border border-sky-400/60 rounded flex items-center justify-center text-[10px] font-mono text-sky-300 font-bold"
                >
                  Card #{i + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate-400 font-mono text-center">
            {activeProfile.cols} × {activeProfile.rows} = {activeProfile.cols * activeProfile.rows} cards per sheet • Total {records.length} cards
          </div>
        </div>
      </div>
    </div>
  );
};
