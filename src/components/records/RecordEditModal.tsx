import React, { useState } from 'react';
import { FieldDefinition, RecordItem } from '../../types';
import { X } from 'lucide-react';

interface RecordEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  fields: FieldDefinition[];
  initialData?: RecordItem | null;
  onSave: (recordData: Record<string, any>, quantity: number) => void;
}

export const RecordEditModal: React.FC<RecordEditModalProps> = ({
  isOpen,
  onClose,
  fields,
  initialData,
  onSave,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(
    initialData ? { ...initialData.recordData } : {}
  );
  const [quantity, setQuantity] = useState<number>(initialData ? initialData.quantity || 1 : 1);

  if (!isOpen) return null;

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-display font-bold text-white mb-1">
          {initialData ? 'Edit Record' : 'Add New Record'}
        </h2>
        <p className="text-xs text-slate-400 mb-6">Enter recipient information for card generation.</p>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 flex-1">
          {fields.map((f) => (
            <div key={f.id}>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {f.label} {f.isRequired && <span className="text-rose-400">*</span>}
              </label>
              <input
                type={f.type === 'NUMBER' ? 'number' : f.type === 'DATE' ? 'date' : 'text'}
                required={f.isRequired}
                value={formData[f.key] || ''}
                onChange={(e) => handleChange(f.key, e.target.value)}
                placeholder={`Enter ${f.label.toLowerCase()}`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Card Print Quantity (Copies)
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
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
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
