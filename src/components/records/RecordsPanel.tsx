import React, { useState } from 'react';
import { ProjectItem, RecordItem, FieldDefinition } from '../../types';
import { db } from '../../services/db';
import { exportRecordsToExcel } from '../../services/excel-parser';
import { RecordEditModal } from './RecordEditModal';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Image,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Copy
} from 'lucide-react';

interface RecordsPanelProps {
  project: ProjectItem;
  onRefresh: () => void;
}

export const RecordsPanel: React.FC<RecordsPanelProps> = ({ project, onRefresh }) => {
  const fields = db.getFields(project.id);
  const records = db.getRecords(project.id);
  const photos = db.getPhotos(project.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredRecords = records.filter((rec) => {
    const jsonStr = JSON.stringify(rec.recordData).toLowerCase();
    return jsonStr.includes(searchTerm.toLowerCase());
  });

  const photoMap = new Map<string, string>();
  photos.forEach((p) => {
    if (p.recordId) photoMap.set(p.recordId, p.status);
  });

  const handleCreate = (data: Record<string, any>, qty: number) => {
    db.addRecord(project.id, data, qty);
    onRefresh();
  };

  const handleUpdate = (data: Record<string, any>, qty: number) => {
    if (selectedRecord) {
      db.updateRecord(project.id, selectedRecord.id, data, qty);
      onRefresh();
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this record?')) {
      db.deleteRecord(project.id, id);
      onRefresh();
    }
  };

  const handleExportExcel = async () => {
    const cols = fields.map((f) => ({ key: f.key, label: f.label }));
    const rows = records.map((r) => r.recordData);
    const bytes = await exportRecordsToExcel(`${project.name}_Records.xlsx`, cols, rows);

    if ((window as any).electronAPI) {
      const res = await (window as any).electronAPI.saveFile({
        defaultPath: `${project.name}_Records.xlsx`,
        filters: [{ name: 'Excel Spreadsheet', extensions: ['xlsx'] }],
      });
      if (!res.canceled && res.filePath) {
        await (window as any).electronAPI.writeFile(res.filePath, Buffer.from(bytes));
        alert('Exported records to Excel file!');
      }
    } else {
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}_Records.xlsx`;
      a.click();
    }
  };

  return (
    <div className="max-w-[1700px] mx-auto px-6 py-8">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-400" />
            Project Records Data ({records.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage recipient profiles, field entries, and copy quantities for {project.name}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>

          <button
            onClick={() => {
              setSelectedRecord(null);
              setIsModalOpen(true);
            }}
            className="gradient-button flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Record
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter records by name, ID, roll number..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Table container */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto max-h-[65vh]">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="sticky top-0 bg-slate-900/95 backdrop-blur z-10 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 font-bold w-12 text-center">#</th>
                <th className="p-3.5 font-bold">Photo Status</th>
                {fields.map((f) => (
                  <th key={f.id} className="p-3.5 font-bold whitespace-nowrap">
                    {f.label}
                  </th>
                ))}
                <th className="p-3.5 font-bold text-center w-20">Copies</th>
                <th className="p-3.5 font-bold text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={fields.length + 4} className="p-8 text-center text-slate-500 text-xs">
                    No records found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const photoStatus = photoMap.get(rec.id);
                  return (
                    <tr key={rec.id} className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5 text-center font-mono text-slate-500 text-[11px]">{idx + 1}</td>

                      {/* Photo status tag */}
                      <td className="p-3.5">
                        {photoStatus === 'CONFIRMED' || photoStatus === 'AUTO_MATCHED' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle className="w-3 h-3" /> Matched
                          </span>
                        ) : photoStatus === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" /> Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" /> Missing
                          </span>
                        )}
                      </td>

                      {/* Dynamic Field Values */}
                      {fields.map((f) => (
                        <td key={f.id} className="p-3.5 max-w-[200px] truncate">
                          {rec.recordData[f.key] !== undefined && rec.recordData[f.key] !== '' ? (
                            String(rec.recordData[f.key])
                          ) : (
                            <span className="text-slate-600 font-mono text-[11px]">—</span>
                          )}
                        </td>
                      ))}

                      {/* Quantity */}
                      <td className="p-3.5 text-center font-bold font-mono text-slate-200">
                        {rec.quantity || 1}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedRecord(rec);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(rec.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      <RecordEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fields={fields}
        initialData={selectedRecord}
        onSave={selectedRecord ? handleUpdate : handleCreate}
      />
    </div>
  );
};
