import React from 'react';
import { RenderElement, FieldDefinition, BarcodeSymbology } from '../../types';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Layers
} from 'lucide-react';

interface ElementInspectorProps {
  element: RenderElement | null;
  fields: FieldDefinition[];
  onChange: (updated: RenderElement) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveLayer: (direction: 'up' | 'down' | 'top' | 'bottom') => void;
}

export const ElementInspector: React.FC<ElementInspectorProps> = ({
  element,
  fields,
  onChange,
  onDelete,
  onDuplicate,
  onMoveLayer,
}) => {
  if (!element) {
    return (
      <div className="glass-panel p-6 rounded-2xl text-center text-slate-500 text-xs">
        <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
        Select an element on the canvas to inspect & edit properties.
      </div>
    );
  }

  const updateProp = (key: string, val: any) => {
    onChange({ ...element, [key]: val });
  };

  const updateStyle = (styleKey: string, val: any) => {
    onChange({
      ...element,
      style: { ...(element.style || {}), [styleKey]: val },
    });
  };

  return (
    <div className="glass-panel p-5 rounded-2xl space-y-4 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
          {element.type} Property Inspector
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onDuplicate}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title="Duplicate Element"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
            title="Delete Element"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Position & Size (mm) */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="block text-[10px] text-slate-400 mb-0.5">X Pos (mm)</label>
          <input
            type="number"
            step="0.5"
            value={element.x}
            onChange={(e) => updateProp('x', parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 mb-0.5">Y Pos (mm)</label>
          <input
            type="number"
            step="0.5"
            value={element.y}
            onChange={(e) => updateProp('y', parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 mb-0.5">Width (mm)</label>
          <input
            type="number"
            step="0.5"
            value={element.width}
            onChange={(e) => updateProp('width', parseFloat(e.target.value) || 1)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 mb-0.5">Height (mm)</label>
          <input
            type="number"
            step="0.5"
            value={element.height}
            onChange={(e) => updateProp('height', parseFloat(e.target.value) || 1)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white"
          />
        </div>
      </div>

      {/* Dynamic Field Variable Binding */}
      {(element.type === 'text' || element.type === 'photo_placeholder' || element.type === 'barcode') && (
        <div className="pt-2 border-t border-slate-800/80">
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Data Variable Binding
          </label>
          <select
            value={element.binding || ''}
            onChange={(e) => updateProp('binding', e.target.value || null)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
          >
            <option value="">-- Static Value (No Binding) --</option>
            {fields.map((f) => (
              <option key={f.id} value={f.key}>
                {f.label} ({`{{${f.key}}}`})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Text Specific Options */}
      {element.type === 'text' && (
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          {!element.binding && (
            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">Text Content (Supports {"{{var}}"})</label>
              <textarea
                rows={2}
                value={element.text || ''}
                onChange={(e) => updateProp('text', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white resize-none"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">Font Size (pt)</label>
              <input
                type="number"
                value={element.style?.fontSize || 8}
                onChange={(e) => updateStyle('fontSize', parseFloat(e.target.value) || 8)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">Font Family</label>
              <select
                value={element.style?.fontFamily || 'Inter'}
                onChange={(e) => updateStyle('fontFamily', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
              >
                <option value="Inter">Inter (Sans)</option>
                <option value="Outfit">Outfit (Display)</option>
                <option value="JetBrains Mono">JetBrains (Mono)</option>
                <option value="Times">Times Roman (Serif)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => updateStyle('align', 'left')}
                className={`p-1 rounded ${element.style?.align === 'left' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'}`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => updateStyle('align', 'center')}
                className={`p-1 rounded ${element.style?.align === 'center' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'}`}
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => updateStyle('align', 'right')}
                className={`p-1 rounded ${element.style?.align === 'right' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'}`}
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => updateStyle('fontWeight', element.style?.fontWeight === 'bold' ? 'normal' : 'bold')}
              className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 ${
                element.style?.fontWeight === 'bold' ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-slate-800 text-slate-400'
              }`}
            >
              <Bold className="w-3.5 h-3.5" /> Bold
            </button>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Text Color</label>
            <input
              type="color"
              value={element.style?.color || '#ffffff'}
              onChange={(e) => updateStyle('color', e.target.value)}
              className="w-full h-8 bg-slate-950 border border-slate-800 rounded-lg p-0.5 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Barcode Options */}
      {element.type === 'barcode' && (
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <label className="block text-xs font-semibold text-slate-300">Barcode Symbology</label>
          <select
            value={element.barcode?.symbology || 'qrcode'}
            onChange={(e) =>
              onChange({
                ...element,
                barcode: { ...(element.barcode || { symbology: 'qrcode' }), symbology: e.target.value as BarcodeSymbology },
              })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
          >
            <option value="qrcode">QR Code</option>
            <option value="code128">Code 128</option>
            <option value="code39">Code 39</option>
            <option value="ean13">EAN-13</option>
          </select>
        </div>
      )}

      {/* Shape Fill & Stroke */}
      {(element.type === 'shape' || element.type === 'photo_placeholder') && (
        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Fill Color</label>
            <input
              type="color"
              value={element.fill || '#1e293b'}
              onChange={(e) => updateProp('fill', e.target.value)}
              className="w-full h-8 bg-slate-950 border border-slate-800 rounded-lg p-0.5 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Stroke Color</label>
            <input
              type="color"
              value={element.stroke || '#38bdf8'}
              onChange={(e) => updateProp('stroke', e.target.value)}
              className="w-full h-8 bg-slate-950 border border-slate-800 rounded-lg p-0.5 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Layer Controls */}
      <div className="pt-3 border-t border-slate-800/80">
        <label className="block text-[10px] text-slate-400 mb-1.5 uppercase font-bold tracking-wider">
          Layer Ordering
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onMoveLayer('up')}
            className="py-1 px-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center justify-center gap-1"
          >
            <ArrowUp className="w-3.5 h-3.5" /> Move Up
          </button>
          <button
            type="button"
            onClick={() => onMoveLayer('down')}
            className="py-1 px-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center justify-center gap-1"
          >
            <ArrowDown className="w-3.5 h-3.5" /> Move Down
          </button>
        </div>
      </div>
    </div>
  );
};
