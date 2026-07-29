import React, { useState, useEffect, useCallback } from 'react';
import { ProjectItem, TemplateItem, RenderElement, ReferenceImageConfig } from '../../types';
import { db } from '../../services/db';
import { CanvasEditor } from './CanvasEditor';
import { ElementInspector } from './ElementInspector';
import { AlignmentToolbar } from './AlignmentToolbar';
import { LayersPanel } from './LayersPanel';
import { ReferenceImagePanel } from './ReferenceImagePanel';
import {
  Layout,
  Type,
  Image,
  QrCode,
  Square,
  Circle as CircleIcon,
  Save,
  Check,
  Undo2,
  Redo2,
  Grid,
  Magnet,
  Crosshair,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';

interface TemplatesPanelProps {
  project: ProjectItem;
  onRefresh: () => void;
}

const MAX_HISTORY_LIMIT = 100;

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({ project, onRefresh }) => {
  const templates = db.getTemplates(project.id);
  const fields = db.getFields(project.id);
  const records = db.getRecords(project.id);
  const photos = db.getPhotos(project.id);

  const [activeTemplate, setActiveTemplate] = useState<TemplateItem>(
    templates[0] || {
      id: 'tmpl_' + Math.random().toString(36).substring(2, 9),
      projectId: project.id,
      name: 'Default Card Template',
      cardWidthMm: 85.6,
      cardHeightMm: 53.98,
      dpi: 300,
      backgroundColor: '#0f172a',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sceneGraph: [],
    }
  );

  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<RenderElement[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  // Designer Grid & View State
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [snapToObjects, setSnapToObjects] = useState(true);
  const [gridSpacingPx, setGridSpacingPx] = useState(10);
  const [zoom, setZoom] = useState(1);

  // Undo / Redo Stack (Limit 100)
  const [history, setHistory] = useState<TemplateItem[]>([activeTemplate]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const pushHistory = useCallback(
    (newTemplate: TemplateItem) => {
      setHistory((prevHistory) => {
        const sliced = prevHistory.slice(0, historyIndex + 1);
        sliced.push(newTemplate);
        if (sliced.length > MAX_HISTORY_LIMIT) sliced.shift();
        return sliced;
      });
      setHistoryIndex((prevIndex) => Math.min(prevIndex + 1, MAX_HISTORY_LIMIT - 1));
      setActiveTemplate(newTemplate);
      setIsSaved(false);
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setActiveTemplate(history[nextIdx]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setActiveTemplate(history[nextIdx]);
    }
  }, [historyIndex, history]);

  const currentElements = activeSide === 'front' ? activeTemplate.sceneGraph : activeTemplate.sceneGraphBack || [];
  const currentRefImage = activeSide === 'front' ? activeTemplate.referenceImageFront : activeTemplate.referenceImageBack;

  const setElements = (elements: RenderElement[]) => {
    let nextTemplate: TemplateItem;
    if (activeSide === 'front') {
      nextTemplate = { ...activeTemplate, sceneGraph: elements };
    } else {
      nextTemplate = { ...activeTemplate, sceneGraphBack: elements };
    }
    pushHistory(nextTemplate);
  };

  const setReferenceImage = (refImg?: ReferenceImageConfig) => {
    let nextTemplate: TemplateItem;
    if (activeSide === 'front') {
      nextTemplate = { ...activeTemplate, referenceImageFront: refImg };
    } else {
      nextTemplate = { ...activeTemplate, referenceImageBack: refImg };
    }
    pushHistory(nextTemplate);
  };

  const handleSave = () => {
    db.saveTemplate(project.id, activeTemplate);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    onRefresh();
  };

  // Select element handler
  const handleSelectElement = (id: string | null, isShift = false) => {
    if (!id) {
      setSelectedElementIds([]);
      return;
    }
    if (isShift) {
      setSelectedElementIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setSelectedElementIds([id]);
    }
  };

  const handleSelectMultipleElements = (ids: string[]) => {
    setSelectedElementIds(ids);
  };

  // Add Element
  const addElement = (type: RenderElement['type'], shapeType?: 'rect' | 'circle') => {
    const id = 'el_' + Math.random().toString(36).substring(2, 8);
    let newEl: RenderElement;

    if (type === 'text') {
      newEl = {
        id,
        name: 'New Text Variable',
        type: 'text',
        x: 10,
        y: 10,
        width: 40,
        height: 8,
        rotation: 0,
        opacity: 1,
        text: 'New Text',
        style: { fontSize: 8, fontFamily: 'Inter', color: '#ffffff', align: 'left' },
      };
    } else if (type === 'photo_placeholder') {
      newEl = {
        id,
        name: 'Photo Frame',
        type: 'photo_placeholder',
        x: 10,
        y: 10,
        width: 25,
        height: 30,
        rotation: 0,
        opacity: 1,
        fill: '#1e293b',
        stroke: '#38bdf8',
        strokeWidth: 0.5,
        binding: 'photo',
      };
    } else if (type === 'barcode') {
      newEl = {
        id,
        name: 'Barcode / QR',
        type: 'barcode',
        x: 10,
        y: 10,
        width: 15,
        height: 15,
        rotation: 0,
        opacity: 1,
        binding: 'roll_no',
        barcode: { symbology: 'qrcode', includeText: false },
      };
    } else {
      newEl = {
        id,
        name: shapeType === 'circle' ? 'Circle Shape' : 'Rectangle Shape',
        type: 'shape',
        shapeType: shapeType || 'rect',
        x: 10,
        y: 10,
        width: 30,
        height: 15,
        rotation: 0,
        opacity: 1,
        fill: '#1e293b',
        stroke: '#38bdf8',
        strokeWidth: 0.5,
      };
    }

    setElements([...currentElements, newEl]);
    setSelectedElementIds([id]);
  };

  // Convert Reference Image to Printable Artwork Image
  const handleConvertToPrintableElement = (el: RenderElement) => {
    setElements([...currentElements, el]);
  };

  const handleUpdateElement = (updated: RenderElement) => {
    const next = currentElements.map((el) => (el.id === updated.id ? updated : el));
    setElements(next);
  };

  const handleDeleteSelected = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const next = currentElements.filter((el) => !selectedElementIds.includes(el.id) || el.locked);
    setElements(next);
    setSelectedElementIds([]);
  }, [currentElements, selectedElementIds]);

  const handleDuplicateSelected = useCallback(
    (targetId?: string) => {
      const idsToDup = targetId ? [targetId] : selectedElementIds;
      if (idsToDup.length === 0) return;

      const dups: RenderElement[] = [];
      const newSelectedIds: string[] = [];

      currentElements.forEach((el) => {
        if (idsToDup.includes(el.id)) {
          const newId = 'el_' + Math.random().toString(36).substring(2, 8);
          const dup: RenderElement = {
            ...el,
            id: newId,
            x: el.x + 4,
            y: el.y + 4,
            name: `${el.name || 'Element'} (Copy)`,
          };
          dups.push(dup);
          newSelectedIds.push(newId);
        }
      });

      setElements([...currentElements, ...dups]);
      setSelectedElementIds(newSelectedIds);
    },
    [currentElements, selectedElementIds]
  );

  const handleCopySelected = useCallback(() => {
    const toCopy = currentElements.filter((el) => selectedElementIds.includes(el.id));
    setClipboard(toCopy);
  }, [currentElements, selectedElementIds]);

  const handlePasteSelected = useCallback(() => {
    if (clipboard.length === 0) return;
    const pasted: RenderElement[] = [];
    const newSelectedIds: string[] = [];

    clipboard.forEach((el) => {
      const newId = 'el_' + Math.random().toString(36).substring(2, 8);
      const copy: RenderElement = {
        ...el,
        id: newId,
        x: el.x + 4,
        y: el.y + 4,
      };
      pasted.push(copy);
      newSelectedIds.push(newId);
    });

    setElements([...currentElements, ...pasted]);
    setSelectedElementIds(newSelectedIds);
  }, [clipboard, currentElements]);

  const handleCutSelected = useCallback(() => {
    handleCopySelected();
    handleDeleteSelected();
  }, [handleCopySelected, handleDeleteSelected]);

  const handleSelectAll = useCallback(() => {
    const selectable = currentElements.filter((el) => el.visible !== false && !el.locked).map((el) => el.id);
    setSelectedElementIds(selectable);
  }, [currentElements]);

  const handleNudge = useCallback(
    (dx: number, dy: number) => {
      if (selectedElementIds.length === 0) return;
      const next = currentElements.map((el) => {
        if (selectedElementIds.includes(el.id) && !el.locked) {
          return { ...el, x: el.x + dx, y: el.y + dy };
        }
        return el;
      });
      setElements(next);
    },
    [currentElements, selectedElementIds]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      const isEditingText = ['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag);

      // Esc key works everywhere to clear selection
      if (e.key === 'Escape') {
        setSelectedElementIds([]);
        return;
      }

      if (isEditingText) return;

      // Undo (Ctrl+Z) / Redo (Ctrl+Shift+Z, Ctrl+Y)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Copy (Ctrl+C)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopySelected();
        return;
      }
      // Paste (Ctrl+V)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePasteSelected();
        return;
      }
      // Cut (Ctrl+X)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleCutSelected();
        return;
      }
      // Duplicate (Ctrl+D)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
        return;
      }
      // Select All (Ctrl+A)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSelectAll();
        return;
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }

      // Arrow Key Nudging
      const step = e.shiftKey ? 10 : 1; // 10mm or 1mm
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleNudge(-step, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNudge(step, 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleNudge(0, -step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNudge(0, step);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleCopySelected,
    handlePasteSelected,
    handleCutSelected,
    handleDuplicateSelected,
    handleSelectAll,
    handleDeleteSelected,
    handleNudge,
  ]);

  const selectedElement = currentElements.find((el) => selectedElementIds.includes(el.id)) || null;
  const sampleRecord = records[0] || null;

  return (
    <div className="max-w-[1750px] mx-auto px-6 py-6">
      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <Layout className="w-6 h-6 text-sky-400" />
            Visual Canvas Template Designer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Design professional ID cards with smart grid alignment, tracing guides, and multi-selection controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Card Side Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => {
                setActiveSide('front');
                setSelectedElementIds([]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeSide === 'front' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Front Side
            </button>
            <button
              onClick={() => {
                setActiveSide('back');
                setSelectedElementIds([]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeSide === 'back' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Back Side
            </button>
          </div>

          {/* Undo/Redo Buttons */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-30 transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-30 transition-colors"
              title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className={`gradient-button px-5 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2 ${
              isSaved ? 'bg-emerald-600' : ''
            }`}
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            {isSaved ? 'Saved to Local DB!' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* Designer Toolbar (Grid, Snapping, Zoom, Alignment) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 border border-slate-800/80 p-2.5 rounded-2xl mb-6">
        <div className="flex items-center gap-2">
          {/* Grid Toggles */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showGrid ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-slate-800 text-slate-400'
            }`}
            title="Toggle Grid"
          >
            <Grid className="w-3.5 h-3.5" /> Grid
          </button>

          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              snapToGrid ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-slate-800 text-slate-400'
            }`}
            title="Snap to Grid"
          >
            <Magnet className="w-3.5 h-3.5" /> Snap Grid
          </button>

          <button
            onClick={() => setSnapToObjects(!snapToObjects)}
            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              snapToObjects ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-slate-800 text-slate-400'
            }`}
            title="Snap to Objects & Smart Guides"
          >
            <Crosshair className="w-3.5 h-3.5" /> Smart Guides
          </button>

          {/* Grid Spacing Selector */}
          <select
            value={gridSpacingPx}
            onChange={(e) => setGridSpacingPx(parseInt(e.target.value))}
            className="bg-slate-900 border border-slate-800 text-xs text-white rounded-lg px-2 py-1"
          >
            <option value={5}>Grid: 5px (~1.3mm)</option>
            <option value={10}>Grid: 10px (~2.6mm)</option>
            <option value={20}>Grid: 20px (~5.3mm)</option>
            <option value={50}>Grid: 50px (~13mm)</option>
          </select>
        </div>

        {/* Alignment Controls Toolbar */}
        <AlignmentToolbar
          selectedElementIds={selectedElementIds}
          elements={currentElements}
          onChangeElements={setElements}
          widthMm={activeTemplate.cardWidthMm}
          heightMm={activeTemplate.cardHeightMm}
        />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            className="p-1 text-slate-400 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-300 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
            className="p-1 text-slate-400 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1 text-slate-400 hover:text-white"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main 3-Column Designer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Element Tool Palette & Tracing Panel */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Add Elements
            </h3>

            <button
              onClick={() => addElement('text')}
              className="w-full bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 p-2.5 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-2.5 transition-colors"
            >
              <Type className="w-4 h-4 text-sky-400" />
              <span>Add Text / Variable</span>
            </button>

            <button
              onClick={() => addElement('photo_placeholder')}
              className="w-full bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 p-2.5 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-2.5 transition-colors"
            >
              <Image className="w-4 h-4 text-emerald-400" />
              <span>Add Photo Frame</span>
            </button>

            <button
              onClick={() => addElement('barcode')}
              className="w-full bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 p-2.5 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-2.5 transition-colors"
            >
              <QrCode className="w-4 h-4 text-purple-400" />
              <span>Add Barcode / QR Code</span>
            </button>

            <button
              onClick={() => addElement('shape', 'rect')}
              className="w-full bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 p-2.5 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-2.5 transition-colors"
            >
              <Square className="w-4 h-4 text-amber-400" />
              <span>Add Rectangle Shape</span>
            </button>

            <button
              onClick={() => addElement('shape', 'circle')}
              className="w-full bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 p-2.5 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-2.5 transition-colors"
            >
              <CircleIcon className="w-4 h-4 text-rose-400" />
              <span>Add Circle Shape</span>
            </button>
          </div>

          {/* Tracing Reference Image Panel */}
          <ReferenceImagePanel
            referenceImage={currentRefImage}
            onChangeReferenceImage={setReferenceImage}
            widthMm={activeTemplate.cardWidthMm}
            heightMm={activeTemplate.cardHeightMm}
            onConvertToPrintableElement={handleConvertToPrintableElement}
          />
        </div>

        {/* Center Column: Interactive Konva Canvas */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="glass-panel w-full p-4 rounded-2xl flex items-center justify-center">
            <CanvasEditor
              elements={currentElements}
              widthMm={activeTemplate.cardWidthMm}
              heightMm={activeTemplate.cardHeightMm}
              backgroundColor={activeTemplate.backgroundColor}
              selectedElementIds={selectedElementIds}
              onSelectElement={handleSelectElement}
              onSelectMultipleElements={handleSelectMultipleElements}
              onChangeElement={handleUpdateElement}
              sampleRecord={sampleRecord}
              referenceImage={currentRefImage}
              onChangeReferenceImage={setReferenceImage}
              showGrid={showGrid}
              snapToGrid={snapToGrid}
              snapToObjects={snapToObjects}
              gridSpacingPx={gridSpacingPx}
              zoom={zoom}
              onZoomChange={setZoom}
              onDuplicateElement={handleDuplicateSelected}
            />
          </div>
        </div>

        {/* Right Column: Inspector & Layers Stack */}
        <div className="lg:col-span-3 space-y-4">
          <ElementInspector
            element={selectedElement}
            fields={fields}
            onChange={handleUpdateElement}
            onDelete={handleDeleteSelected}
            onDuplicate={handleDuplicateSelected}
            onMoveLayer={(direction) => {
              if (selectedElementIds.length === 0) return;
              const id = selectedElementIds[0];
              const idx = currentElements.findIndex((el) => el.id === id);
              if (idx === -1) return;
              const copy = [...currentElements];
              const item = copy.splice(idx, 1)[0];
              if (direction === 'up') copy.splice(Math.min(copy.length, idx + 1), 0, item);
              if (direction === 'down') copy.splice(Math.max(0, idx - 1), 0, item);
              if (direction === 'top') copy.push(item);
              if (direction === 'bottom') copy.unshift(item);
              setElements(copy);
            }}
          />

          <LayersPanel
            elements={currentElements}
            selectedElementIds={selectedElementIds}
            onSelectElement={handleSelectElement}
            onChangeElements={setElements}
          />
        </div>
      </div>
    </div>
  );
};
