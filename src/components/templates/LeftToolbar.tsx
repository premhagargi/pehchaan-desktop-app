import React from 'react';
import { ActiveTool } from './DesignerPanel';
import { RenderElement } from '../../types';
import {
  MousePointer2,
  Hand,
  Type,
  Image,
  Square,
  Circle,
  Minus,
  QrCode,
  UserSquare,
  Variable,
  Layers,
  Grid,
  ZoomIn,
  ScanLine,
  PenLine,
  Star,
  Triangle
} from 'lucide-react';

interface LeftToolbarProps {
  activeTool: ActiveTool;
  onSetTool: (t: ActiveTool) => void;
  onAddElement: (type: RenderElement['type'], extra?: Partial<RenderElement>) => void;
}

interface ToolItem {
  key: ActiveTool;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  onClick?: () => void;
}

export const LeftToolbar: React.FC<LeftToolbarProps> = ({ activeTool, onSetTool, onAddElement }) => {
  const tools: ToolItem[] = [
    { key: 'select', label: 'Select (V)', icon: <MousePointer2 className="w-4 h-4" />, shortcut: 'V' },
    { key: 'pan', label: 'Pan (H)', icon: <Hand className="w-4 h-4" />, shortcut: 'H' },
  ];

  const addTools = [
    {
      label: 'Text (T)',
      icon: <Type className="w-4 h-4" />,
      shortcut: 'T',
      onClick: () => { onAddElement('text'); }
    },
    {
      label: 'Rectangle (R)',
      icon: <Square className="w-4 h-4" />,
      shortcut: 'R',
      onClick: () => { onAddElement('shape', { shapeType: 'rect' }); }
    },
    {
      label: 'Circle (O)',
      icon: <Circle className="w-4 h-4" />,
      shortcut: 'O',
      onClick: () => { onAddElement('shape', { shapeType: 'circle' }); }
    },
    {
      label: 'Line',
      icon: <Minus className="w-4 h-4" />,
      onClick: () => { onAddElement('shape', { shapeType: 'rect', height: 1, width: 40, fill: 'transparent', stroke: '#ffffff', strokeWidth: 0.5 }); }
    },
    {
      label: 'Photo Placeholder',
      icon: <UserSquare className="w-4 h-4" />,
      onClick: () => { onAddElement('photo_placeholder'); }
    },
    {
      label: 'QR Code',
      icon: <QrCode className="w-4 h-4" />,
      onClick: () => { onAddElement('barcode', { barcode: { symbology: 'qrcode', includeText: false }, text: '{{roll_no}}' }); }
    },
    {
      label: 'Barcode (Code128)',
      icon: <ScanLine className="w-4 h-4" />,
      onClick: () => { onAddElement('barcode', { barcode: { symbology: 'code128', includeText: true }, text: '{{roll_no}}', height: 15, width: 40 }); }
    },
    {
      label: 'Image / Logo',
      icon: <Image className="w-4 h-4" />,
      onClick: () => { onAddElement('image'); }
    },
  ];

  return (
    <div className="w-12 bg-[#0d1424] border-r border-slate-800/60 flex flex-col items-center py-2 gap-0.5 overflow-y-auto z-10">
      {/* Selection tools */}
      <div className="flex flex-col items-center gap-0.5 pb-2 border-b border-slate-800/60 w-full px-1">
        {tools.map(tool => (
          <button
            key={tool.key}
            onClick={() => onSetTool(tool.key)}
            title={tool.label}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all relative group ${
              activeTool === tool.key
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {tool.icon}
            <div className="absolute left-full ml-2 bg-slate-900 border border-slate-700 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {tool.label}
            </div>
          </button>
        ))}
      </div>

      {/* Divider label */}
      <div className="text-[8px] text-slate-600 font-bold uppercase tracking-wider pt-1 pb-1">Add</div>

      {/* Add element tools */}
      <div className="flex flex-col items-center gap-0.5 w-full px-1">
        {addTools.map((tool, i) => (
          <button
            key={i}
            onClick={tool.onClick}
            title={tool.label}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all relative group"
          >
            {tool.icon}
            <div className="absolute left-full ml-2 bg-slate-900 border border-slate-700 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {tool.label}
            </div>
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom tools */}
      <div className="flex flex-col items-center gap-0.5 w-full px-1 pt-2 border-t border-slate-800/60">
        <button
          title="Grid"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white transition-all group relative"
        >
          <Grid className="w-4 h-4" />
        </button>
        <button
          title="Zoom"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white transition-all group relative"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
