import React, { useState } from 'react';
import { ProjectItem, PhotoItem } from '../../types';
import { db } from '../../services/db';
import { autoMatchPhotos } from '../../services/photo-matcher';
import JSZip from 'jszip';
import {
  Image as ImageIcon,
  Upload,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Unlink,
  Search,
  Check,
  RefreshCw
} from 'lucide-react';

interface PhotosPanelProps {
  project: ProjectItem;
  onRefresh: () => void;
}

export const PhotosPanel: React.FC<PhotosPanelProps> = ({ project, onRefresh }) => {
  const photos = db.getPhotos(project.id);
  const records = db.getRecords(project.id);
  const fields = db.getFields(project.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const matchedCount = photos.filter((p) => p.status === 'CONFIRMED' || p.status === 'AUTO_MATCHED').length;
  const pendingCount = photos.filter((p) => p.status === 'PENDING').length;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.toLowerCase().endsWith('.zip')) {
          // Process Zip file
          const zip = await JSZip.loadAsync(file);
          for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
            if (!zipEntry.dir && /\.(jpg|jpeg|png|webp|svg)$/i.test(relativePath)) {
              const blob = await zipEntry.async('blob');
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = reader.result as string;
                const filename = relativePath.split('/').pop() || relativePath;
                if ((window as any).electronAPI) {
                  const base64Data = dataUrl.split(',')[1];
                  const ext = filename.split('.').pop() || 'jpg';
                  const diskFilename = `photo_${Date.now()}_${Math.random().toString(36).substring(2,7)}.${ext}`;
                  (window as any).electronAPI.getStorageDir().then((dir: string) => {
                    const filePath = `${dir}/photos/${diskFilename}`;
                    (window as any).electronAPI.writeFile(filePath, base64Data, 'base64').then(() => {
                      db.addPhoto(project.id, filename, `pehchaan://photos/${diskFilename}`);
                    });
                  });
                } else {
                  db.addPhoto(project.id, filename, dataUrl);
                }
              };
              reader.readAsDataURL(blob);
            }
          }
        } else if (/\.(jpg|jpeg|png|webp|svg)$/i.test(file.name)) {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            if ((window as any).electronAPI) {
              const base64Data = dataUrl.split(',')[1];
              const ext = file.name.split('.').pop() || 'jpg';
              const diskFilename = `photo_${Date.now()}_${Math.random().toString(36).substring(2,7)}.${ext}`;
              (window as any).electronAPI.getStorageDir().then((dir: string) => {
                const filePath = `${dir}/photos/${diskFilename}`;
                (window as any).electronAPI.writeFile(filePath, base64Data, 'base64').then(() => {
                  db.addPhoto(project.id, file.name, `pehchaan://photos/${diskFilename}`);
                  onRefresh();
                });
              });
            } else {
              db.addPhoto(project.id, file.name, dataUrl);
              onRefresh();
            }
          };
          reader.readAsDataURL(file);
        }
      }
      setTimeout(() => onRefresh(), 500);
    } catch (err) {
      console.error(err);
      alert('Error uploading photo files');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoMatch = () => {
    setIsProcessing(true);
    const results = autoMatchPhotos(photos, records, fields);
    const updatedPhotos = [...photos];

    results.forEach((res) => {
      const idx = updatedPhotos.findIndex((p) => p.id === res.photoId);
      if (idx !== -1 && res.recordId) {
        updatedPhotos[idx] = {
          ...updatedPhotos[idx],
          recordId: res.recordId,
          matchConfidence: res.confidence,
          matchMethod: res.method,
          status: res.confidence >= 0.9 ? 'CONFIRMED' : 'AUTO_MATCHED',
        };
      }
    });

    db.savePhotos(project.id, updatedPhotos);
    setIsProcessing(false);
    onRefresh();
    alert(`Auto-matching completed! Evaluated ${results.length} photos.`);
  };

  const handleConfirmMatch = (photoId: string) => {
    const updated = photos.map((p) => (p.id === photoId ? { ...p, status: 'CONFIRMED' as const } : p));
    db.savePhotos(project.id, updated);
    onRefresh();
  };

  const handleUnlinkPhoto = (photoId: string) => {
    const updated = photos.map((p) =>
      p.id === photoId ? { ...p, recordId: null, matchConfidence: null, status: 'PENDING' as const } : p
    );
    db.savePhotos(project.id, updated);
    onRefresh();
  };

  const handleManualReassign = (photoId: string, recordId: string) => {
    const updated = photos.map((p) =>
      p.id === photoId
        ? {
            ...p,
            recordId: recordId || null,
            status: recordId ? ('CONFIRMED' as const) : ('PENDING' as const),
            matchMethod: 'MANUAL' as const,
            matchConfidence: recordId ? 1.0 : null,
          }
        : p
    );
    db.savePhotos(project.id, updated);
    onRefresh();
  };

  const filteredPhotos = photos.filter((p) =>
    p.originalFilename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1700px] mx-auto px-6 py-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-sky-400" />
            Photo Assets & Auto Matching ({photos.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload student/employee photos and run fuzzy-string matching algorithm.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="gradient-button px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg shadow-blue-500/20 cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Photos / ZIP
            <input
              type="file"
              multiple
              accept="image/*,.zip"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={handleAutoMatch}
            disabled={photos.length === 0 || isProcessing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Run Auto-Matcher
          </button>
        </div>
      </div>

      {/* Progress & Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Matched Photos</span>
            <h4 className="text-lg font-bold text-white font-mono">{matchedCount} / {photos.length}</h4>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Pending Review</span>
            <h4 className="text-lg font-bold text-white font-mono">{pendingCount}</h4>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Records Without Photo</span>
            <h4 className="text-lg font-bold text-white font-mono">
              {Math.max(0, records.length - matchedCount)}
            </h4>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter photos by filename..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-dashed border-slate-800">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No Photos Uploaded</h3>
          <p className="text-xs text-slate-500 mt-1">Upload photos individually or as a .zip file archive.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => {
            const matchedRecord = records.find((r) => r.id === photo.recordId);
            const nameKey = fields.find((f) => f.key.toLowerCase().includes('name'))?.key || 'name';
            const matchedName = matchedRecord ? matchedRecord.recordData[nameKey] || matchedRecord.id : 'Unassigned';

            return (
              <div key={photo.id} className="glass-card p-3 rounded-2xl flex flex-col justify-between">
                <div>
                  {/* Photo Preview Container */}
                  <div className="w-full h-44 rounded-xl bg-slate-950 overflow-hidden mb-3 border border-slate-800/80 flex items-center justify-center relative">
                    <img
                      src={photo.dataUrl}
                      alt={photo.originalFilename}
                      className="w-full h-full object-cover"
                    />
                    {photo.matchConfidence && (
                      <span className="absolute top-2 right-2 text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-black/80 text-sky-400 border border-sky-500/30">
                        {Math.round(photo.matchConfidence * 100)}% match
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-semibold text-slate-200 truncate mb-1" title={photo.originalFilename}>
                    {photo.originalFilename}
                  </h4>
                </div>

                {/* Match Control Dropdown */}
                <div className="space-y-2 mt-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Assigned To:</span>
                    <span className="font-semibold text-sky-400 truncate max-w-[120px]">{matchedName}</span>
                  </div>

                  <select
                    value={photo.recordId || ''}
                    onChange={(e) => handleManualReassign(photo.id, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- Unassigned --</option>
                    {records.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.recordData[nameKey] || r.id} ({r.recordData['roll_no'] || r.recordData['id_number'] || ''})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2 pt-1">
                    {photo.status !== 'CONFIRMED' && photo.recordId && (
                      <button
                        onClick={() => handleConfirmMatch(photo.id)}
                        className="flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Confirm
                      </button>
                    )}
                    {photo.recordId && (
                      <button
                        onClick={() => handleUnlinkPhoto(photo.id)}
                        className="py-1 px-2 rounded-lg text-[11px] font-medium bg-slate-800 text-slate-400 hover:text-white"
                        title="Unlink Photo"
                      >
                        <Unlink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
