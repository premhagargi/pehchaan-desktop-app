import React from 'react';
import { TemplateItem, RenderElement, ProjectItem } from '../../types';
import {
  Undo2,
  Redo2,
  Save,
  Check,
  Loader2,
  ChevronDown,
  Grid,
  Ruler,
  Crosshair,
  Eye,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  RotateCw,
  Copy,
  Trash2,
  ChevronsUp,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  ChevronsDown,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  Maximize,
  MonitorPlay,
  Layers
} from 'lucide-react';

interface DesignerTopBarProps {
  template: TemplateItem;
  activeSide: 'front' | 'back';
  onSetActiveSide: (s: 'front' | 'back') => void;
  selectedIds: string[];
  selectedElements: RenderElement[];
  elements: RenderElement[];
  onUpdateElements: (els: RenderElement[]) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSave: () => void;
  saveStatus: 'idle' | 'saving' | 'saved';
  zoom: number;
  onZoom: (z: number) => void;
  onZoomToFit: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showGuides: boolean;
  onToggleGuides: () => void;
  showRulers: boolean;
  onToggleRulers: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  onRotate: (deg: number) => void;
  onFlip: (axis: 'h' | 'v') => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onLayerMove: (action: 'front' | 'back' | 'up' | 'down') => void;
  onCardSizePreset: (w: number, h: number) => void;
  onUpdateTemplate: (t: TemplateItem) => void;
  lastAutoSave: Date | null;
  project: ProjectItem;
}

const ZOOM_LEVELS = [0.1, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0];

export const DesignerTopBar: React.FC<DesignerTopBarProps> = ({
  template, activeSide, onSetActiveSide,
  selectedIds, selectedElements, elements, onUpdateElements,
  onUndo, onRedo, canUndo, canRedo,
  onSave, saveStatus,
  zoom, onZoom, onZoomToFit,
  showGrid, onToggleGrid,
  showGuides, onToggleGuides,
  showRulers, onToggleRulers,
  snapToGrid, onToggleSnap,
  onRotate, onFlip,
  onDuplicate, onDelete,
  onLayerMove,
  onCardSizePreset, onUpdateTemplate,
  lastAutoSave, project
}) => {
  const hasSelection = selectedIds.length > 0;

  const selectedEl = selectedElements[0];
  const isLocked = selectedEl?.locked;

  const toggleLockSelected = () => {
    const map = new Map(selectedElements.map(el => [el.id, { ...el, locked: !el.locked }]));
    onUpdateElements(elements.map(el => map.get(el.id) || el));
  };

  return (
    <div className="flex items-center h-11 bg-[#0d1424] border-b border-slate-800/70 px-3 gap-2 shrink-0 overflow-x-auto">

      {/* App Name + Project */}
      <div className="flex items-center gap-2 mr-2 shrink-0">
        <span className="text-xs font-bold text-white font-display">Pehchaan</span>
        <span className="text-slate-600">/</span>
        <span className="text-xs text-slate-400 truncate max-w-[80px]">{project.name}</span>
      </div>

      <div className="h-5 w-px bg-slate-800 shrink-0" />

      {/* Card Side Toggle */}
      <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg shrink-0">
        <button
          onClick={() => onSetActiveSide('front')}
          className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
            activeSide === 'front' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >Front</button>
        <button
          onClick={() => onSetActiveSide('back')}
          className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
            activeSide === 'back' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >Back</button>
      </div>

      <div className="h-5 w-px bg-slate-800 shrink-0" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-5 w-px bg-slate-800 shrink-0" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => onZoom(Math.max(0.1, zoom - 0.1))}
          title="Zoom Out"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <select
          value={Math.round(zoom * 100)}
          onChange={e => onZoom(parseInt(e.target.value) / 100)}
          className="bg-slate-900 border border-slate-800 text-xs text-white rounded-lg px-1.5 py-0.5 w-16 text-center"
        >
          {[10, 25, 50, 75, 100, 125, 150, 200, 300, 400].map(z => (
            <option key={z} value={z}>{z}%</option>
          ))}
        </select>
        <button
          onClick={() => onZoom(Math.min(5, zoom + 0.1))}
          title="Zoom In"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onZoomToFit}
          title="Fit to Screen"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-5 w-px bg-slate-800 shrink-0" />

      {/* View toggles */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={onToggleGrid}
          title="Toggle Grid"
          className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
            showGrid ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' : 'text-slate-500 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onToggleSnap}
          title="Toggle Snap"
          className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
            snapToGrid ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' : 'text-slate-500 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onToggleRulers}
          title="Toggle Rulers"
          className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
            showRulers ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Ruler className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Object Controls (shown when something selected) */}
      {hasSelection && (
        <>
          <div className="h-5 w-px bg-slate-800 shrink-0" />
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={() => onRotate(-90)} title="Rotate Left 90°" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onRotate(90)} title="Rotate Right 90°" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onFlip('h')} title="Flip Horizontal" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onFlip('v')} title="Flip Vertical" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <FlipVertical className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-5 w-px bg-slate-800 shrink-0" />

          {/* Layer ordering */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={() => onLayerMove('front')} title="Bring to Front (Ctrl+Shift+])" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <ChevronsUp className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onLayerMove('up')} title="Bring Forward (Ctrl+])" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onLayerMove('down')} title="Send Backward (Ctrl+[)" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <ChevronDownIcon className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onLayerMove('back')} title="Send to Back (Ctrl+Shift+[)" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <ChevronsDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-5 w-px bg-slate-800 shrink-0" />

          {/* Duplicate / Lock / Delete */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={onDuplicate} title="Duplicate (Ctrl+D)" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button onClick={toggleLockSelected} title="Lock/Unlock" className={`p-1.5 rounded-lg transition-colors ${isLocked ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
            <button onClick={onDelete} title="Delete (Del)" className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Autosave status */}
      {lastAutoSave && (
        <span className="text-[10px] text-slate-600 shrink-0">
          Autosaved {lastAutoSave.toLocaleTimeString()}
        </span>
      )}

      {/* Save button */}
      <button
        onClick={onSave}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
          saveStatus === 'saved'
            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
            : saveStatus === 'saving'
            ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30'
            : 'bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20'
        }`}
      >
        {saveStatus === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {saveStatus === 'saved' && <Check className="w-3.5 h-3.5" />}
        {saveStatus === 'idle' && <Save className="w-3.5 h-3.5" />}
        {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save'}
      </button>
    </div>
  );
};
