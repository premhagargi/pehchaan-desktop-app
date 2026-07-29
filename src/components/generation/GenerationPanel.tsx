import React, { useState } from 'react';
import { ProjectItem, GenerationProgress } from '../../types';
import { db } from '../../services/db';
import { renderSingleCardPdf } from '../../services/pdf-generator';
import JSZip from 'jszip';
import {
  Cpu,
  Play,
  CheckCircle,
  AlertTriangle,
  Download,
  Folder,
  RefreshCw,
  Zap
} from 'lucide-react';

interface GenerationPanelProps {
  project: ProjectItem;
}

export const GenerationPanel: React.FC<GenerationPanelProps> = ({ project }) => {
  const records = db.getRecords(project.id);
  const templates = db.getTemplates(project.id);
  const photos = db.getPhotos(project.id);
  const fields = db.getFields(project.id);

  const [progress, setProgress] = useState<GenerationProgress>({
    total: 0,
    current: 0,
    status: 'idle',
    speedCardsPerSec: 0,
    errors: [],
  });

  const [zipDataUrl, setZipDataUrl] = useState<string | null>(null);

  const handleStartGeneration = async () => {
    const template = templates[0];
    if (!template) {
      alert('Please create a template first!');
      return;
    }
    if (records.length === 0) {
      alert('No records to generate!');
      return;
    }

    setProgress({
      total: records.length,
      current: 0,
      status: 'generating',
      speedCardsPerSec: 0,
      errors: [],
    });
    setZipDataUrl(null);

    const zip = new JSZip();
    const photoMap = new Map<string, string>();
    photos.forEach((p) => {
      if (p.recordId && p.dataUrl) photoMap.set(p.recordId, p.dataUrl);
    });

    const startTime = Date.now();
    const nameKey = fields.find((f) => f.key.toLowerCase().includes('name'))?.key || 'name';
    const idKey = fields.find((f) => f.key.toLowerCase().includes('roll') || f.key.toLowerCase().includes('id'))?.key || 'id';

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const photoUrl = photoMap.get(record.id);

      try {
        const cardPdfBytes = await renderSingleCardPdf({
          elements: template.sceneGraph,
          cardWidthMm: template.cardWidthMm,
          cardHeightMm: template.cardHeightMm,
          recordData: record.recordData,
          photoDataUrl: photoUrl,
          backgroundColor: template.backgroundColor,
        });

        const recName = (record.recordData[nameKey] || `Record_${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
        const recId = (record.recordData[idKey] || i + 1).toString().replace(/[^a-zA-Z0-9_-]/g, '_');

        zip.file(`ID_Card_${recId}_${recName}.pdf`, cardPdfBytes);
      } catch (err: any) {
        setProgress((prev) => ({
          ...prev,
          errors: [...prev.errors, { recordId: record.id, message: err.message || 'Render failed' }],
        }));
      }

      const elapsedSec = (Date.now() - startTime) / 1000;
      const speed = elapsedSec > 0 ? Math.round(((i + 1) / elapsedSec) * 10) / 10 : 0;

      setProgress((prev) => ({
        ...prev,
        current: i + 1,
        speedCardsPerSec: speed,
      }));
    }

    // Generate final zip package
    const zipContent = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipContent);
    setZipDataUrl(url);

    setProgress((prev) => ({ ...prev, status: 'done' }));
  };

  const handleDownloadZip = async () => {
    if (!zipDataUrl) return;

    if ((window as any).electronAPI) {
      const res = await (window as any).electronAPI.saveFile({
        defaultPath: `${project.name}_Cards_Bundle.zip`,
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
      });
      if (!res.canceled && res.filePath) {
        const response = await fetch(zipDataUrl);
        const buffer = await response.arrayBuffer();
        await (window as any).electronAPI.writeFile(res.filePath, Buffer.from(buffer));
        alert('Saved ZIP bundle to disk!');
      }
    } else {
      const a = document.createElement('a');
      a.href = zipDataUrl;
      a.download = `${project.name}_Cards_Bundle.zip`;
      a.click();
    }
  };

  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="max-w-[1500px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-sky-400" />
            Batch CPU PDF Generation Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Render individual high-resolution print-ready PDFs directly on local CPU threads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStartGeneration}
            disabled={progress.status === 'generating'}
            className="gradient-button px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 disabled:opacity-50"
          >
            {progress.status === 'generating' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            {progress.status === 'generating' ? 'Generating PDFs...' : 'Start Batch CPU Generation'}
          </button>
        </div>
      </div>

      {/* Progress & Speed Monitor Card */}
      <div className="glass-panel p-8 rounded-2xl mb-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Batch Progress Tracker
            </h3>
            <p className="text-xs text-slate-400">
              {progress.status === 'idle'
                ? 'Ready to process.'
                : progress.status === 'generating'
                ? `Processing record ${progress.current} of ${progress.total}...`
                : 'Batch processing finished cleanly!'}
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-display font-extrabold text-sky-400 font-mono">
              {percent}%
            </span>
            <div className="text-[11px] text-slate-400 font-mono">
              {progress.speedCardsPerSec} cards / sec
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-500 rounded-full transition-all duration-300 shadow-lg shadow-sky-500/50"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Download result box */}
        {progress.status === 'done' && (
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <CheckCircle className="w-5 h-5" />
              Batch generation completed ({progress.total} cards rendered)!
            </div>

            <button
              onClick={handleDownloadZip}
              className="gradient-button px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download All Cards (.ZIP)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
