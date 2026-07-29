import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Stage, Layer, Rect, Circle, Text as KonvaText, Image as KonvaImage,
  Transformer, Line, Group
} from 'react-konva';
import { RenderElement, RecordItem, ReferenceImageConfig } from '../../types';
import { ActiveTool } from './DesignerPanel';

const MM_TO_PX = 3.7795275591;
const RULER_SIZE = 20;

interface ProfessionalCanvasProps {
  elements: RenderElement[];
  widthMm: number;
  heightMm: number;
  backgroundColor?: string;
  selectedIds: string[];
  onSelectElement: (id: string | null, shift?: boolean) => void;
  onSelectMultiple: (ids: string[]) => void;
  onUpdateElement: (el: RenderElement) => void;
  onUpdateElements: (els: RenderElement[]) => void;
  sampleRecord?: RecordItem | null;
  referenceImage?: ReferenceImageConfig;
  onChangeReferenceImage?: (ref?: ReferenceImageConfig) => void;
  showGrid: boolean;
  snapToGrid: boolean;
  snapToObjects: boolean;
  showRulers: boolean;
  gridSpacingMm: number;
  zoom: number;
  onZoom: (z: number) => void;
  activeTool: ActiveTool;
  onSetTool: (t: ActiveTool) => void;
  onAddElement: (type: RenderElement['type'], extra?: Partial<RenderElement>) => void;
  onDuplicate: (ids?: string[]) => void;
}

function useKonvaImage(url?: string) {
  const [image, setImage] = useState<HTMLImageElement | undefined>();
  useEffect(() => {
    if (!url) { setImage(undefined); return; }
    const img = new window.Image();
    img.onload = () => setImage(img);
    img.src = url;
  }, [url]);
  return [image] as const;
}

const RefImageNode: React.FC<{ config: ReferenceImageConfig; onChange: (c: ReferenceImageConfig) => void }> = ({ config, onChange }) => {
  const [image] = useKonvaImage(config.url);
  if (!config.visible || !image) return null;
  return (
    <KonvaImage
      image={image}
      x={config.x * MM_TO_PX} y={config.y * MM_TO_PX}
      width={config.width * MM_TO_PX} height={config.height * MM_TO_PX}
      opacity={config.opacity}
      listening={!config.locked}
      draggable={!config.locked}
      onDragEnd={e => onChange({ ...config, x: e.target.x() / MM_TO_PX, y: e.target.y() / MM_TO_PX })}
    />
  );
};

export const ProfessionalCanvas: React.FC<ProfessionalCanvasProps> = ({
  elements, widthMm, heightMm, backgroundColor = '#0f172a',
  selectedIds, onSelectElement, onSelectMultiple,
  onUpdateElement, onUpdateElements,
  sampleRecord, referenceImage, onChangeReferenceImage,
  showGrid, snapToGrid, snapToObjects, showRulers,
  gridSpacingMm, zoom, onZoom,
  activeTool, onSetTool, onAddElement, onDuplicate
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const nodesMap = useRef<Map<string, any>>(new Map());

  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [guides, setGuides] = useState<{ points: number[]; color: string }[]>([]);
  const [selBox, setSelBox] = useState<{ x1: number; y1: number; x2: number; y2: number; active: boolean }>({
    x1: 0, y1: 0, x2: 0, y2: 0, active: false
  });

  // Canvas dimensions in px
  const canvasW = widthMm * MM_TO_PX;
  const canvasH = heightMm * MM_TO_PX;

  // Center canvas on mount / size change
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
      setStagePos({
        x: (width - canvasW * zoom) / 2,
        y: (height - canvasH * zoom) / 2,
      });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [canvasW, canvasH, zoom]);

  // Sync transformer nodes
  useEffect(() => {
    if (!transformerRef.current) return;
    const nodes: any[] = [];
    selectedIds.forEach(id => {
      const node = nodesMap.current.get(id);
      if (node) nodes.push(node);
    });
    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedIds, elements]);

  // Space key pan
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsSpaceDown(true);
      }
    };
    const ku = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpaceDown(false); };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  // Wheel zoom centered on cursor
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (!stageRef.current) return;

    const scaleBy = 1.08;
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = zoom;
    const newScale = e.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    onZoom(clampedScale);
    setStagePos(newPos);
  }, [zoom, stagePos, onZoom]);

  // Smart snap guides
  const snapDragMove = useCallback((e: any, draggingEl: RenderElement) => {
    const node = e.target;
    let nx = node.x(), ny = node.y();
    const w = draggingEl.width * MM_TO_PX, h = draggingEl.height * MM_TO_PX;
    const THRESH = 5;
    const newGuides: { points: number[]; color: string }[] = [];

    if (snapToGrid) {
      const stepPx = gridSpacingMm * MM_TO_PX;
      nx = Math.round(nx / stepPx) * stepPx;
      ny = Math.round(ny / stepPx) * stepPx;
    }

    if (snapToObjects) {
      const cx = canvasW / 2, cy = canvasH / 2;
      if (Math.abs(nx + w / 2 - cx) < THRESH) { nx = cx - w / 2; newGuides.push({ points: [cx, 0, cx, canvasH], color: '#ef4444' }); }
      if (Math.abs(ny + h / 2 - cy) < THRESH) { ny = cy - h / 2; newGuides.push({ points: [0, cy, canvasW, cy], color: '#ef4444' }); }

      elements.forEach(other => {
        if (other.id === draggingEl.id || other.visible === false) return;
        const ol = other.x * MM_TO_PX, or_ = (other.x + other.width) * MM_TO_PX;
        const ot = other.y * MM_TO_PX, ob = (other.y + other.height) * MM_TO_PX;
        const ocx = (ol + or_) / 2, ocy = (ot + ob) / 2;

        if (Math.abs(nx - ol) < THRESH) { nx = ol; newGuides.push({ points: [ol, 0, ol, canvasH], color: '#38bdf8' }); }
        if (Math.abs(nx + w - or_) < THRESH) { nx = or_ - w; newGuides.push({ points: [or_, 0, or_, canvasH], color: '#38bdf8' }); }
        if (Math.abs(nx + w / 2 - ocx) < THRESH) { nx = ocx - w / 2; newGuides.push({ points: [ocx, 0, ocx, canvasH], color: '#38bdf8' }); }
        if (Math.abs(ny - ot) < THRESH) { ny = ot; newGuides.push({ points: [0, ot, canvasW, ot], color: '#38bdf8' }); }
        if (Math.abs(ny + h - ob) < THRESH) { ny = ob - h; newGuides.push({ points: [0, ob, canvasW, ob], color: '#38bdf8' }); }
        if (Math.abs(ny + h / 2 - ocy) < THRESH) { ny = ocy - h / 2; newGuides.push({ points: [0, ocy, canvasW, ocy], color: '#38bdf8' }); }
      });
    }

    node.x(nx); node.y(ny);
    setGuides(newGuides);
  }, [snapToGrid, snapToObjects, gridSpacingMm, elements, canvasW, canvasH]);

  const getDisplayText = (el: RenderElement) => {
    let text = el.text || '{{' + (el.binding || 'field') + '}}';
    if (sampleRecord) {
      text = text.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
        const val = sampleRecord.recordData[key.trim()];
        return val !== undefined ? String(val) : `{{${key}}}`;
      });
    }
    return text;
  };

  // Grid lines
  const gridLines: React.ReactNode[] = [];
  if (showGrid) {
    const stepPx = gridSpacingMm * MM_TO_PX;
    const majorStep = stepPx * 5;
    for (let x = 0; x <= canvasW + stepPx; x += stepPx) {
      const major = Math.abs(x % majorStep) < 0.5;
      gridLines.push(<Line key={`gv${x}`} points={[x, 0, x, canvasH]} stroke={major ? '#334155' : '#1e293b'} strokeWidth={major ? 0.5 : 0.3} />);
    }
    for (let y = 0; y <= canvasH + stepPx; y += stepPx) {
      const major = Math.abs(y % majorStep) < 0.5;
      gridLines.push(<Line key={`gh${y}`} points={[0, y, canvasW, y]} stroke={major ? '#334155' : '#1e293b'} strokeWidth={major ? 0.5 : 0.3} />);
    }
  }

  const handleStageMouseDown = (e: any) => {
    if (isSpaceDown || activeTool === 'pan') return;

    const clickedOnBg = e.target === e.target.getStage() || e.target.hasName('bg-rect');
    if (clickedOnBg) {
      onSelectElement(null);
      const pos = stageRef.current?.getPointerPosition();
      if (pos) {
        setSelBox({ x1: pos.x / zoom, y1: pos.y / zoom, x2: pos.x / zoom, y2: pos.y / zoom, active: true });
      }
    }
  };

  const handleStageMouseMove = (e: any) => {
    if (selBox.active) {
      const pos = stageRef.current?.getPointerPosition();
      if (pos) setSelBox(prev => ({ ...prev, x2: pos.x / zoom, y2: pos.y / zoom }));
    }
  };

  const handleStageMouseUp = () => {
    if (selBox.active) {
      const box = {
        x1: Math.min(selBox.x1, selBox.x2),
        y1: Math.min(selBox.y1, selBox.y2),
        x2: Math.max(selBox.x1, selBox.x2),
        y2: Math.max(selBox.y1, selBox.y2),
      };
      const inside = elements.filter(el => {
        if (el.visible === false || el.locked) return false;
        const ex = el.x * MM_TO_PX, ey = el.y * MM_TO_PX;
        const ew = el.width * MM_TO_PX, eh = el.height * MM_TO_PX;
        return ex < box.x2 && ex + ew > box.x1 && ey < box.y2 && ey + eh > box.y1;
      });
      if (inside.length > 0) onSelectMultiple(inside.map(el => el.id));
      setSelBox(prev => ({ ...prev, active: false }));
    }
    setGuides([]);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden"
      onWheel={handleWheel}
    >
      {/* Ruler Top */}
      {showRulers && (
        <div className="absolute top-0 left-5 right-0 h-5 bg-[#0d1424] border-b border-slate-800 z-10 pointer-events-none overflow-hidden">
          <svg width="100%" height="20" className="opacity-70">
            {Array.from({ length: Math.ceil(containerSize.w / (gridSpacingMm * MM_TO_PX * zoom)) + 2 }).map((_, i) => {
              const xMm = i * gridSpacingMm;
              const xPx = stagePos.x + xMm * MM_TO_PX * zoom;
              if (xPx < 0 || xPx > containerSize.w) return null;
              const major = i % 5 === 0;
              return (
                <g key={i}>
                  <line x1={xPx} y1={major ? 6 : 12} x2={xPx} y2={20} stroke={major ? '#64748b' : '#334155'} strokeWidth="0.5" />
                  {major && xMm > 0 && <text x={xPx + 2} y={10} fill="#64748b" fontSize="7" fontFamily="monospace">{xMm}mm</text>}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Ruler Left */}
      {showRulers && (
        <div className="absolute top-5 left-0 bottom-0 w-5 bg-[#0d1424] border-r border-slate-800 z-10 pointer-events-none overflow-hidden">
          <svg height="100%" width="20" className="opacity-70">
            {Array.from({ length: Math.ceil(containerSize.h / (gridSpacingMm * MM_TO_PX * zoom)) + 2 }).map((_, i) => {
              const yMm = i * gridSpacingMm;
              const yPx = stagePos.y + yMm * MM_TO_PX * zoom;
              if (yPx < 0 || yPx > containerSize.h) return null;
              const major = i % 5 === 0;
              return (
                <g key={i}>
                  <line x1={major ? 6 : 12} y1={yPx} x2={20} y2={yPx} stroke={major ? '#64748b' : '#334155'} strokeWidth="0.5" />
                  {major && yMm > 0 && (
                    <text
                      x={10} y={yPx - 2}
                      fill="#64748b" fontSize="7" fontFamily="monospace"
                      transform={`rotate(-90, 10, ${yPx})`}
                    >{yMm}mm</text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Corner origin marker */}
      {showRulers && (
        <div className="absolute top-0 left-0 w-5 h-5 bg-[#0d1424] border-b border-r border-slate-800 z-20" />
      )}

      {/* Konva Stage */}
      <Stage
        ref={stageRef}
        width={containerSize.w}
        height={containerSize.h}
        scaleX={zoom}
        scaleY={zoom}
        x={stagePos.x}
        y={stagePos.y}
        draggable={isSpaceDown || activeTool === 'pan'}
        onDragEnd={e => setStagePos({ x: e.target.x(), y: e.target.y() })}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        style={{ cursor: isSpaceDown || activeTool === 'pan' ? 'grab' : 'default' }}
      >
        {/* Background workspace */}
        <Layer>
          <Rect
            x={-canvasW * 3} y={-canvasH * 3}
            width={canvasW * 7} height={canvasH * 7}
            fill="#111827"
          />

          {/* Page shadow */}
          <Rect x={4 / zoom} y={4 / zoom} width={canvasW} height={canvasH} fill="rgba(0,0,0,0.4)" />

          {/* Page background */}
          <Rect name="bg-rect" x={0} y={0} width={canvasW} height={canvasH} fill={backgroundColor} />

          {/* Tracing reference image */}
          {referenceImage && onChangeReferenceImage && (
            <RefImageNode config={referenceImage} onChange={onChangeReferenceImage} />
          )}

          {/* Grid */}
          {showGrid && <Group>{gridLines}</Group>}
        </Layer>

        {/* Elements */}
        <Layer>
          {elements.map(el => {
            if (el.visible === false) return null;
            const isSelected = selectedIds.includes(el.id);
            const locked = !!el.locked;
            const xPx = el.x * MM_TO_PX, yPx = el.y * MM_TO_PX;
            const wPx = el.width * MM_TO_PX, hPx = el.height * MM_TO_PX;

            const common = {
              key: el.id,
              ref: (node: any) => { if (node) nodesMap.current.set(el.id, node); else nodesMap.current.delete(el.id); },
              draggable: !locked && activeTool === 'select',
              onClick: (e: any) => { e.cancelBubble = true; onSelectElement(el.id, e.evt.shiftKey); },
              onTap: (e: any) => { e.cancelBubble = true; onSelectElement(el.id); },
              onDragMove: (e: any) => snapDragMove(e, el),
              onDragEnd: (e: any) => {
                setGuides([]);
                const alt = (e.evt as MouseEvent).altKey;
                const nx = Math.round(e.target.x() / MM_TO_PX * 10) / 10;
                const ny = Math.round(e.target.y() / MM_TO_PX * 10) / 10;
                onUpdateElement({ ...el, x: nx, y: ny });
                if (alt) onDuplicate([el.id]);
              },
              onTransformEnd: (e: any) => {
                const node = e.target;
                const sx = node.scaleX(), sy = node.scaleY();
                node.scaleX(1); node.scaleY(1);
                onUpdateElement({
                  ...el,
                  x: Math.round(node.x() / MM_TO_PX * 10) / 10,
                  y: Math.round(node.y() / MM_TO_PX * 10) / 10,
                  width: Math.max(1, Math.round(node.width() * sx / MM_TO_PX * 10) / 10),
                  height: Math.max(1, Math.round(node.height() * sy / MM_TO_PX * 10) / 10),
                  rotation: Math.round(node.rotation() * 10) / 10,
                });
              },
            };

            if (el.type === 'shape') {
              if (el.shapeType === 'circle') {
                return <Circle {...common} x={xPx + wPx / 2} y={yPx + hPx / 2} radius={wPx / 2}
                  fill={el.fill || '#1e293b'} stroke={el.stroke || '#38bdf8'}
                  strokeWidth={(el.strokeWidth || 0.25) * MM_TO_PX}
                  opacity={el.opacity ?? 1} rotation={el.rotation || 0} />;
              }
              return <Rect {...common} x={xPx} y={yPx} width={wPx} height={hPx}
                fill={el.fill || '#1e293b'} stroke={el.stroke || '#38bdf8'}
                strokeWidth={(el.strokeWidth || 0.25) * MM_TO_PX}
                opacity={el.opacity ?? 1} rotation={el.rotation || 0} />;
            }

            if (el.type === 'photo_placeholder') {
              return <Rect {...common} x={xPx} y={yPx} width={wPx} height={hPx}
                fill={el.fill || '#1e293b'} stroke={el.stroke || '#38bdf8'}
                strokeWidth={(el.strokeWidth || 0.5) * MM_TO_PX}
                dash={[4, 4]} opacity={el.opacity ?? 1} rotation={el.rotation || 0} />;
            }

            if (el.type === 'barcode') {
              return <Rect {...common} x={xPx} y={yPx} width={wPx} height={hPx}
                fill="#ffffff" stroke="#000" strokeWidth={0.5}
                opacity={el.opacity ?? 1} rotation={el.rotation || 0} />;
            }

            if (el.type === 'text') {
              return <KonvaText {...common} x={xPx} y={yPx} width={wPx} height={hPx}
                text={getDisplayText(el)}
                fontSize={(el.style?.fontSize || 8) * (MM_TO_PX / 2.5)}
                fontFamily={el.style?.fontFamily || 'Inter'}
                fontStyle={el.style?.fontWeight === 'bold' ? 'bold' : 'normal'}
                fill={el.style?.color || '#ffffff'}
                align={el.style?.align || 'left'}
                opacity={el.opacity ?? 1} rotation={el.rotation || 0} />;
            }

            return null;
          })}

          {/* Smart guides */}
          {guides.map((g, i) => (
            <Line key={`guide${i}`} points={g.points} stroke={g.color} strokeWidth={1 / zoom} dash={[4 / zoom, 4 / zoom]} />
          ))}

          {/* Marquee selection box */}
          {selBox.active && (
            <Rect
              x={Math.min(selBox.x1, selBox.x2)} y={Math.min(selBox.y1, selBox.y2)}
              width={Math.abs(selBox.x2 - selBox.x1)} height={Math.abs(selBox.y2 - selBox.y1)}
              fill="rgba(56,189,248,0.1)" stroke="#38bdf8" strokeWidth={1 / zoom} dash={[3 / zoom, 3 / zoom]}
            />
          )}

          {/* Transformer */}
          {selectedIds.length > 0 && (
            <Transformer
              ref={transformerRef}
              rotateEnabled
              keepRatio={false}
              borderStroke="#38bdf8"
              borderStrokeWidth={1.5 / zoom}
              anchorStroke="#38bdf8"
              anchorFill="#0a0f1a"
              anchorSize={8 / zoom}
              rotationSnaps={[0, 15, 30, 45, 90, 135, 180, 270]}
              rotationSnapTolerance={5}
              boundBoxFunc={(old, box) => box.width < 5 || box.height < 5 ? old : box}
            />
          )}
        </Layer>
      </Stage>

      {/* Page dimension label */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-400 px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none">
        {widthMm}mm × {heightMm}mm · {Math.round(zoom * 100)}%
        {showRulers && ' · Rulers'}
        {showGrid && ' · Grid'}
      </div>
    </div>
  );
};
