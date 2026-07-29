import React, { useState } from 'react';
import { RenderElement, FieldDefinition, TemplateItem } from '../../types';
import {
  Layers,
  Variable,
  History,
  Upload,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Type,
  Image,
  QrCode,
  Square,
  Circle,
  Edit2,
  Check,
  Hash,
  Clock
} from 'lucide-react';

type PanelType = 'layers' | 'variables' | 'history' | 'uploads';

interface LeftSidebarProps {
  activePanel: PanelType;
  onSetPanel: (p: PanelType) => void;
  elements: RenderElement[];
  selectedIds: string[];
  fields: FieldDefinition[];
  history: TemplateItem[];
  historyIndex: number;
  onSelectElement: (id: string | null, shift?: boolean) => void;
  onSelectMultiple: (ids: string[]) => void;
  onChangeElements: (els: RenderElement[]) => void;
  onInsertVariable: (key: string) => void;
  onJumpToHistory: (idx: number) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activePanel, onSetPanel,
  elements, selectedIds, fields, history, historyIndex,
  onSelectElement, onSelectMultiple, onChangeElements,
  onInsertVariable, onJumpToHistory
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const tabs: { key: PanelType; icon: React.ReactNode; label: string }[] = [
    { key: 'layers', icon: <Layers className="w-3.5 h-3.5" />, label: 'Layers' },
    { key: 'variables', icon: <Variable className="w-3.5 h-3.5" />, label: 'Variables' },
    { key: 'history', icon: <History className="w-3.5 h-3.5" />, label: 'History' },
    { key: 'uploads', icon: <Upload className="w-3.5 h-3.5" />, label: 'Assets' },
  ];

  const getElIcon = (el: RenderElement) => {
    if (el.type === 'text') return <Type className="w-3 h-3 text-sky-400" />;
    if (el.type === 'photo_placeholder') return <Image className="w-3 h-3 text-emerald-400" />;
    if (el.type === 'barcode') return <QrCode className="w-3 h-3 text-purple-400" />;
    if (el.shapeType === 'circle') return <Circle className="w-3 h-3 text-amber-400" />;
    return <Square className="w-3 h-3 text-rose-400" />;
  };

  const getElName = (el: RenderElement) => {
    if (el.name) return el.name;
    if (el.type === 'text') return el.binding ? `{{${el.binding}}}` : (el.text?.substring(0, 20) || 'Text');
    if (el.type === 'photo_placeholder') return 'Photo Frame';
    if (el.type === 'barcode') return `${el.barcode?.symbology?.toUpperCase() || 'Barcode'}`;
    return `${el.shapeType || el.type}`;
  };

  const toggleVisibility = (id: string) => {
    onChangeElements(elements.map(el => el.id === id ? { ...el, visible: el.visible === false ? true : false } : el));
  };

  const toggleLock = (id: string) => {
    onChangeElements(elements.map(el => el.id === id ? { ...el, locked: !el.locked } : el));
  };

  const deleteEl = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (el?.locked) return;
    onChangeElements(elements.filter(e => e.id !== id));
  };

  const moveLayer = (id: string, action: 'up' | 'down' | 'front' | 'back') => {
    const idx = elements.findIndex(e => e.id === id);
    if (idx === -1) return;
    const copy = [...elements];
    const [item] = copy.splice(idx, 1);
    if (action === 'front') copy.push(item);
    else if (action === 'back') copy.unshift(item);
    else if (action === 'up') copy.splice(Math.min(copy.length, idx + 1), 0, item);
    else copy.splice(Math.max(0, idx - 1), 0, item);
    onChangeElements(copy);
  };

  const variableExpressions = [
    ...fields.map(f => ({ key: f.key, label: f.label, expr: `{{${f.key}}}` })),
  ];

  const exampleExprs = [
    { label: 'Full Name', expr: '{{first_name}} {{last_name}}' },
    { label: 'ID with prefix', expr: 'ID-{{roll_no}}' },
    { label: 'Profile URL', expr: 'https://school.com/{{student_id}}' },
    { label: 'Class/Section', expr: '{{class}}/{{section}}' },
  ];

  return (
    <div className="w-52 bg-[#0d1424] border-r border-slate-800/60 flex flex-col min-h-0">
      {/* Tab bar */}
      <div className="flex border-b border-slate-800/60">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onSetPanel(tab.key)}
            title={tab.label}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
              activePanel === tab.key
                ? 'text-sky-400 border-b-2 border-sky-500 bg-sky-500/5'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.icon}
            <span className="hidden">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* LAYERS Panel */}
        {activePanel === 'layers' && (
          <div className="p-2 space-y-0.5">
            <div className="text-[10px] font-bold uppercase text-slate-500 px-1 pb-1 flex items-center justify-between">
              <span>Layers ({elements.length})</span>
            </div>

            {elements.length === 0 && (
              <div className="text-[11px] text-slate-600 text-center py-6 px-2">
                No elements yet.<br />Use the toolbar to add.
              </div>
            )}

            {[...elements].reverse().map(el => {
              const isSelected = selectedIds.includes(el.id);
              const isHidden = el.visible === false;
              const isLocked = !!el.locked;

              return (
                <div
                  key={el.id}
                  onClick={(e) => onSelectElement(el.id, e.shiftKey)}
                  className={`group flex items-center gap-1.5 px-1.5 py-1 rounded-lg cursor-pointer text-[11px] transition-colors ${
                    isSelected
                      ? 'bg-sky-500/15 text-white border border-sky-500/30'
                      : 'text-slate-400 hover:bg-slate-800/60 border border-transparent'
                  } ${isHidden ? 'opacity-40' : ''}`}
                >
                  <span className="shrink-0">{getElIcon(el)}</span>

                  {editingId === el.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          onChangeElements(elements.map(item => item.id === el.id ? { ...item, name: editingName } : item));
                          setEditingId(null);
                        }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded px-1 text-[10px] text-white"
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="flex-1 min-w-0 truncate"
                      onDoubleClick={e => {
                        e.stopPropagation();
                        setEditingId(el.id);
                        setEditingName(el.name || getElName(el));
                      }}
                    >
                      {getElName(el)}
                    </span>
                  )}

                  <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); toggleVisibility(el.id); }}
                      className="p-0.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white"
                    >
                      {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); toggleLock(el.id); }}
                      className={`p-0.5 rounded hover:bg-slate-700 ${isLocked ? 'text-amber-400' : 'text-slate-500 hover:text-white'}`}
                    >
                      {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteEl(el.id); }}
                      disabled={isLocked}
                      className="p-0.5 rounded hover:bg-red-900/40 text-slate-500 hover:text-red-400 disabled:opacity-30"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VARIABLES Panel */}
        {activePanel === 'variables' && (
          <div className="p-2 space-y-3">
            <div className="text-[10px] font-bold uppercase text-slate-500 px-1">Field Variables</div>

            {variableExpressions.length === 0 && (
              <div className="text-[11px] text-slate-600 text-center py-4 px-2">
                No fields defined yet.<br />Create fields in the Records tab.
              </div>
            )}

            <div className="space-y-1">
              {variableExpressions.map(v => (
                <button
                  key={v.key}
                  onClick={() => onInsertVariable(v.key)}
                  title={`Insert ${v.expr} into selected text element`}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 hover:bg-sky-500/5 transition-colors"
                >
                  <div className="text-[10px] text-slate-400">{v.label}</div>
                  <div className="text-[11px] font-mono text-sky-400">{v.expr}</div>
                </button>
              ))}
            </div>

            <div className="text-[10px] font-bold uppercase text-slate-500 px-1 pt-2 border-t border-slate-800/60">
              Expression Examples
            </div>
            <div className="space-y-1">
              {exampleExprs.map((ex, i) => (
                <div key={i} className="px-2.5 py-1.5 rounded-lg bg-slate-900/40 border border-slate-800/60">
                  <div className="text-[10px] text-slate-500">{ex.label}</div>
                  <div className="text-[10px] font-mono text-slate-400 break-all">{ex.expr}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HISTORY Panel */}
        {activePanel === 'history' && (
          <div className="p-2 space-y-0.5">
            <div className="text-[10px] font-bold uppercase text-slate-500 px-1 pb-1">
              History ({history.length})
            </div>
            {[...history].reverse().map((_, reversedIdx) => {
              const idx = history.length - 1 - reversedIdx;
              const isCurrent = idx === historyIndex;
              return (
                <button
                  key={idx}
                  onClick={() => onJumpToHistory(idx)}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] transition-colors ${
                    isCurrent
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                      : 'text-slate-500 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>State {idx + 1}</span>
                  {isCurrent && <span className="ml-auto text-[9px] text-sky-500 font-bold">NOW</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* UPLOADS / Assets panel */}
        {activePanel === 'uploads' && (
          <div className="p-2">
            <div className="text-[10px] font-bold uppercase text-slate-500 px-1 pb-2">Assets</div>
            <div className="border border-dashed border-slate-700 rounded-xl p-4 text-center text-[11px] text-slate-500">
              <Upload className="w-5 h-5 mx-auto mb-2 opacity-50" />
              Drag & drop images here.<br />
              Logos, seals, watermarks.
              <label className="block mt-3 cursor-pointer">
                <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-[11px] inline-block hover:bg-slate-700 transition-colors">
                  Browse Files
                </span>
                <input type="file" accept="image/*" className="hidden" />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
