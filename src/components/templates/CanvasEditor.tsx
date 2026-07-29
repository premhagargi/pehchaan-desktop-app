import React, { useRef, useEffect, useState } from 'react';
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Text as KonvaText,
  Image as KonvaImage,
  Transformer,
  Line,
  Group
} from 'react-konva';
import { RenderElement, RecordItem, ReferenceImageConfig } from '../../types';

function useKonvaImage(url?: string): [HTMLImageElement | undefined] {
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);
  useEffect(() => {
    if (!url) {
      setImage(undefined);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => setImage(img);
    img.src = url;
  }, [url]);
  return [image];
}

interface CanvasEditorProps {
  elements: RenderElement[];
  widthMm: number;
  heightMm: number;
  dpi?: number;
  backgroundColor?: string;
  selectedElementIds: string[];
  onSelectElement: (id: string | null, isShift?: boolean) => void;
  onSelectMultipleElements?: (ids: string[]) => void;
  onChangeElement: (updated: RenderElement) => void;
  onChangeMultipleElements?: (updated: RenderElement[]) => void;
  sampleRecord?: RecordItem | null;
  samplePhotoUrl?: string | null;
  referenceImage?: ReferenceImageConfig;
  onChangeReferenceImage?: (refImg?: ReferenceImageConfig) => void;
  // Grid & Snap options
  showGrid?: boolean;
  snapToGrid?: boolean;
  snapToObjects?: boolean;
  gridSpacingPx?: number; // minor grid spacing e.g., 10px (~2.6mm)
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  onDuplicateElement?: (id: string) => void;
}

const MM_TO_PX = 3.7795275591; // 96 DPI screen pixel scale factor

const ReferenceImageLayerNode: React.FC<{
  config: ReferenceImageConfig;
  onUpdate: (updated: ReferenceImageConfig) => void;
}> = ({ config, onUpdate }) => {
  const [image] = useKonvaImage(config.url);
  if (!config.visible || !image) return null;

  return (
    <KonvaImage
      image={image}
      x={config.x * MM_TO_PX}
      y={config.y * MM_TO_PX}
      width={config.width * MM_TO_PX}
      height={config.height * MM_TO_PX}
      opacity={config.opacity}
      listening={!config.locked}
      draggable={!config.locked}
      onDragEnd={(e) => {
        onUpdate({
          ...config,
          x: Math.round(e.target.x() / MM_TO_PX),
          y: Math.round(e.target.y() / MM_TO_PX),
        });
      }}
    />
  );
};

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  elements,
  widthMm,
  heightMm,
  backgroundColor = '#0f172a',
  selectedElementIds,
  onSelectElement,
  onSelectMultipleElements,
  onChangeElement,
  onChangeMultipleElements,
  sampleRecord,
  referenceImage,
  onChangeReferenceImage,
  showGrid = true,
  snapToGrid = true,
  snapToObjects = true,
  gridSpacingPx = 10,
  zoom = 1,
  onZoomChange,
  onDuplicateElement,
}) => {
  const canvasWidthPx = Math.round(widthMm * MM_TO_PX);
  const canvasHeightPx = Math.round(heightMm * MM_TO_PX);

  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const nodesMapRef = useRef<Map<string, any>>(new Map());

  // Guide lines state for smart snapping
  const [guideLines, setGuideLines] = useState<Array<{ points: number[]; color: string }>>([]);

  // Selection Marquee Box
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isSelecting: boolean;
  }>({ startX: 0, startY: 0, currentX: 0, currentY: 0, isSelecting: false });

  // Pan State (Space + Drag)
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Attach Transformer nodes
  useEffect(() => {
    if (transformerRef.current) {
      const selectedNodes: any[] = [];
      selectedElementIds.forEach((id) => {
        const node = nodesMapRef.current.get(id);
        if (node) selectedNodes.push(node);
      });
      transformerRef.current.nodes(selectedNodes);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedElementIds, elements, zoom]);

  // Spacebar pan listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleStageMouseDown = (e: any) => {
    // If Space is pressed, allow stage panning
    if (isSpacePressed) return;

    const clickedOnStage = e.target === e.target.getStage();
    const clickedOnBg = e.target.hasName && e.target.hasName('bg-rect');

    if (clickedOnStage || clickedOnBg) {
      onSelectElement(null);
      // Start marquee selection box
      const stage = stageRef.current;
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          setSelectionBox({
            startX: pos.x / zoom,
            startY: pos.y / zoom,
            currentX: pos.x / zoom,
            currentY: pos.y / zoom,
            isSelecting: true,
          });
        }
      }
    }
  };

  const handleStageMouseMove = (e: any) => {
    if (selectionBox.isSelecting) {
      const stage = stageRef.current;
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          setSelectionBox((prev) => ({
            ...prev,
            currentX: pos.x / zoom,
            currentY: pos.y / zoom,
          }));
        }
      }
    }
  };

  const handleStageMouseUp = () => {
    if (selectionBox.isSelecting) {
      const box = {
        x1: Math.min(selectionBox.startX, selectionBox.currentX),
        y1: Math.min(selectionBox.startY, selectionBox.currentY),
        x2: Math.max(selectionBox.startX, selectionBox.currentX),
        y2: Math.max(selectionBox.startY, selectionBox.currentY),
      };

      // Select elements inside box
      const newlySelectedIds: string[] = [];
      elements.forEach((el) => {
        if (el.visible === false || el.locked) return;
        const elX = el.x * MM_TO_PX;
        const elY = el.y * MM_TO_PX;
        const elW = el.width * MM_TO_PX;
        const elH = el.height * MM_TO_PX;

        if (
          elX < box.x2 &&
          elX + elW > box.x1 &&
          elY < box.y2 &&
          elY + elH > box.y1
        ) {
          newlySelectedIds.push(el.id);
        }
      });

      if (newlySelectedIds.length > 0 && onSelectMultipleElements) {
        onSelectMultipleElements(newlySelectedIds);
      }

      setSelectionBox((prev) => ({ ...prev, isSelecting: false }));
    }
  };

  // Drag snapping & Smart Guides
  const handleDragMove = (e: any, draggingEl: RenderElement) => {
    const node = e.target;
    let newX = node.x();
    let newY = node.y();
    const w = draggingEl.width * MM_TO_PX;
    const h = draggingEl.height * MM_TO_PX;

    const newGuides: Array<{ points: number[]; color: string }> = [];
    const SNAP_THRESH = 5;

    // 1. Grid Snapping
    if (snapToGrid) {
      const snapX = Math.round(newX / gridSpacingPx) * gridSpacingPx;
      const snapY = Math.round(newY / gridSpacingPx) * gridSpacingPx;
      if (Math.abs(snapX - newX) < SNAP_THRESH) newX = snapX;
      if (Math.abs(snapY - newY) < SNAP_THRESH) newY = snapY;
    }

    // 2. Smart Object & Canvas Guides
    if (snapToObjects) {
      // Canvas center lines
      const canvasCenterX = canvasWidthPx / 2;
      const canvasCenterY = canvasHeightPx / 2;

      // Dragging element key points
      const left = newX;
      const right = newX + w;
      const centerX = newX + w / 2;
      const top = newY;
      const bottom = newY + h;
      const centerY = newY + h / 2;

      // Canvas Center X
      if (Math.abs(centerX - canvasCenterX) < SNAP_THRESH) {
        newX = canvasCenterX - w / 2;
        newGuides.push({ points: [canvasCenterX, 0, canvasCenterX, canvasHeightPx], color: '#ef4444' });
      }
      // Canvas Center Y
      if (Math.abs(centerY - canvasCenterY) < SNAP_THRESH) {
        newY = canvasCenterY - h / 2;
        newGuides.push({ points: [0, canvasCenterY, canvasWidthPx, canvasCenterY], color: '#ef4444' });
      }

      // Snap to other visible elements
      elements.forEach((other) => {
        if (other.id === draggingEl.id || other.visible === false) return;
        const oL = other.x * MM_TO_PX;
        const oR = (other.x + other.width) * MM_TO_PX;
        const oCX = oL + (other.width * MM_TO_PX) / 2;
        const oT = other.y * MM_TO_PX;
        const oB = (other.y + other.height) * MM_TO_PX;
        const oCY = oT + (other.height * MM_TO_PX) / 2;

        // Left-Left
        if (Math.abs(left - oL) < SNAP_THRESH) {
          newX = oL;
          newGuides.push({ points: [oL, 0, oL, canvasHeightPx], color: '#38bdf8' });
        }
        // Center-Center X
        if (Math.abs(centerX - oCX) < SNAP_THRESH) {
          newX = oCX - w / 2;
          newGuides.push({ points: [oCX, 0, oCX, canvasHeightPx], color: '#38bdf8' });
        }
        // Right-Right
        if (Math.abs(right - oR) < SNAP_THRESH) {
          newX = oR - w;
          newGuides.push({ points: [oR, 0, oR, canvasHeightPx], color: '#38bdf8' });
        }

        // Top-Top
        if (Math.abs(top - oT) < SNAP_THRESH) {
          newY = oT;
          newGuides.push({ points: [0, oT, canvasWidthPx, oT], color: '#38bdf8' });
        }
        // Center-Center Y
        if (Math.abs(centerY - oCY) < SNAP_THRESH) {
          newY = oCY - h / 2;
          newGuides.push({ points: [0, oCY, canvasWidthPx, oCY], color: '#38bdf8' });
        }
        // Bottom-Bottom
        if (Math.abs(bottom - oB) < SNAP_THRESH) {
          newY = oB - h;
          newGuides.push({ points: [0, oB, canvasWidthPx, oB], color: '#38bdf8' });
        }
      });
    }

    node.x(newX);
    node.y(newY);
    setGuideLines(newGuides);
  };

  const handleDragEnd = (e: any, draggingEl: RenderElement) => {
    setGuideLines([]);
    const evt = e.evt as MouseEvent;

    // Alt + Drag to Duplicate
    if (evt && evt.altKey && onDuplicateElement) {
      onDuplicateElement(draggingEl.id);
    }

    const nextX = Math.round(e.target.x() / MM_TO_PX);
    const nextY = Math.round(e.target.y() / MM_TO_PX);
    onChangeElement({ ...draggingEl, x: nextX, y: nextY });
  };

  const getDisplayText = (el: RenderElement) => {
    if (el.binding && sampleRecord) {
      const val = sampleRecord.recordData[el.binding];
      if (val !== undefined && val !== null) return String(val);
    }
    let text = el.text || 'Text Element';
    if (sampleRecord) {
      text = text.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
        const val = sampleRecord.recordData[key.trim()];
        return val !== undefined && val !== null ? String(val) : `{{${key}}}`;
      });
    }
    return text;
  };

  // Render Grid lines
  const gridLines: React.ReactNode[] = [];
  if (showGrid) {
    const minorStep = gridSpacingPx;
    const majorStep = gridSpacingPx * 5;

    // Vertical lines
    for (let x = 0; x <= canvasWidthPx; x += minorStep) {
      const isMajor = x % majorStep === 0;
      gridLines.push(
        <Line
          key={`v_${x}`}
          points={[x, 0, x, canvasHeightPx]}
          stroke={isMajor ? '#475569' : '#1e293b'}
          strokeWidth={isMajor ? 0.8 : 0.4}
          dash={isMajor ? undefined : [2, 2]}
        />
      );
    }
    // Horizontal lines
    for (let y = 0; y <= canvasHeightPx; y += minorStep) {
      const isMajor = y % majorStep === 0;
      gridLines.push(
        <Line
          key={`h_${y}`}
          points={[0, y, canvasWidthPx, y]}
          stroke={isMajor ? '#475569' : '#1e293b'}
          strokeWidth={isMajor ? 0.8 : 0.4}
          dash={isMajor ? undefined : [2, 2]}
        />
      );
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[520px] w-full overflow-auto">
      <div
        className="shadow-2xl rounded-lg overflow-hidden border border-slate-700/80 relative"
        style={{
          width: canvasWidthPx * zoom,
          height: canvasHeightPx * zoom,
          backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : '#0f172a',
          cursor: isSpacePressed ? 'grab' : 'default',
        }}
      >
        <Stage
          ref={stageRef}
          width={canvasWidthPx * zoom}
          height={canvasHeightPx * zoom}
          scaleX={zoom}
          scaleY={zoom}
          draggable={isSpacePressed}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onTouchStart={handleStageMouseDown}
        >
          {/* Background Layer */}
          <Layer>
            <Rect
              name="bg-rect"
              x={0}
              y={0}
              width={canvasWidthPx}
              height={canvasHeightPx}
              fill={backgroundColor !== 'transparent' ? backgroundColor : '#0f172a'}
            />

            {/* Tracing Reference Image Layer */}
            {referenceImage && onChangeReferenceImage && (
              <ReferenceImageLayerNode
                config={referenceImage}
                onUpdate={onChangeReferenceImage}
              />
            )}

            {/* Grid Overlay */}
            {showGrid && <Group>{gridLines}</Group>}
          </Layer>

          {/* Design Elements Layer */}
          <Layer>
            {elements.map((el) => {
              if (el.visible === false) return null;
              const isSelected = selectedElementIds.includes(el.id);
              const isLocked = !!el.locked;
              const xPx = el.x * MM_TO_PX;
              const yPx = el.y * MM_TO_PX;
              const wPx = el.width * MM_TO_PX;
              const hPx = el.height * MM_TO_PX;

              const commonProps = {
                key: el.id,
                ref: (node: any) => {
                  if (node) nodesMapRef.current.set(el.id, node);
                  else nodesMapRef.current.delete(el.id);
                },
                draggable: !isLocked && !isSpacePressed,
                onClick: (e: any) => {
                  e.cancelBubble = true;
                  onSelectElement(el.id, e.evt.shiftKey);
                },
                onTap: (e: any) => {
                  e.cancelBubble = true;
                  onSelectElement(el.id, false);
                },
                onDragMove: (e: any) => handleDragMove(e, el),
                onDragEnd: (e: any) => handleDragEnd(e, el),
                onTransformEnd: (e: any) => {
                  const node = e.target;
                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();
                  node.scaleX(1);
                  node.scaleY(1);

                  const nextW = Math.max(2, Math.round((node.width() * scaleX) / MM_TO_PX));
                  const nextH = Math.max(2, Math.round((node.height() * scaleY) / MM_TO_PX));
                  const nextX = Math.round(node.x() / MM_TO_PX);
                  const nextY = Math.round(node.y() / MM_TO_PX);

                  onChangeElement({
                    ...el,
                    x: nextX,
                    y: nextY,
                    width: nextW,
                    height: nextH,
                    rotation: Math.round(node.rotation()),
                  });
                },
              };

              if (el.type === 'shape') {
                if (el.shapeType === 'circle') {
                  return (
                    <Circle
                      {...commonProps}
                      x={xPx + wPx / 2}
                      y={yPx + hPx / 2}
                      radius={wPx / 2}
                      fill={el.fill || '#1e293b'}
                      stroke={el.stroke || '#38bdf8'}
                      strokeWidth={(el.strokeWidth || 0.25) * MM_TO_PX}
                      opacity={el.opacity ?? 1}
                      rotation={el.rotation || 0}
                    />
                  );
                }
                return (
                  <Rect
                    {...commonProps}
                    x={xPx}
                    y={yPx}
                    width={wPx}
                    height={hPx}
                    fill={el.fill || '#1e293b'}
                    stroke={el.stroke || '#38bdf8'}
                    strokeWidth={(el.strokeWidth || 0.25) * MM_TO_PX}
                    opacity={el.opacity ?? 1}
                    rotation={el.rotation || 0}
                  />
                );
              }

              if (el.type === 'photo_placeholder') {
                return (
                  <Rect
                    {...commonProps}
                    x={xPx}
                    y={yPx}
                    width={wPx}
                    height={hPx}
                    fill={el.fill || '#1e293b'}
                    stroke={el.stroke || '#38bdf8'}
                    strokeWidth={(el.strokeWidth || 0.5) * MM_TO_PX}
                    dash={[4, 4]}
                    opacity={el.opacity ?? 1}
                    rotation={el.rotation || 0}
                  />
                );
              }

              if (el.type === 'barcode') {
                return (
                  <Rect
                    {...commonProps}
                    x={xPx}
                    y={yPx}
                    width={wPx}
                    height={hPx}
                    fill="#ffffff"
                    stroke="#000000"
                    strokeWidth={1}
                    opacity={el.opacity ?? 1}
                    rotation={el.rotation || 0}
                  />
                );
              }

              if (el.type === 'text') {
                const textStr = getDisplayText(el);
                return (
                  <KonvaText
                    {...commonProps}
                    x={xPx}
                    y={yPx}
                    width={wPx}
                    height={hPx}
                    text={textStr}
                    fontSize={(el.style?.fontSize || 8) * (MM_TO_PX / 2.5)}
                    fontFamily={el.style?.fontFamily || 'Inter'}
                    fontStyle={el.style?.fontWeight === 'bold' ? 'bold' : 'normal'}
                    fill={el.style?.color || '#ffffff'}
                    align={el.style?.align || 'left'}
                    opacity={el.opacity ?? 1}
                    rotation={el.rotation || 0}
                  />
                );
              }

              return null;
            })}

            {/* Smart Snap Alignment Guides */}
            {guideLines.map((g, idx) => (
              <Line key={`guide_${idx}`} points={g.points} stroke={g.color} strokeWidth={1} dash={[4, 4]} />
            ))}

            {/* Marquee Selection Box */}
            {selectionBox.isSelecting && (
              <Rect
                x={Math.min(selectionBox.startX, selectionBox.currentX)}
                y={Math.min(selectionBox.startY, selectionBox.currentY)}
                width={Math.abs(selectionBox.currentX - selectionBox.startX)}
                height={Math.abs(selectionBox.currentY - selectionBox.startY)}
                fill="rgba(56, 189, 248, 0.15)"
                stroke="#38bdf8"
                strokeWidth={1}
                dash={[3, 3]}
              />
            )}

            {/* Transformer Controls */}
            {selectedElementIds.length > 0 && (
              <Transformer
                ref={transformerRef}
                rotateEnabled={true}
                keepRatio={false}
                borderStroke="#38bdf8"
                anchorStroke="#38bdf8"
                anchorFill="#020617"
                anchorSize={8}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 5 || newBox.height < 5) return oldBox;
                  return newBox;
                }}
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};
