import React, { useState, useEffect, useRef } from 'react';
import { RenderElement, TemplateItem, FieldDefinition, BarcodeSymbology } from '../../types';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Database01Icon,
  Tag01Icon,
  TextIcon,
  SquareIcon,
  CircleIcon,
  QrCodeIcon,
  Image01Icon,
  LockIcon,
  UnlockIcon,
  ViewIcon,
  ViewOffIcon,
  Delete02Icon,
  Copy01Icon,
  Scissor01Icon,
  AlignLeftIcon,
  AlignHorizontalCenterIcon,
  AlignRightIcon,
  AlignTopIcon,
  AlignVerticalCenterIcon,
  AlignBottomIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  ArrowUpDoubleIcon,
  ArrowDownDoubleIcon,
  PaintBrushIcon,
  Settings01Icon,
  Add01Icon,
  Tick01Icon,
  RotateRightIcon,
  SparklesIcon,
  Layers01Icon,
  ColorPickerIcon
} from '@hugeicons/core-free-icons';

interface DesignerContextMenuProps {
  x: number;
  y: number;
  selectedElements: RenderElement[];
  fields: FieldDefinition[];
  template: TemplateItem;
  clipboard: RenderElement[];
  onUpdateElement: (el: RenderElement) => void;
  onUpdateElements: (els: RenderElement[]) => void;
  onDelete: () => void;
  onDuplicate: (ids?: string[]) => void;
  onLayerMove: (action: 'front' | 'back' | 'up' | 'down') => void;
  onCopy: () => void;
  onPaste: () => void;
  onCut: () => void;
  onAddElement: (type: RenderElement['type'], extra?: Partial<RenderElement>) => void;
  onUpdateTemplate: (t: TemplateItem) => void;
  onClose: () => void;
}

const Icon: React.FC<{ icon: any; size?: number; className?: string }> = ({ icon, size = 14, className = '' }) => (
  <HugeiconsIcon icon={icon} size={size} className={className} />
);

const COLOR_SWATCHES = [
  '#ffffff', '#000000', '#38bdf8', '#3b82f6', '#6366f1',
  '#a855f7', '#ec4899', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#64748b', '#1e293b'
];

export const DesignerContextMenu: React.FC<DesignerContextMenuProps> = ({
  x, y,
  selectedElements,
  fields,
  template,
  clipboard,
  onUpdateElement,
  onUpdateElements,
  onDelete,
  onDuplicate,
  onLayerMove,
  onCopy,
  onPaste,
  onCut,
  onAddElement,
  onUpdateTemplate,
  onClose
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x, y });

  const el = selectedElements[0] || null;
  const isMulti = selectedElements.length > 1;

  const [activeTab, setActiveTab] = useState<'binding' | 'style' | 'transform'>(() => {
    if (el?.type === 'shape') return 'style';
    if (el?.type === 'image') return 'transform';
    return 'binding';
  });

  // Auto position inside viewport
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    let newX = Math.min(Math.max(12, x), Math.max(12, winW - rect.width - 12));
    let newY = Math.min(Math.max(12, y), Math.max(12, winH - rect.height - 12));

    setAdjustedPos({ x: newX, y: newY });
  }, [x, y]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const update = (patch: Partial<RenderElement>) => {
    if (!el) return;
    onUpdateElement({ ...el, ...patch });
  };

  const updateStyle = (patch: Partial<NonNullable<RenderElement['style']>>) => {
    if (!el) return;
    update({ style: { ...(el.style || {}), ...patch } });
  };

  // Align multi selection
  const align = (axis: 'x' | 'y', mode: 'min' | 'center' | 'max') => {
    if (selectedElements.length < 1) return;
    const updated = selectedElements.map(e => {
      if (axis === 'x') {
        const minX = Math.min(...selectedElements.map(x => x.x));
        const maxX = Math.max(...selectedElements.map(x => x.x + x.width));
        const centerX = (minX + maxX) / 2;
        return {
          ...e,
          x: mode === 'min' ? minX : mode === 'max' ? maxX - e.width : centerX - e.width / 2
        };
      } else {
        const minY = Math.min(...selectedElements.map(x => x.y));
        const maxY = Math.max(...selectedElements.map(x => x.y + x.height));
        const centerY = (minY + maxY) / 2;
        return {
          ...e,
          y: mode === 'min' ? minY : mode === 'max' ? maxY - e.height : centerY - e.height / 2
        };
      }
    });
    onUpdateElements(updated);
  };

  return (
    <div
      ref={menuRef}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
      className="fixed z-50 w-80 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-xl text-slate-200 text-xs overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      {/* ---------------- BACKGROUND / CANVAS CONTEXT MENU ---------------- */}
      {!el && (
        <div className="p-3 space-y-3 overflow-y-auto">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Icon icon={SparklesIcon} size={16} className="text-sky-400" />
            <span className="font-bold text-sky-300 uppercase tracking-wider text-[11px]">Canvas Options</span>
          </div>

          {/* Quick Add Elements */}
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1.5 flex items-center justify-between">
              <span>Add Element</span>
              <Icon icon={Add01Icon} size={12} className="text-slate-500" />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => { onAddElement('text'); onClose(); }}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/80 hover:bg-sky-600/30 border border-slate-700/60 text-slate-200 text-left transition-colors"
              >
                <Icon icon={TextIcon} size={16} className="text-sky-400 shrink-0" />
                <span>Text Box</span>
              </button>

              <button
                onClick={() => { onAddElement('shape', { shapeType: 'rect' }); onClose(); }}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/80 hover:bg-sky-600/30 border border-slate-700/60 text-slate-200 text-left transition-colors"
              >
                <Icon icon={SquareIcon} size={16} className="text-emerald-400 shrink-0" />
                <span>Rectangle</span>
              </button>

              <button
                onClick={() => { onAddElement('shape', { shapeType: 'circle' }); onClose(); }}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/80 hover:bg-sky-600/30 border border-slate-700/60 text-slate-200 text-left transition-colors"
              >
                <Icon icon={CircleIcon} size={16} className="text-amber-400 shrink-0" />
                <span>Circle</span>
              </button>

              <button
                onClick={() => { onAddElement('photo_placeholder'); onClose(); }}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/80 hover:bg-sky-600/30 border border-slate-700/60 text-slate-200 text-left transition-colors"
              >
                <Icon icon={Image01Icon} size={16} className="text-purple-400 shrink-0" />
                <span>Photo Frame</span>
              </button>

              <button
                onClick={() => { onAddElement('barcode', { barcode: { symbology: 'qrcode' } }); onClose(); }}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/80 hover:bg-sky-600/30 border border-slate-700/60 text-slate-200 text-left transition-colors col-span-2"
              >
                <Icon icon={QrCodeIcon} size={16} className="text-rose-400 shrink-0" />
                <span>Barcode / QR Code</span>
              </button>
            </div>
          </div>

          {/* Direct Dynamic Field Add */}
          {fields.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                <Icon icon={Database01Icon} size={13} className="text-sky-400" />
                <span>Add Dynamic Field Box</span>
              </div>
              <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
                {fields.map(f => (
                  <button
                    key={f.id}
                    onClick={() => {
                      if (f.type === 'PHOTO_REF') {
                        onAddElement('photo_placeholder', { binding: f.key, name: f.label });
                      } else {
                        onAddElement('text', {
                          binding: f.key,
                          text: `{{${f.key}}}`,
                          name: f.label
                        });
                      }
                      onClose();
                    }}
                    className="px-2 py-1 bg-sky-950/80 hover:bg-sky-600/40 border border-sky-700/50 rounded-md text-[10px] text-sky-200 transition-colors flex items-center gap-1"
                  >
                    <Icon icon={Add01Icon} size={10} />
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Canvas Background Color */}
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
              <Icon icon={PaintBrushIcon} size={13} className="text-sky-400" />
              <span>Canvas Background Color</span>
            </div>
            <div className="flex flex-wrap gap-1 items-center">
              {COLOR_SWATCHES.map(c => (
                <button
                  key={c}
                  onClick={() => onUpdateTemplate({ ...template, backgroundColor: c })}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full border border-slate-700 hover:scale-110 transition-transform ${template.backgroundColor === c ? 'ring-2 ring-sky-400 ring-offset-1 ring-offset-slate-900' : ''}`}
                />
              ))}
              <input
                type="color"
                value={template.backgroundColor || '#0f172a'}
                onChange={e => onUpdateTemplate({ ...template, backgroundColor: e.target.value })}
                className="w-6 h-6 rounded border border-slate-700 cursor-pointer bg-transparent p-0.5"
              />
            </div>
          </div>

          {/* Preset Card Sizes */}
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
              <Icon icon={Layers01Icon} size={13} className="text-sky-400" />
              <span>Card Size Preset</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {[
                { label: 'CR80 Landscape', w: 85.6, h: 53.98 },
                { label: 'CR80 Portrait', w: 53.98, h: 85.6 },
                { label: 'A6 Certificate', w: 148, h: 105 },
                { label: 'Badge 100×150', w: 100, h: 150 },
              ].map(p => (
                <button
                  key={p.label}
                  onClick={() => { onUpdateTemplate({ ...template, cardWidthMm: p.w, cardHeightMm: p.h }); onClose(); }}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 text-left flex items-center gap-1"
                >
                  <Icon icon={SquareIcon} size={12} className="text-slate-400 shrink-0" />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-800 flex gap-2">
            <button
              onClick={() => { onPaste(); onClose(); }}
              disabled={!clipboard.length}
              className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 flex items-center justify-center gap-1.5"
            >
              <Icon icon={Copy01Icon} size={14} />
              <span>Paste</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------- SINGLE OR MULTI ELEMENT CONTEXT MENU ---------------- */}
      {el && (
        <div className="flex flex-col max-h-[85vh]">
          {/* Header Bar */}
          <div className="flex items-center gap-2 p-2.5 bg-slate-950/80 border-b border-slate-800">
            <span className="font-bold text-sky-400 uppercase tracking-wider text-[11px] flex-1 truncate">
              {isMulti ? `${selectedElements.length} Objects Selected` : (el.name || el.type)}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => update({ locked: !el.locked })}
                title="Lock/Unlock"
                className={`p-1 rounded hover:bg-slate-800 ${el.locked ? 'text-amber-400' : 'text-slate-400'}`}
              >
                <Icon icon={el.locked ? LockIcon : UnlockIcon} size={14} />
              </button>
              <button
                onClick={() => update({ visible: el.visible === false ? true : false })}
                title="Toggle Visibility"
                className={`p-1 rounded hover:bg-slate-800 ${el.visible === false ? 'text-rose-400' : 'text-slate-400'}`}
              >
                <Icon icon={el.visible === false ? ViewOffIcon : ViewIcon} size={14} />
              </button>
              <button
                onClick={() => { onDuplicate(); onClose(); }}
                title="Duplicate"
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <Icon icon={Copy01Icon} size={14} />
              </button>
              <button
                onClick={() => { onDelete(); onClose(); }}
                title="Delete"
                disabled={!!el.locked}
                className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 disabled:opacity-30"
              >
                <Icon icon={Delete02Icon} size={14} />
              </button>
            </div>
          </div>

          {/* Quick Tab Headers */}
          {!isMulti && (
            <div className="flex border-b border-slate-800 bg-slate-900/50">
              <button
                onClick={() => setActiveTab('binding')}
                className={`flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1 border-b-2 transition-colors ${activeTab === 'binding' ? 'border-sky-500 text-sky-400 bg-sky-950/30' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                <Icon icon={Database01Icon} size={13} />
                <span>Field Binding</span>
              </button>
              <button
                onClick={() => setActiveTab('style')}
                className={`flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1 border-b-2 transition-colors ${activeTab === 'style' ? 'border-sky-500 text-sky-400 bg-sky-950/30' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                <Icon icon={PaintBrushIcon} size={13} />
                <span>Style</span>
              </button>
              <button
                onClick={() => setActiveTab('transform')}
                className={`flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1 border-b-2 transition-colors ${activeTab === 'transform' ? 'border-sky-500 text-sky-400 bg-sky-950/30' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                <Icon icon={Settings01Icon} size={13} />
                <span>Transform</span>
              </button>
            </div>
          )}

          {/* Scrollable Content Body */}
          <div className="p-3 space-y-3 overflow-y-auto max-h-[60vh]">

            {/* ------------ TAB 1: FIELD BINDING ------------ */}
            {(!isMulti && activeTab === 'binding') && (
              <div className="space-y-3">
                {/* Dynamic Field Selector */}
                <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1">
                      <Icon icon={Database01Icon} size={14} className="text-sky-400" />
                      Bind to Field
                    </span>
                    {el.binding && (
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-400/40 text-[9px] font-mono text-sky-300">
                        {el.binding}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => update({ binding: undefined })}
                      className={`px-2 py-1.5 rounded text-left text-[10px] border transition-colors col-span-2 flex items-center justify-between ${!el.binding ? 'bg-slate-800 border-sky-500 text-white font-medium' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Icon icon={TextIcon} size={12} className="text-slate-400" />
                        Static Text (No Binding)
                      </span>
                      {!el.binding && <Icon icon={Tick01Icon} size={14} className="text-sky-400" />}
                    </button>

                    {fields.length === 0 ? (
                      <div className="col-span-2 text-[10px] text-amber-300/90 bg-amber-950/40 p-2 rounded border border-amber-800/40">
                        No fields defined yet in this project. Add fields in Records / Import tab to bind variables.
                      </div>
                    ) : (
                      fields.map(f => {
                        const isSelected = el.binding === f.key;
                        return (
                          <button
                            key={f.id}
                            onClick={() => {
                              if (el.type === 'text' || el.type === 'barcode') {
                                update({
                                  binding: f.key,
                                  text: `{{${f.key}}}`,
                                  name: f.label
                                });
                              } else {
                                update({ binding: f.key, name: f.label });
                              }
                            }}
                            className={`px-2 py-1.5 rounded text-left text-[10px] border transition-all flex items-center justify-between gap-1 truncate ${isSelected ? 'bg-sky-600/30 border-sky-400 text-sky-200 font-semibold' : 'bg-slate-800/80 hover:bg-sky-900/40 border-slate-700/60 text-slate-300'}`}
                          >
                            <span className="truncate">{f.label}</span>
                            {isSelected && <Icon icon={Tick01Icon} size={14} className="text-sky-400 shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Insert Field Tag into Text */}
                {el.type === 'text' && fields.length > 0 && (
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1 flex items-center gap-1">
                      <Icon icon={Tag01Icon} size={12} className="text-sky-400" />
                      <span>Insert Field Tag</span>
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {fields.map(f => (
                        <button
                          key={f.id}
                          onClick={() => {
                            update({
                              text: (el.text || '') + `{{${f.key}}}`,
                              binding: undefined
                            });
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-sky-600/30 border border-slate-700 rounded text-[10px] text-slate-300 transition-colors flex items-center gap-1"
                        >
                          <Icon icon={Add01Icon} size={10} className="text-sky-400" />
                          <span>{`{{${f.key}}}`}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Text Content Editor */}
                {el.type === 'text' && (
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1 flex items-center gap-1">
                      <Icon icon={TextIcon} size={12} className="text-sky-400" />
                      <span>Text Expression / Template</span>
                    </label>
                    <textarea
                      rows={2}
                      value={el.text || ''}
                      onChange={e => update({ text: e.target.value, binding: undefined })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500 resize-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ------------ TAB 2: STYLE & TYPOGRAPHY ------------ */}
            {(!isMulti && activeTab === 'style') && (
              <div className="space-y-3">
                {/* Text Typography Controls */}
                {el.type === 'text' && (
                  <>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Font Size (pt)</label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[8, 10, 12, 14, 16, 18, 24, 32].map(sz => (
                          <button
                            key={sz}
                            onClick={() => updateStyle({ fontSize: sz })}
                            className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${(el.style?.fontSize || 8) === sz ? 'bg-sky-500/20 border-sky-400 text-sky-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                          >
                            {sz}
                          </button>
                        ))}
                        <input
                          type="number"
                          value={el.style?.fontSize || 8}
                          onChange={e => updateStyle({ fontSize: parseFloat(e.target.value) || 8 })}
                          className="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Font Family</label>
                      <select
                        value={el.style?.fontFamily || 'Inter'}
                        onChange={e => updateStyle({ fontFamily: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                      >
                        <option value="Inter">Inter</option>
                        <option value="Outfit">Outfit</option>
                        <option value="JetBrains Mono">JetBrains Mono</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Arial">Arial</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Verdana">Verdana</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                        {(['left', 'center', 'right'] as const).map(a => (
                          <button
                            key={a}
                            onClick={() => updateStyle({ align: a })}
                            className={`p-1.5 rounded transition-colors ${el.style?.align === a ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'}`}
                          >
                            {a === 'left' ? <Icon icon={AlignLeftIcon} size={15} /> : a === 'center' ? <Icon icon={AlignHorizontalCenterIcon} size={15} /> : <Icon icon={AlignRightIcon} size={15} />}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => updateStyle({ fontWeight: el.style?.fontWeight === 'bold' ? 'normal' : 'bold' })}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${el.style?.fontWeight === 'bold' ? 'border-sky-400 bg-sky-500/20 text-sky-300' : 'border-slate-700 bg-slate-950 text-slate-400'}`}
                      >
                        Bold B
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Text Color</label>
                      <div className="flex flex-wrap gap-1 items-center">
                        {COLOR_SWATCHES.map(c => (
                          <button
                            key={c}
                            onClick={() => updateStyle({ color: c })}
                            style={{ backgroundColor: c }}
                            className={`w-5 h-5 rounded-full border border-slate-700 hover:scale-110 transition-transform ${(el.style?.color || '#ffffff') === c ? 'ring-2 ring-sky-400 ring-offset-1 ring-offset-slate-900' : ''}`}
                          />
                        ))}
                        <input
                          type="color"
                          value={el.style?.color || '#ffffff'}
                          onChange={e => updateStyle({ color: e.target.value })}
                          className="w-6 h-6 rounded border border-slate-700 cursor-pointer bg-transparent p-0.5"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Appearance (Shapes & Photo Placeholder) */}
                {(el.type === 'shape' || el.type === 'photo_placeholder') && (
                  <>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Fill Color</label>
                      <div className="flex flex-wrap gap-1 items-center">
                        {COLOR_SWATCHES.map(c => (
                          <button
                            key={c}
                            onClick={() => update({ fill: c })}
                            style={{ backgroundColor: c }}
                            className={`w-5 h-5 rounded-full border border-slate-700 hover:scale-110 transition-transform ${(el.fill || '#1e293b') === c ? 'ring-2 ring-sky-400 ring-offset-1 ring-offset-slate-900' : ''}`}
                          />
                        ))}
                        <input
                          type="color"
                          value={el.fill || '#1e293b'}
                          onChange={e => update({ fill: e.target.value })}
                          className="w-6 h-6 rounded border border-slate-700 cursor-pointer bg-transparent p-0.5"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Border / Stroke Color</label>
                      <div className="flex flex-wrap gap-1 items-center">
                        {COLOR_SWATCHES.map(c => (
                          <button
                            key={c}
                            onClick={() => update({ stroke: c })}
                            style={{ backgroundColor: c }}
                            className={`w-5 h-5 rounded-full border border-slate-700 hover:scale-110 transition-transform ${(el.stroke || '#38bdf8') === c ? 'ring-2 ring-sky-400 ring-offset-1 ring-offset-slate-900' : ''}`}
                          />
                        ))}
                        <input
                          type="color"
                          value={el.stroke || '#38bdf8'}
                          onChange={e => update({ stroke: e.target.value })}
                          className="w-6 h-6 rounded border border-slate-700 cursor-pointer bg-transparent p-0.5"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Stroke Width (mm)</label>
                      <div className="flex items-center gap-1">
                        {[0, 0.25, 0.5, 1, 2].map(sw => (
                          <button
                            key={sw}
                            onClick={() => update({ strokeWidth: sw })}
                            className={`flex-1 py-1 rounded text-[10px] border transition-colors ${(el.strokeWidth || 0.5) === sw ? 'bg-sky-500/20 border-sky-400 text-sky-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                          >
                            {sw}mm
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Barcode Settings */}
                {el.type === 'barcode' && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Symbology</label>
                      <select
                        value={el.barcode?.symbology || 'qrcode'}
                        onChange={e => update({ barcode: { symbology: e.target.value as BarcodeSymbology, includeText: el.barcode?.includeText } })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
                      >
                        <option value="qrcode">QR Code</option>
                        <option value="code128">Code 128</option>
                        <option value="code39">Code 39</option>
                        <option value="ean13">EAN-13</option>
                        <option value="upca">UPC-A</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="incTextCtx"
                        checked={el.barcode?.includeText ?? false}
                        onChange={e => update({ barcode: { symbology: el.barcode?.symbology || 'qrcode', includeText: e.target.checked } })}
                        className="rounded"
                      />
                      <label htmlFor="incTextCtx" className="text-xs text-slate-300">Show Human-Readable Text</label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------ TAB 3: TRANSFORM & LAYERS ------------ */}
            {(!isMulti && activeTab === 'transform') && (
              <div className="space-y-3">
                {/* Numeric Position & Dimension inputs */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Position & Size (mm)</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-700">
                      <span className="text-slate-500 font-mono text-[10px]">X:</span>
                      <input
                        type="number" step="0.5"
                        value={Math.round(el.x * 10) / 10}
                        onChange={e => update({ x: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-700">
                      <span className="text-slate-500 font-mono text-[10px]">Y:</span>
                      <input
                        type="number" step="0.5"
                        value={Math.round(el.y * 10) / 10}
                        onChange={e => update({ y: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-700">
                      <span className="text-slate-500 font-mono text-[10px]">W:</span>
                      <input
                        type="number" step="0.5"
                        value={Math.round(el.width * 10) / 10}
                        onChange={e => update({ width: Math.max(1, parseFloat(e.target.value) || 1) })}
                        className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-700">
                      <span className="text-slate-500 font-mono text-[10px]">H:</span>
                      <input
                        type="number" step="0.5"
                        value={Math.round(el.height * 10) / 10}
                        onChange={e => update({ height: Math.max(1, parseFloat(e.target.value) || 1) })}
                        className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Rotation Presets */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1 flex items-center gap-1">
                    <Icon icon={RotateRightIcon} size={12} className="text-sky-400" />
                    <span>Rotation</span>
                  </label>
                  <div className="flex items-center gap-1">
                    {[0, 90, 180, 270].map(deg => (
                      <button
                        key={deg}
                        onClick={() => update({ rotation: deg })}
                        className={`flex-1 py-1 rounded text-[10px] border transition-colors ${(el.rotation || 0) === deg ? 'bg-sky-500/20 border-sky-400 text-sky-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>

                {/* Layer Ordering */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Layer Ordering</label>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <button
                      onClick={() => onLayerMove('front')}
                      className="flex items-center gap-1.5 p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
                    >
                      <Icon icon={ArrowUpDoubleIcon} size={14} className="text-sky-400" />
                      <span>Bring to Front</span>
                    </button>
                    <button
                      onClick={() => onLayerMove('up')}
                      className="flex items-center gap-1.5 p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
                    >
                      <Icon icon={ArrowUp01Icon} size={14} className="text-sky-400" />
                      <span>Bring Forward</span>
                    </button>
                    <button
                      onClick={() => onLayerMove('down')}
                      className="flex items-center gap-1.5 p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
                    >
                      <Icon icon={ArrowDown01Icon} size={14} className="text-sky-400" />
                      <span>Send Backward</span>
                    </button>
                    <button
                      onClick={() => onLayerMove('back')}
                      className="flex items-center gap-1.5 p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
                    >
                      <Icon icon={ArrowDownDoubleIcon} size={14} className="text-sky-400" />
                      <span>Send to Back</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ------------ MULTI SELECTION OPTIONS ------------ */}
            {isMulti && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Align Selected Objects</label>
                  <div className="grid grid-cols-3 gap-1">
                    <button onClick={() => align('x', 'min')} title="Align Left" className="p-2 bg-slate-800 border border-slate-700 rounded hover:bg-sky-950/40 hover:border-sky-500/50 flex items-center justify-center">
                      <Icon icon={AlignLeftIcon} size={16} className="text-slate-300" />
                    </button>
                    <button onClick={() => align('x', 'center')} title="Align Center" className="p-2 bg-slate-800 border border-slate-700 rounded hover:bg-sky-950/40 hover:border-sky-500/50 flex items-center justify-center">
                      <Icon icon={AlignHorizontalCenterIcon} size={16} className="text-slate-300" />
                    </button>
                    <button onClick={() => align('x', 'max')} title="Align Right" className="p-2 bg-slate-800 border border-slate-700 rounded hover:bg-sky-950/40 hover:border-sky-500/50 flex items-center justify-center">
                      <Icon icon={AlignRightIcon} size={16} className="text-slate-300" />
                    </button>
                    <button onClick={() => align('y', 'min')} title="Align Top" className="p-2 bg-slate-800 border border-slate-700 rounded hover:bg-sky-950/40 hover:border-sky-500/50 flex items-center justify-center">
                      <Icon icon={AlignTopIcon} size={16} className="text-slate-300" />
                    </button>
                    <button onClick={() => align('y', 'center')} title="Align Middle" className="p-2 bg-slate-800 border border-slate-700 rounded hover:bg-sky-950/40 hover:border-sky-500/50 flex items-center justify-center">
                      <Icon icon={AlignVerticalCenterIcon} size={16} className="text-slate-300" />
                    </button>
                    <button onClick={() => align('y', 'max')} title="Align Bottom" className="p-2 bg-slate-800 border border-slate-700 rounded hover:bg-sky-950/40 hover:border-sky-500/50 flex items-center justify-center">
                      <Icon icon={AlignBottomIcon} size={16} className="text-slate-300" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Layer Ordering</label>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <button onClick={() => onLayerMove('front')} className="flex items-center gap-1.5 p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300">
                      <Icon icon={ArrowUpDoubleIcon} size={14} className="text-sky-400" />
                      <span>Bring to Front</span>
                    </button>
                    <button onClick={() => onLayerMove('back')} className="flex items-center gap-1.5 p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300">
                      <Icon icon={ArrowDownDoubleIcon} size={14} className="text-sky-400" />
                      <span>Send to Back</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="p-2 bg-slate-950 border-t border-slate-800 grid grid-cols-4 gap-1">
            <button
              onClick={() => { onCopy(); onClose(); }}
              className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center gap-1 text-[10px]"
              title="Copy"
            >
              <Icon icon={Copy01Icon} size={12} />
              <span>Copy</span>
            </button>

            <button
              onClick={() => { onCut(); onClose(); }}
              className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center gap-1 text-[10px]"
              title="Cut"
            >
              <Icon icon={Scissor01Icon} size={12} />
              <span>Cut</span>
            </button>

            <button
              onClick={() => { onDuplicate(); onClose(); }}
              className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center gap-1 text-[10px]"
              title="Duplicate"
            >
              <Icon icon={Add01Icon} size={12} />
              <span>Duplicate</span>
            </button>

            <button
              onClick={() => { onDelete(); onClose(); }}
              className="py-1 rounded bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 flex items-center justify-center gap-1 text-[10px]"
              title="Delete"
            >
              <Icon icon={Delete02Icon} size={12} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
