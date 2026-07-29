import React from 'react';
import { RenderElement, TemplateItem, FieldDefinition } from '../../types';
import { BarcodeSymbology } from '../../types';
import {
  AlignLeft, AlignCenter, AlignRight,
  AlignVerticalJustifyStart, AlignVerticalSpaceAround, AlignVerticalJustifyEnd,
  Columns, Rows, Lock, Unlock, Eye, EyeOff, Trash2, Copy
} from 'lucide-react';

interface RightPropertyPanelProps {
  selectedElements: RenderElement[];
  allElements: RenderElement[];
  fields: FieldDefinition[];
  onUpdateElement: (el: RenderElement) => void;
  onUpdateElements: (els: RenderElement[]) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onLayerMove: (action: 'front' | 'back' | 'up' | 'down') => void;
  template: TemplateItem;
  onUpdateTemplate: (t: TemplateItem) => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="border-b border-slate-800/60 p-3">
    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2">{title}</div>
    {children}
  </div>
);

const NumInput: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
}> = ({ label, value, onChange, step = 0.5, min, max, unit }) => (
  <div className="flex flex-col gap-0.5">
    <label className="text-[9px] text-slate-500 uppercase">{label}</label>
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={Math.round(value * 10) / 10}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        step={step}
        min={min}
        max={max}
        className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-white focus:outline-none focus:border-sky-500"
      />
      {unit && <span className="text-[9px] text-slate-600 shrink-0">{unit}</span>}
    </div>
  </div>
);

export const RightPropertyPanel: React.FC<RightPropertyPanelProps> = ({
  selectedElements, allElements, fields,
  onUpdateElement, onUpdateElements,
  onDelete, onDuplicate, onLayerMove,
  template, onUpdateTemplate
}) => {
  const el = selectedElements[0] || null;
  const multi = selectedElements.length > 1;

  const update = (patch: Partial<RenderElement>) => {
    if (!el) return;
    onUpdateElement({ ...el, ...patch });
  };

  const updateStyle = (patch: Partial<NonNullable<RenderElement['style']>>) => {
    if (!el) return;
    update({ style: { ...(el.style || {}), ...patch } });
  };

  const updateBarcode = (patch: Partial<NonNullable<RenderElement['barcode']>>) => {
    if (!el) return;
    update({ barcode: { symbology: 'qrcode', ...(el.barcode || {}), ...patch } });
  };

  // Multi-select alignment
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

  if (!el) {
    return (
      <div className="w-56 bg-[#0d1424] border-l border-slate-800/60 flex flex-col">
        {/* Canvas Properties */}
        <Section title="Canvas">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <NumInput label="Width" value={template.cardWidthMm} onChange={w => onUpdateTemplate({ ...template, cardWidthMm: w })} unit="mm" />
              <NumInput label="Height" value={template.cardHeightMm} onChange={h => onUpdateTemplate({ ...template, cardHeightMm: h })} unit="mm" />
            </div>

            <div>
              <label className="text-[9px] text-slate-500 uppercase block mb-1">Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={template.backgroundColor || '#0f172a'}
                  onChange={e => onUpdateTemplate({ ...template, backgroundColor: e.target.value })}
                  className="w-8 h-7 bg-slate-950 border border-slate-800 rounded cursor-pointer p-0.5"
                />
                <span className="text-[11px] font-mono text-slate-400">{template.backgroundColor || '#0f172a'}</span>
              </div>
            </div>

            <div>
              <label className="text-[9px] text-slate-500 uppercase block mb-1">Presets</label>
              <div className="grid grid-cols-1 gap-1">
                {[
                  { label: 'CR80 ID (Landscape)', w: 85.6, h: 53.98 },
                  { label: 'CR80 ID (Portrait)', w: 53.98, h: 85.6 },
                  { label: 'A6 Certificate', w: 148, h: 105 },
                  { label: 'A5 Certificate', w: 210, h: 148 },
                  { label: 'Badge 100×150mm', w: 100, h: 150 },
                ].map(p => (
                  <button
                    key={p.label}
                    onClick={() => onUpdateTemplate({ ...template, cardWidthMm: p.w, cardHeightMm: p.h })}
                    className="text-left text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-sky-500/50 text-slate-300 transition-colors"
                  >
                    {p.label}
                    <span className="block text-[9px] text-slate-600">{p.w}×{p.h}mm</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <div className="p-3 text-[11px] text-slate-600 text-center">
          Select an element to edit its properties.
        </div>
      </div>
    );
  }

  return (
    <div className="w-56 bg-[#0d1424] border-l border-slate-800/60 flex flex-col overflow-y-auto">

      {/* Element actions */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-800/60">
        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex-1">{el.name || el.type}</span>
        <button onClick={onDuplicate} title="Duplicate" className="p-1 text-slate-400 hover:text-white"><Copy className="w-3.5 h-3.5" /></button>
        <button onClick={() => update({ locked: !el.locked })} title="Lock" className={`p-1 ${el.locked ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}>
          {el.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
        <button onClick={() => update({ visible: el.visible === false ? true : false })} title="Visibility" className={`p-1 ${el.visible === false ? 'text-rose-400' : 'text-slate-400 hover:text-white'}`}>
          {el.visible === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
        <button onClick={onDelete} title="Delete" disabled={!!el.locked} className="p-1 text-slate-400 hover:text-red-400 disabled:opacity-30"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>

      {/* Transform */}
      <Section title="Transform">
        <div className="grid grid-cols-2 gap-2">
          <NumInput label="X" value={el.x} onChange={v => update({ x: v })} unit="mm" />
          <NumInput label="Y" value={el.y} onChange={v => update({ y: v })} unit="mm" />
          <NumInput label="W" value={el.width} onChange={v => update({ width: Math.max(1, v) })} unit="mm" />
          <NumInput label="H" value={el.height} onChange={v => update({ height: Math.max(1, v) })} unit="mm" />
          <NumInput label="Rotation" value={el.rotation || 0} onChange={v => update({ rotation: v })} unit="°" step={1} />
          <NumInput label="Opacity" value={(el.opacity ?? 1) * 100} onChange={v => update({ opacity: Math.max(0, Math.min(1, v / 100)) })} unit="%" min={0} max={100} />
        </div>
      </Section>

      {/* Multi-selection alignment */}
      {selectedElements.length > 1 && (
        <Section title={`Align ${selectedElements.length} Objects`}>
          <div className="grid grid-cols-3 gap-1">
            <button onClick={() => align('x', 'min')} title="Align Left" className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:border-sky-500/50 flex items-center justify-center">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button onClick={() => align('x', 'center')} title="Align Center" className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:border-sky-500/50 flex items-center justify-center">
              <AlignCenter className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button onClick={() => align('x', 'max')} title="Align Right" className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:border-sky-500/50 flex items-center justify-center">
              <AlignRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button onClick={() => align('y', 'min')} title="Align Top" className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:border-sky-500/50 flex items-center justify-center">
              <AlignVerticalJustifyStart className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button onClick={() => align('y', 'center')} title="Align Middle" className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:border-sky-500/50 flex items-center justify-center">
              <AlignVerticalSpaceAround className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button onClick={() => align('y', 'max')} title="Align Bottom" className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:border-sky-500/50 flex items-center justify-center">
              <AlignVerticalJustifyEnd className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </Section>
      )}

      {/* Fill & Stroke (shapes) */}
      {(el.type === 'shape' || el.type === 'photo_placeholder') && (
        <Section title="Appearance">
          <div className="space-y-2">
            <div>
              <label className="text-[9px] text-slate-500 uppercase block mb-1">Fill Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={el.fill || '#1e293b'} onChange={e => update({ fill: e.target.value })}
                  className="w-8 h-6 bg-slate-950 border border-slate-800 rounded cursor-pointer p-0.5" />
                <input type="text" value={el.fill || '#1e293b'} onChange={e => update({ fill: e.target.value })}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] font-mono text-white focus:outline-none focus:border-sky-500" />
              </div>
            </div>
            <div>
              <label className="text-[9px] text-slate-500 uppercase block mb-1">Stroke Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={el.stroke || '#38bdf8'} onChange={e => update({ stroke: e.target.value })}
                  className="w-8 h-6 bg-slate-950 border border-slate-800 rounded cursor-pointer p-0.5" />
                <input type="text" value={el.stroke || '#38bdf8'} onChange={e => update({ stroke: e.target.value })}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] font-mono text-white focus:outline-none focus:border-sky-500" />
              </div>
            </div>
            <NumInput label="Stroke Width" value={el.strokeWidth || 0.5} onChange={v => update({ strokeWidth: v })} unit="mm" step={0.1} min={0} />
          </div>
        </Section>
      )}

      {/* Text Properties */}
      {el.type === 'text' && (
        <>
          <Section title="Data Binding">
            <div className="space-y-2">
              <div>
                <label className="text-[9px] text-slate-500 uppercase block mb-1">Variable Binding</label>
                <select
                  value={el.binding || ''}
                  onChange={e => update({ binding: e.target.value || undefined, text: e.target.value ? `{{${e.target.value}}}` : el.text })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">-- Static Text --</option>
                  {fields.map(f => <option key={f.id} value={f.key}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] text-slate-500 uppercase block mb-1">
                  Text / Template (use {'{{field}}'})</label>
                <textarea
                  rows={2}
                  value={el.text || ''}
                  onChange={e => update({ text: e.target.value, binding: undefined })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-white focus:outline-none focus:border-sky-500 resize-none font-mono"
                />
              </div>
            </div>
          </Section>
          <Section title="Typography">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <NumInput label="Size" value={el.style?.fontSize || 8} onChange={v => updateStyle({ fontSize: v })} unit="pt" step={0.5} min={4} />
              </div>
              <div>
                <label className="text-[9px] text-slate-500 uppercase block mb-1">Font Family</label>
                <select
                  value={el.style?.fontFamily || 'Inter'}
                  onChange={e => updateStyle({ fontFamily: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-white"
                >
                  <option>Inter</option>
                  <option>Outfit</option>
                  <option>JetBrains Mono</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option>Arial</option>
                  <option>Georgia</option>
                  <option>Verdana</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] text-slate-500 uppercase block mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={el.style?.color || '#ffffff'} onChange={e => updateStyle({ color: e.target.value })}
                    className="w-8 h-6 bg-slate-950 border border-slate-800 rounded cursor-pointer p-0.5" />
                  <input type="text" value={el.style?.color || '#ffffff'} onChange={e => updateStyle({ color: e.target.value })}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] font-mono text-white focus:outline-none focus:border-sky-500" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
                  {(['left', 'center', 'right'] as const).map(align => (
                    <button key={align} onClick={() => updateStyle({ align })}
                      className={`p-1.5 rounded text-[10px] capitalize transition-colors ${el.style?.align === align ? 'bg-sky-500/20 text-sky-400' : 'text-slate-500'}`}>
                      {align === 'left' ? <AlignLeft className="w-3 h-3" /> : align === 'center' ? <AlignCenter className="w-3 h-3" /> : <AlignRight className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => updateStyle({ fontWeight: el.style?.fontWeight === 'bold' ? 'normal' : 'bold' })}
                  className={`px-2 py-1 rounded border text-[10px] font-bold transition-colors ${el.style?.fontWeight === 'bold' ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-slate-800 text-slate-500'}`}
                >
                  B
                </button>
              </div>
            </div>
          </Section>
        </>
      )}

      {/* Barcode Properties */}
      {el.type === 'barcode' && (
        <>
          <Section title="Barcode / QR Settings">
            <div className="space-y-2">
              <div>
                <label className="text-[9px] text-slate-500 uppercase block mb-1">Symbology</label>
                <select
                  value={el.barcode?.symbology || 'qrcode'}
                  onChange={e => updateBarcode({ symbology: e.target.value as BarcodeSymbology })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-white"
                >
                  <option value="qrcode">QR Code</option>
                  <option value="code128">Code 128</option>
                  <option value="code39">Code 39</option>
                  <option value="ean13">EAN-13</option>
                  <option value="upca">UPC-A</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] text-slate-500 uppercase block mb-1">Value / Expression Template</label>
                <textarea
                  rows={2}
                  value={el.text || ''}
                  onChange={e => update({ text: e.target.value, binding: undefined })}
                  placeholder="{{roll_no}} or ID-{{student_id}}"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeText"
                  checked={el.barcode?.includeText ?? false}
                  onChange={e => updateBarcode({ includeText: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="includeText" className="text-[11px] text-slate-300">Show Human-Readable Text</label>
              </div>
              <div>
                <label className="text-[9px] text-slate-500 uppercase block mb-1">Single Field Binding</label>
                <select
                  value={el.binding || ''}
                  onChange={e => update({ binding: e.target.value || undefined, text: e.target.value ? `{{${e.target.value}}}` : el.text })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-white"
                >
                  <option value="">-- Use Expression Above --</option>
                  {fields.map(f => <option key={f.id} value={f.key}>{f.label}</option>)}
                </select>
              </div>
            </div>
          </Section>
        </>
      )}

      {/* Photo placeholder */}
      {el.type === 'photo_placeholder' && (
        <Section title="Photo Frame">
          <div>
            <label className="text-[9px] text-slate-500 uppercase block mb-1">Bind to Field</label>
            <select
              value={el.binding || ''}
              onChange={e => update({ binding: e.target.value || undefined })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-white"
            >
              <option value="">-- No Binding --</option>
              {fields.map(f => <option key={f.id} value={f.key}>{f.label}</option>)}
            </select>
          </div>
        </Section>
      )}
    </div>
  );
};
