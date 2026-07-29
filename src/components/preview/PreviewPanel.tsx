import React, { useState } from 'react';
import { ProjectItem } from '../../types';
import { db } from '../../services/db';
import { renderSingleCardPdf } from '../../services/pdf-generator';
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Search,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';

interface PreviewPanelProps {
  project: ProjectItem;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ project }) => {
  const records = db.getRecords(project.id);
  const templates = db.getTemplates(project.id);
  const photos = db.getPhotos(project.id);
  const fields = db.getFields(project.id);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [renderedPdfUrl, setRenderedPdfUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  const currentRecord = records[currentIndex] || null;
  const currentTemplate = templates[0] || null;
  const boundPhoto = currentRecord ? photos.find((p) => p.recordId === currentRecord.id) : null;

  // Render current card live using pdf-lib
  const handleRenderCard = async () => {
    if (!currentRecord || !currentTemplate) return;
    setIsRendering(true);
    try {
      const elements = activeSide === 'front' ? currentTemplate.sceneGraph : currentTemplate.sceneGraphBack || [];
      const pdfBytes = await renderSingleCardPdf({
        elements,
        cardWidthMm: currentTemplate.cardWidthMm,
        cardHeightMm: currentTemplate.cardHeightMm,
        recordData: currentRecord.recordData,
        photoDataUrl: boundPhoto?.dataUrl,
        backgroundColor: currentTemplate.backgroundColor,
      });

      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setRenderedPdfUrl(url);
    } catch (e) {
      console.error('Failed to render preview PDF:', e);
    } finally {
      setIsRendering(false);
    }
  };

  React.useEffect(() => {
    handleRenderCard();
  }, [currentIndex, activeSide, project.id]);

  // Problem detector
  const missingRequiredFields: string[] = [];
  if (currentRecord) {
    fields.forEach((f) => {
      if (f.isRequired && (!currentRecord.recordData[f.key] || currentRecord.recordData[f.key] === '')) {
        missingRequiredFields.push(f.label);
      }
    });
  }

  const isPhotoMissing = !boundPhoto;

  return (
    <div className="max-w-[1500px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <Eye className="w-6 h-6 text-sky-400" />
            Live Document Preview
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Validate rendered PDF output for individual records before bulk export.
          </p>
        </div>

        {/* Side Toggle & Navigator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveSide('front')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                activeSide === 'front' ? 'bg-sky-500 text-white' : 'text-slate-400'
              }`}
            >
              Front
            </button>
            <button
              onClick={() => setActiveSide('back')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                activeSide === 'back' ? 'bg-sky-500 text-white' : 'text-slate-400'
              }`}
            >
              Back
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-2 text-slate-300">
              {records.length > 0 ? `${currentIndex + 1} / ${records.length}` : '0 / 0'}
            </span>
            <button
              disabled={currentIndex >= records.length - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(records.length - 1, prev + 1))}
              className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* PDF Preview Frame */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl flex flex-col items-center justify-center min-h-[550px]">
          {isRendering ? (
            <div className="text-center text-sky-400 animate-pulse text-xs">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              Rendering PDF Preview...
            </div>
          ) : renderedPdfUrl ? (
            <iframe
              src={renderedPdfUrl}
              className="w-full h-[520px] rounded-xl border border-slate-800 bg-white"
              title="Card PDF Preview"
            />
          ) : (
            <div className="text-slate-500 text-xs">No records available for preview.</div>
          )}
        </div>

        {/* Validation & Record Inspector Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Record Selector Dropdown */}
          <div className="glass-panel p-5 rounded-2xl">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select Record
            </label>
            <select
              value={currentIndex}
              onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            >
              {records.map((r, i) => {
                const nameKey = fields.find((f) => f.key.toLowerCase().includes('name'))?.key || 'name';
                return (
                  <option key={r.id} value={i}>
                    #{i + 1} - {r.recordData[nameKey] || r.id}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Validation Status Box */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Validation & Quality Checks
            </h3>

            {missingRequiredFields.length > 0 ? (
              <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-rose-300">Missing Required Fields</h4>
                  <p className="text-[11px] text-rose-400/80">
                    {missingRequiredFields.join(', ')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-300 font-medium">All required text fields populated</span>
              </div>
            )}

            {isPhotoMissing ? (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-start gap-2.5">
                <ImageIcon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-amber-300">No Photo Matched</h4>
                  <p className="text-[11px] text-amber-400/80">
                    This record has no photo assigned in Photos tab.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-300 font-medium">Photo assigned ({boundPhoto?.originalFilename})</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
