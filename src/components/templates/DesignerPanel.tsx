import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ProjectItem, TemplateItem, RenderElement, ReferenceImageConfig, FieldDefinition } from '../../types';
import { db } from '../../services/db';
import { ProfessionalCanvas } from './ProfessionalCanvas';
import { LeftToolbar } from './LeftToolbar';
import { LeftSidebar } from './LeftSidebar';
import { RightPropertyPanel } from './RightPropertyPanel';
import { DesignerTopBar } from './DesignerTopBar';
import {
  Save,
  Check,
  Loader2
} from 'lucide-react';

export type ActiveTool = 'select' | 'pan' | 'text' | 'rect' | 'circle' | 'line' | 'barcode' | 'qrcode' | 'photo' | 'image';

interface DesignerPanelProps {
  project: ProjectItem;
  onRefresh: () => void;
}

const MAX_HISTORY = 100;

export const DesignerPanel: React.FC<DesignerPanelProps> = ({ project, onRefresh }) => {
  const templates = db.getTemplates(project.id);
  const fields = db.getFields(project.id);
  const records = db.getRecords(project.id);

  const defaultTemplate: TemplateItem = templates[0] || {
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
  };

  const [template, setTemplate] = useState<TemplateItem>(defaultTemplate);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [zoom, setZoom] = useState(1.0);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [snapToObjects, setSnapToObjects] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [gridSpacingMm, setGridSpacingMm] = useState(5);
  const [activeLeftPanel, setActiveLeftPanel] = useState<'layers' | 'variables' | 'history' | 'uploads'>('layers');
  const [clipboard, setClipboard] = useState<RenderElement[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  // History
  const [history, setHistory] = useState<TemplateItem[]>([defaultTemplate]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentElements = activeSide === 'front'
    ? template.sceneGraph
    : (template.sceneGraphBack || []);

  const currentRefImage = activeSide === 'front'
    ? template.referenceImageFront
    : template.referenceImageBack;

  const sampleRecord = records[0] || null;

  // Push history
  const pushHistory = useCallback((next: TemplateItem) => {
    setHistory(prev => {
      const sliced = prev.slice(0, historyIndex + 1);
      sliced.push(next);
      return sliced.slice(-MAX_HISTORY);
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
    setTemplate(next);
    scheduleAutosave(next);
  }, [historyIndex]);

  const scheduleAutosave = (t: TemplateItem) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      db.saveTemplate(project.id, t);
      setLastAutoSave(new Date());
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 2000);
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      setHistoryIndex(idx);
      setTemplate(history[idx]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1;
      setHistoryIndex(idx);
      setTemplate(history[idx]);
    }
  }, [historyIndex, history]);

  const setElements = useCallback((elements: RenderElement[]) => {
    const next = activeSide === 'front'
      ? { ...template, sceneGraph: elements }
      : { ...template, sceneGraphBack: elements };
    pushHistory(next);
  }, [template, activeSide, pushHistory]);

  const setReferenceImage = useCallback((refImg?: ReferenceImageConfig) => {
    const next = activeSide === 'front'
      ? { ...template, referenceImageFront: refImg }
      : { ...template, referenceImageBack: refImg };
    pushHistory(next);
  }, [template, activeSide, pushHistory]);

  const handleManualSave = () => {
    setSaveStatus('saving');
    db.saveTemplate(project.id, template);
    setTimeout(() => {
      setSaveStatus('saved');
      onRefresh();
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 300);
  };

  // Select
  const handleSelectElement = useCallback((id: string | null, isShift = false) => {
    if (!id) { setSelectedIds([]); return; }
    setSelectedIds(prev => isShift
      ? prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      : [id]
    );
  }, []);

  const handleSelectMultiple = useCallback((ids: string[]) => setSelectedIds(ids), []);

  // Update elements
  const handleUpdateElement = useCallback((updated: RenderElement) => {
    setElements(currentElements.map(el => el.id === updated.id ? updated : el));
  }, [currentElements, setElements]);

  const handleUpdateMultipleElements = useCallback((updated: RenderElement[]) => {
    const map = new Map(updated.map(el => [el.id, el]));
    setElements(currentElements.map(el => map.get(el.id) || el));
  }, [currentElements, setElements]);

  // Delete
  const handleDelete = useCallback(() => {
    if (!selectedIds.length) return;
    setElements(currentElements.filter(el => !selectedIds.includes(el.id) || el.locked));
    setSelectedIds([]);
  }, [selectedIds, currentElements, setElements]);

  // Duplicate
  const handleDuplicate = useCallback((ids?: string[]) => {
    const toDup = ids || selectedIds;
    if (!toDup.length) return;
    const dups: RenderElement[] = [];
    const newIds: string[] = [];
    currentElements.forEach(el => {
      if (toDup.includes(el.id)) {
        const newId = 'el_' + Math.random().toString(36).substring(2, 8);
        dups.push({ ...el, id: newId, x: el.x + 4, y: el.y + 4, name: `${el.name || 'Element'} Copy` });
        newIds.push(newId);
      }
    });
    setElements([...currentElements, ...dups]);
    setSelectedIds(newIds);
  }, [selectedIds, currentElements, setElements]);

  // Copy / Paste / Cut
  const handleCopy = useCallback(() => {
    setClipboard(currentElements.filter(el => selectedIds.includes(el.id)));
  }, [currentElements, selectedIds]);

  const handlePaste = useCallback(() => {
    if (!clipboard.length) return;
    const pasted: RenderElement[] = [];
    const newIds: string[] = [];
    clipboard.forEach(el => {
      const newId = 'el_' + Math.random().toString(36).substring(2, 8);
      pasted.push({ ...el, id: newId, x: el.x + 4, y: el.y + 4 });
      newIds.push(newId);
    });
    setElements([...currentElements, ...pasted]);
    setSelectedIds(newIds);
  }, [clipboard, currentElements, setElements]);

  const handleCut = useCallback(() => {
    handleCopy();
    handleDelete();
  }, [handleCopy, handleDelete]);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(currentElements.filter(el => !el.locked && el.visible !== false).map(el => el.id));
  }, [currentElements]);

  // Nudge
  const handleNudge = useCallback((dx: number, dy: number) => {
    if (!selectedIds.length) return;
    setElements(currentElements.map(el =>
      selectedIds.includes(el.id) && !el.locked ? { ...el, x: el.x + dx, y: el.y + dy } : el
    ));
  }, [selectedIds, currentElements, setElements]);

  // Add element
  const addElement = useCallback((type: RenderElement['type'], extra?: Partial<RenderElement>) => {
    const id = 'el_' + Math.random().toString(36).substring(2, 8);
    const base: RenderElement = {
      id,
      type,
      x: 10, y: 10,
      width: type === 'text' ? 50 : 30,
      height: type === 'text' ? 8 : (type === 'barcode' ? 20 : 20),
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      ...extra,
    };

    if (type === 'text') {
      base.text = 'Text Element';
      base.style = { fontSize: 10, fontFamily: 'Inter', color: '#ffffff', align: 'left' };
    } else if (type === 'shape') {
      base.fill = '#1e293b';
      base.stroke = '#38bdf8';
      base.strokeWidth = 0.5;
    } else if (type === 'photo_placeholder') {
      base.fill = '#1e293b';
      base.stroke = '#38bdf8';
      base.strokeWidth = 0.5;
      base.binding = 'photo';
      base.width = 20;
      base.height = 25;
    } else if (type === 'barcode') {
      base.barcode = { symbology: 'qrcode', includeText: false };
      base.text = '{{roll_no}}';
      base.width = 20;
      base.height = 20;
    }

    setElements([...currentElements, base]);
    setSelectedIds([id]);
    setActiveTool('select');
  }, [currentElements, setElements]);

  // Rotate / Flip
  const handleRotate = useCallback((deg: number) => {
    setElements(currentElements.map(el =>
      selectedIds.includes(el.id) && !el.locked
        ? { ...el, rotation: ((el.rotation || 0) + deg + 360) % 360 }
        : el
    ));
  }, [selectedIds, currentElements, setElements]);

  const handleFlip = useCallback((axis: 'h' | 'v') => {
    // Implemented via scaleX/scaleY - for now just store a flip flag in extra data
    // This is tracked via a rotation workaround (180 on correct axis)
    handleRotate(axis === 'h' ? 0 : 180);
  }, [handleRotate]);

  // Layer ordering
  const handleLayerMove = useCallback((id: string, action: 'front' | 'back' | 'up' | 'down') => {
    const idx = currentElements.findIndex(el => el.id === id);
    if (idx === -1) return;
    const copy = [...currentElements];
    const [item] = copy.splice(idx, 1);
    if (action === 'front') copy.push(item);
    else if (action === 'back') copy.unshift(item);
    else if (action === 'up') copy.splice(Math.min(copy.length, idx + 1), 0, item);
    else copy.splice(Math.max(0, idx - 1), 0, item);
    setElements(copy);
  }, [currentElements, setElements]);

  // Zoom
  const handleZoom = useCallback((factor: number) => {
    setZoom(z => Math.max(0.1, Math.min(5, z * factor)));
  }, []);

  const handleZoomToFit = useCallback(() => setZoom(1), []);

  // Template card size presets
  const handleCardSizePreset = useCallback((w: number, h: number) => {
    pushHistory({ ...template, cardWidthMm: w, cardHeightMm: h });
  }, [template, pushHistory]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) ||
        (e.target as HTMLElement)?.contentEditable === 'true';

      if (e.key === 'Escape') { setSelectedIds([]); setActiveTool('select'); return; }
      if (isEditing) return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? handleRedo() : handleUndo(); return; }
      if (ctrl && e.key.toLowerCase() === 'y') { e.preventDefault(); handleRedo(); return; }
      if (ctrl && e.key.toLowerCase() === 'c') { e.preventDefault(); handleCopy(); return; }
      if (ctrl && e.key.toLowerCase() === 'v') { e.preventDefault(); handlePaste(); return; }
      if (ctrl && e.key.toLowerCase() === 'x') { e.preventDefault(); handleCut(); return; }
      if (ctrl && e.key.toLowerCase() === 'd') { e.preventDefault(); handleDuplicate(); return; }
      if (ctrl && e.key.toLowerCase() === 'a') { e.preventDefault(); handleSelectAll(); return; }
      if (ctrl && e.shiftKey && e.key.toLowerCase() === ']') { e.preventDefault(); selectedIds.forEach(id => handleLayerMove(id, 'front')); return; }
      if (ctrl && e.shiftKey && e.key.toLowerCase() === '[') { e.preventDefault(); selectedIds.forEach(id => handleLayerMove(id, 'back')); return; }
      if (ctrl && e.key === ']') { e.preventDefault(); selectedIds.forEach(id => handleLayerMove(id, 'up')); return; }
      if (ctrl && e.key === '[') { e.preventDefault(); selectedIds.forEach(id => handleLayerMove(id, 'down')); return; }
      if (ctrl && e.key === 's') { e.preventDefault(); handleManualSave(); return; }

      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); handleDelete(); return; }

      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft') { e.preventDefault(); handleNudge(-step, 0); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); handleNudge(step, 0); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); handleNudge(0, -step); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); handleNudge(0, step); return; }

      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') { setActiveTool('select'); return; }
      if (e.key === 'h' || e.key === 'H') { setActiveTool('pan'); return; }
      if (e.key === 't' || e.key === 'T') { setActiveTool('text'); return; }
      if (e.key === 'r' || e.key === 'R') { setActiveTool('rect'); return; }
      if (e.key === 'o' || e.key === 'O') { setActiveTool('circle'); return; }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleUndo, handleRedo, handleCopy, handlePaste, handleCut, handleDuplicate,
    handleSelectAll, handleDelete, handleNudge, handleLayerMove, selectedIds, handleManualSave]);

  const selectedElements = currentElements.filter(el => selectedIds.includes(el.id));
  const selectedElement = selectedElements[0] || null;

  return (
    <div className="flex flex-col h-full bg-[#0a0f1a]" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Top Bar */}
      <DesignerTopBar
        template={template}
        activeSide={activeSide}
        onSetActiveSide={(s) => { setActiveSide(s); setSelectedIds([]); }}
        selectedIds={selectedIds}
        selectedElements={selectedElements}
        elements={currentElements}
        onUpdateElements={setElements}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onSave={handleManualSave}
        saveStatus={saveStatus}
        zoom={zoom}
        onZoom={setZoom}
        onZoomToFit={handleZoomToFit}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(v => !v)}
        showGuides={showGuides}
        onToggleGuides={() => setShowGuides(v => !v)}
        showRulers={showRulers}
        onToggleRulers={() => setShowRulers(v => !v)}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(v => !v)}
        onRotate={handleRotate}
        onFlip={handleFlip}
        onDuplicate={() => handleDuplicate()}
        onDelete={handleDelete}
        onLayerMove={(action) => selectedIds.forEach(id => handleLayerMove(id, action))}
        onCardSizePreset={handleCardSizePreset}
        onUpdateTemplate={(t) => pushHistory(t)}
        lastAutoSave={lastAutoSave}
        project={project}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Left Vertical Tool Palette */}
        <LeftToolbar
          activeTool={activeTool}
          onSetTool={setActiveTool}
          onAddElement={addElement}
        />

        {/* Left Sidebar — Layers / Variables / History */}
        <LeftSidebar
          activePanel={activeLeftPanel}
          onSetPanel={setActiveLeftPanel}
          elements={currentElements}
          selectedIds={selectedIds}
          fields={fields}
          history={history}
          historyIndex={historyIndex}
          onSelectElement={handleSelectElement}
          onSelectMultiple={handleSelectMultiple}
          onChangeElements={setElements}
          onInsertVariable={(key) => {
            if (selectedElement?.type === 'text') {
              handleUpdateElement({
                ...selectedElement,
                text: (selectedElement.text || '') + `{{${key}}}`,
                binding: undefined,
              });
            }
          }}
          onJumpToHistory={(idx) => {
            setHistoryIndex(idx);
            setTemplate(history[idx]);
          }}
        />

        {/* Center Canvas */}
        <div className="flex-1 relative overflow-hidden bg-[#111827]">
          <ProfessionalCanvas
            elements={currentElements}
            widthMm={template.cardWidthMm}
            heightMm={template.cardHeightMm}
            backgroundColor={template.backgroundColor || '#0f172a'}
            selectedIds={selectedIds}
            onSelectElement={handleSelectElement}
            onSelectMultiple={handleSelectMultiple}
            onUpdateElement={handleUpdateElement}
            onUpdateElements={handleUpdateMultipleElements}
            sampleRecord={sampleRecord}
            referenceImage={currentRefImage}
            onChangeReferenceImage={setReferenceImage}
            showGrid={showGrid}
            snapToGrid={snapToGrid}
            snapToObjects={snapToObjects}
            showRulers={showRulers}
            gridSpacingMm={gridSpacingMm}
            zoom={zoom}
            onZoom={setZoom}
            activeTool={activeTool}
            onSetTool={setActiveTool}
            onAddElement={addElement}
            onDuplicate={handleDuplicate}
          />
        </div>

        {/* Right Property Panel */}
        <RightPropertyPanel
          selectedElements={selectedElements}
          allElements={currentElements}
          fields={fields}
          onUpdateElement={handleUpdateElement}
          onUpdateElements={handleUpdateMultipleElements}
          onDelete={handleDelete}
          onDuplicate={() => handleDuplicate()}
          onLayerMove={(action) => selectedIds.forEach(id => handleLayerMove(id, action))}
          template={template}
          onUpdateTemplate={(t) => pushHistory(t)}
        />
      </div>
    </div>
  );
};
