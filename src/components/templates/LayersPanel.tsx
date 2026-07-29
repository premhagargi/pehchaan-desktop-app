import React, { useState } from 'react';
import { RenderElement } from '../../types';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Layers,
  Edit2,
  Check,
  Type,
  Image,
  QrCode,
  Square,
  Circle
} from 'lucide-react';

interface LayersPanelProps {
  elements: RenderElement[];
  selectedElementIds: string[];
  onSelectElement: (id: string, isShift: boolean) => void;
  onChangeElements: (elements: RenderElement[]) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  elements,
  selectedElementIds,
  onSelectElement,
  onChangeElements,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Layers displayed in reverse array order (top layer first)
  const reversedElements = [...elements].reverse();

  const handleToggleVisible = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeElements(
      elements.map((el) => (el.id === id ? { ...el, visible: el.visible === false ? true : false } : el))
    );
  };

  const handleToggleLock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeElements(
      elements.map((el) => (el.id === id ? { ...el, locked: el.locked ? false : true } : el))
    );
  };

  const handleStartRename = (el: RenderElement, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(el.id);
    setEditingName(el.name || getDefaultName(el));
  };

  const handleSaveRename = (id: string) => {
    onChangeElements(
      elements.map((el) => (el.id === id ? { ...el, name: editingName.trim() || getDefaultName(el) } : el))
    );
    setEditingId(null);
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = elements.find((el) => el.id === id);
    if (!target) return;
    const dup: RenderElement = {
      ...target,
      id: 'el_' + Math.random().toString(36).substring(2, 8),
      x: target.x + 4,
      y: target.y + 4,
      name: `${target.name || getDefaultName(target)} (Copy)`,
    };
    onChangeElements([...elements, dup]);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeElements(elements.filter((el) => el.id !== id || el.locked));
  };

  const handleMoveLayer = (id: string, action: 'front' | 'up' | 'down' | 'back') => {
    const idx = elements.findIndex((el) => el.id === id);
    if (idx === -1) return;
    const copy = [...elements];
    const item = copy.splice(idx, 1)[0];

    if (action === 'front') copy.push(item);
    if (action === 'back') copy.unshift(item);
    if (action === 'up') copy.splice(Math.min(copy.length, idx + 1), 0, item);
    if (action === 'down') copy.splice(Math.max(0, idx - 1), 0, item);

    onChangeElements(copy);
  };

  const getDefaultName = (el: RenderElement) => {
    if (el.name) return el.name;
    if (el.type === 'text') return el.binding ? `Text ({{${el.binding}}})` : `Text (${el.text || 'Static'})`;
    if (el.type === 'photo_placeholder') return `Photo (${el.binding || 'Frame'})`;
    if (el.type === 'barcode') return `Barcode (${el.barcode?.symbology || 'QR'})`;
    if (el.type === 'shape') return `Shape (${el.shapeType || 'Rect'})`;
    return 'Element';
  };

  const getElementIcon = (el: RenderElement) => {
    if (el.type === 'text') return <Type className="w-3.5 h-3.5 text-sky-400" />;
    if (el.type === 'photo_placeholder' || el.type === 'image') return <Image className="w-3.5 h-3.5 text-emerald-400" />;
    if (el.type === 'barcode') return <QrCode className="w-3.5 h-3.5 text-purple-400" />;
    if (el.shapeType === 'circle') return <Circle className="w-3.5 h-3.5 text-rose-400" />;
    return <Square className="w-3.5 h-3.5 text-amber-400" />;
  };

  return (
    <div className="glass-panel p-4 rounded-2xl space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          Layers Stack ({elements.length})
        </h3>
      </div>

      <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
        {elements.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No layers on canvas.</p>
        ) : (
          reversedElements.map((el) => {
            const isSelected = selectedElementIds.includes(el.id);
            const isHidden = el.visible === false;
            const isLocked = !!el.locked;

            return (
              <div
                key={el.id}
                onClick={(e) => onSelectElement(el.id, e.shiftKey)}
                className={`p-2 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-sky-500/10 border-sky-500/50 text-white'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                } ${isHidden ? 'opacity-40' : ''}`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getElementIcon(el)}

                  {editingId === el.id ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(el.id)}
                        autoFocus
                        className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white w-full"
                      />
                      <button
                        onClick={() => handleSaveRename(el.id)}
                        className="p-1 text-emerald-400 hover:text-white"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span
                      className="truncate text-[11px] font-medium flex-1"
                      onDoubleClick={(e) => handleStartRename(el, e)}
                    >
                      {getDefaultName(el)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {/* Layer ordering buttons */}
                  {isSelected && (
                    <div className="flex items-center gap-0.5 mr-1 bg-slate-950 p-0.5 rounded border border-slate-800">
                      <button
                        onClick={() => handleMoveLayer(el.id, 'front')}
                        className="p-0.5 text-slate-400 hover:text-white"
                        title="Bring to Front"
                      >
                        <ChevronsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMoveLayer(el.id, 'up')}
                        className="p-0.5 text-slate-400 hover:text-white"
                        title="Bring Forward"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMoveLayer(el.id, 'down')}
                        className="p-0.5 text-slate-400 hover:text-white"
                        title="Send Backward"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMoveLayer(el.id, 'back')}
                        className="p-0.5 text-slate-400 hover:text-white"
                        title="Send to Back"
                      >
                        <ChevronsDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Rename */}
                  <button
                    onClick={(e) => handleStartRename(el, e)}
                    className="p-1 text-slate-500 hover:text-slate-200"
                    title="Rename Layer"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>

                  {/* Lock / Unlock */}
                  <button
                    onClick={(e) => handleToggleLock(el.id, e)}
                    className={`p-1 ${isLocked ? 'text-amber-400' : 'text-slate-500 hover:text-slate-200'}`}
                    title={isLocked ? 'Unlock Layer' : 'Lock Layer'}
                  >
                    {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>

                  {/* Hide / Show */}
                  <button
                    onClick={(e) => handleToggleVisible(el.id, e)}
                    className={`p-1 ${isHidden ? 'text-rose-400' : 'text-slate-500 hover:text-slate-200'}`}
                    title={isHidden ? 'Show Layer' : 'Hide Layer'}
                  >
                    {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>

                  {/* Duplicate */}
                  <button
                    onClick={(e) => handleDuplicate(el.id, e)}
                    className="p-1 text-slate-500 hover:text-slate-200"
                    title="Duplicate Layer"
                  >
                    <Copy className="w-3 h-3" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => handleDelete(el.id, e)}
                    disabled={isLocked}
                    className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30"
                    title="Delete Layer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
