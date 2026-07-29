import React, { useState } from 'react';
import { ProjectType } from '../../types';
import { X, CreditCard, Award, BadgeCheck } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, type: ProjectType, description: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('ID_CARD');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), projectType, description.trim());
    setName('');
    setDescription('');
    onClose();
  };

  const types: { type: ProjectType; label: string; icon: any; desc: string }[] = [
    { type: 'ID_CARD', label: 'ID Card', icon: CreditCard, desc: 'Student, employee, visitor identity cards' },
    { type: 'CERTIFICATE', label: 'Certificate', icon: Award, desc: 'Diplomas, course certificates, appreciation awards' },
    { type: 'BADGE', label: 'Event Badge', icon: BadgeCheck, desc: 'Conferences, summits, trade show pass badges' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-display font-bold text-white mb-1">Create New Project</h2>
        <p className="text-xs text-slate-400 mb-6">Initialize a local document generation project.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Project Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. City High School 2026 Batch"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Project Document Type</label>
            <div className="grid grid-cols-3 gap-3">
              {types.map((t) => {
                const Icon = t.icon;
                const selected = projectType === t.type;
                return (
                  <button
                    type="button"
                    key={t.type}
                    onClick={() => setProjectType(t.type)}
                    className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                      selected
                        ? 'border-sky-500 bg-sky-500/10 text-sky-400 font-semibold shadow-lg shadow-sky-500/10'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <span className="text-xs font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief note about this bulk project..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="gradient-button px-5 py-2 rounded-xl text-xs font-semibold text-white"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
