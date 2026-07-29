import React from 'react';
import { RenderElement } from '../../types';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalSpaceAround,
  AlignVerticalJustifyEnd,
  Maximize2,
  Minimize2,
  Grid,
  Columns,
  Rows
} from 'lucide-react';

interface AlignmentToolbarProps {
  selectedElementIds: string[];
  elements: RenderElement[];
  onChangeElements: (updated: RenderElement[]) => void;
  widthMm: number;
  heightMm: number;
}

export const AlignmentToolbar: React.FC<AlignmentToolbarProps> = ({
  selectedElementIds,
  elements,
  onChangeElements,
  widthMm,
  heightMm,
}) => {
  if (selectedElementIds.length === 0) return null;

  const selectedEls = elements.filter((el) => selectedElementIds.includes(el.id));

  const applyTransformation = (transformFn: (els: RenderElement[]) => RenderElement[]) => {
    const updatedSelected = transformFn(selectedEls);
    const updatedMap = new Map(updatedSelected.map((el) => [el.id, el]));
    const nextElements = elements.map((el) => updatedMap.get(el.id) || el);
    onChangeElements(nextElements);
  };

  // Alignments
  const handleAlignLeft = () => {
    if (selectedEls.length === 1) {
      applyTransformation(([el]) => [{ ...el, x: 0 }]);
    } else {
      const minX = Math.min(...selectedEls.map((el) => el.x));
      applyTransformation((els) => els.map((el) => ({ ...el, x: minX })));
    }
  };

  const handleAlignCenter = () => {
    if (selectedEls.length === 1) {
      applyTransformation(([el]) => [{ ...el, x: (widthMm - el.width) / 2 }]);
    } else {
      const minX = Math.min(...selectedEls.map((el) => el.x));
      const maxX = Math.max(...selectedEls.map((el) => el.x + el.width));
      const centerX = (minX + maxX) / 2;
      applyTransformation((els) => els.map((el) => ({ ...el, x: centerX - el.width / 2 })));
    }
  };

  const handleAlignRight = () => {
    if (selectedEls.length === 1) {
      applyTransformation(([el]) => [{ ...el, x: widthMm - el.width }]);
    } else {
      const maxX = Math.max(...selectedEls.map((el) => el.x + el.width));
      applyTransformation((els) => els.map((el) => ({ ...el, x: maxX - el.width })));
    }
  };

  const handleAlignTop = () => {
    if (selectedEls.length === 1) {
      applyTransformation(([el]) => [{ ...el, y: 0 }]);
    } else {
      const minY = Math.min(...selectedEls.map((el) => el.y));
      applyTransformation((els) => els.map((el) => ({ ...el, y: minY })));
    }
  };

  const handleAlignMiddle = () => {
    if (selectedEls.length === 1) {
      applyTransformation(([el]) => [{ ...el, y: (heightMm - el.height) / 2 }]);
    } else {
      const minY = Math.min(...selectedEls.map((el) => el.y));
      const maxY = Math.max(...selectedEls.map((el) => el.y + el.height));
      const centerY = (minY + maxY) / 2;
      applyTransformation((els) => els.map((el) => ({ ...el, y: centerY - el.height / 2 })));
    }
  };

  const handleAlignBottom = () => {
    if (selectedEls.length === 1) {
      applyTransformation(([el]) => [{ ...el, y: heightMm - el.height }]);
    } else {
      const maxY = Math.max(...selectedEls.map((el) => el.y + el.height));
      applyTransformation((els) => els.map((el) => ({ ...el, y: maxY - el.height })));
    }
  };

  // Distributions
  const handleDistributeHorizontal = () => {
    if (selectedEls.length < 3) return;
    const sorted = [...selectedEls].sort((a, b) => a.x - b.x);
    const minX = sorted[0].x;
    const maxX = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width;
    const totalWidths = sorted.reduce((sum, el) => sum + el.width, 0);
    const gap = (maxX - minX - totalWidths) / (sorted.length - 1);

    let currentX = minX;
    const nextEls = sorted.map((el) => {
      const updated = { ...el, x: currentX };
      currentX += el.width + gap;
      return updated;
    });
    applyTransformation(() => nextEls);
  };

  const handleDistributeVertical = () => {
    if (selectedEls.length < 3) return;
    const sorted = [...selectedEls].sort((a, b) => a.y - b.y);
    const minY = sorted[0].y;
    const maxY = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
    const totalHeights = sorted.reduce((sum, el) => sum + el.height, 0);
    const gap = (maxY - minY - totalHeights) / (sorted.length - 1);

    let currentY = minY;
    const nextEls = sorted.map((el) => {
      const updated = { ...el, y: currentY };
      currentY += el.height + gap;
      return updated;
    });
    applyTransformation(() => nextEls);
  };

  // Same Dimensions
  const handleSameWidth = () => {
    if (selectedEls.length < 2) return;
    const maxWidth = Math.max(...selectedEls.map((el) => el.width));
    applyTransformation((els) => els.map((el) => ({ ...el, width: maxWidth })));
  };

  const handleSameHeight = () => {
    if (selectedEls.length < 2) return;
    const maxHeight = Math.max(...selectedEls.map((el) => el.height));
    applyTransformation((els) => els.map((el) => ({ ...el, height: maxHeight })));
  };

  return (
    <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl shadow-lg">
      <span className="text-[10px] text-slate-400 uppercase font-bold px-2 border-r border-slate-800">
        Align ({selectedElementIds.length})
      </span>

      {/* Horizontal Alignment */}
      <button
        onClick={handleAlignLeft}
        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        title="Align Left"
      >
        <AlignLeft className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={handleAlignCenter}
        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        title="Align Center"
      >
        <AlignCenter className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={handleAlignRight}
        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        title="Align Right"
      >
        <AlignRight className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-slate-800 mx-0.5" />

      {/* Vertical Alignment */}
      <button
        onClick={handleAlignTop}
        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        title="Align Top"
      >
        <AlignVerticalJustifyStart className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={handleAlignMiddle}
        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        title="Align Middle"
      >
        <AlignVerticalSpaceAround className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={handleAlignBottom}
        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        title="Align Bottom"
      >
        <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />
      </button>

      {selectedElementIds.length >= 2 && (
        <>
          <div className="h-4 w-px bg-slate-800 mx-0.5" />

          {/* Distribute Spacing */}
          {selectedElementIds.length >= 3 && (
            <>
              <button
                onClick={handleDistributeHorizontal}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Distribute Horizontally"
              >
                <Columns className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDistributeVertical}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Distribute Vertically"
              >
                <Rows className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Match Size */}
          <button
            onClick={handleSameWidth}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-[11px] font-mono px-2"
            title="Match Same Width"
          >
            Same W
          </button>
          <button
            onClick={handleSameHeight}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-[11px] font-mono px-2"
            title="Match Same Height"
          >
            Same H
          </button>
        </>
      )}
    </div>
  );
};
