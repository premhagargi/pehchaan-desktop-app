import React from 'react';
import { ReferenceImageConfig, RenderElement } from '../../types';
import {
  Image,
  Upload,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  RefreshCw,
  Sparkles,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface ReferenceImagePanelProps {
  referenceImage?: ReferenceImageConfig;
  onChangeReferenceImage: (refImg?: ReferenceImageConfig) => void;
  widthMm: number;
  heightMm: number;
  onConvertToPrintableElement: (el: RenderElement) => void;
}

export const ReferenceImagePanel: React.FC<ReferenceImagePanelProps> = ({
  referenceImage,
  onChangeReferenceImage,
  widthMm,
  heightMm,
  onConvertToPrintableElement,
}) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        const cardAspect = widthMm / heightMm;
        let w = widthMm;
        let h = heightMm;
        if (aspect > cardAspect) {
          h = widthMm / aspect;
        } else {
          w = heightMm * aspect;
        }

        const newRef: ReferenceImageConfig = {
          id: 'ref_' + Math.random().toString(36).substring(2, 8),
          url: dataUrl,
          opacity: 0.5,
          visible: true,
          locked: true,
          scaleMode: 'fit',
          x: (widthMm - w) / 2,
          y: (heightMm - h) / 2,
          width: w,
          height: h,
        };
        onChangeReferenceImage(newRef);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleConvert = () => {
    if (!referenceImage) return;
    const el: RenderElement = {
      id: 'el_' + Math.random().toString(36).substring(2, 8),
      name: 'Artwork / Traced Image',
      type: 'image',
      x: referenceImage.x,
      y: referenceImage.y,
      width: referenceImage.width,
      height: referenceImage.height,
      rotation: 0,
      opacity: referenceImage.opacity,
      imageKey: referenceImage.url,
      visible: true,
      locked: false,
    };
    onConvertToPrintableElement(el);
    // Remove reference image after converting
    onChangeReferenceImage(undefined);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Image className="w-4 h-4 text-emerald-400" />
          Tracing Reference Image
        </h3>
        <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          Non-Printing
        </span>
      </div>

      {!referenceImage ? (
        <div className="text-center py-4">
          <label className="cursor-pointer block border border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 transition-colors">
            <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
            <span className="text-xs font-medium text-slate-300 block mb-1">
              Import Tracing Image (JPG / PNG)
            </span>
            <span className="text-[10px] text-slate-500 block">
              Used as a background guide for layout tracing. Never exports to PDF.
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-3 text-xs">
          {/* Controls Bar */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-xl">
            <div className="flex items-center gap-1">
              {/* Visible toggle */}
              <button
                onClick={() =>
                  onChangeReferenceImage({ ...referenceImage, visible: !referenceImage.visible })
                }
                className={`p-1.5 rounded-lg border ${
                  referenceImage.visible
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-800 text-slate-500'
                }`}
                title={referenceImage.visible ? 'Hide Reference' : 'Show Reference'}
              >
                {referenceImage.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>

              {/* Lock toggle */}
              <button
                onClick={() =>
                  onChangeReferenceImage({ ...referenceImage, locked: !referenceImage.locked })
                }
                className={`p-1.5 rounded-lg border ${
                  referenceImage.locked
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                    : 'border-slate-800 text-slate-500'
                }`}
                title={referenceImage.locked ? 'Unlock Reference' : 'Lock Reference'}
              >
                {referenceImage.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-1">
              {/* Replace */}
              <label className="p-1.5 text-slate-400 hover:text-white cursor-pointer" title="Replace Image">
                <RefreshCw className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Delete */}
              <button
                onClick={() => onChangeReferenceImage(undefined)}
                className="p-1.5 text-slate-400 hover:text-rose-400"
                title="Remove Reference"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Opacity Slider */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Opacity</span>
              <span className="font-mono text-white">{Math.round(referenceImage.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={referenceImage.opacity}
              onChange={(e) =>
                onChangeReferenceImage({ ...referenceImage, opacity: parseFloat(e.target.value) })
              }
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Scale Presets */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() =>
                onChangeReferenceImage({
                  ...referenceImage,
                  scaleMode: 'fit',
                  x: 0,
                  y: 0,
                  width: widthMm,
                  height: heightMm,
                })
              }
              className="py-1 px-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 flex items-center justify-center gap-1"
            >
              <Minimize2 className="w-3 h-3" /> Fit to Card
            </button>
            <button
              onClick={() =>
                onChangeReferenceImage({
                  ...referenceImage,
                  scaleMode: 'fill',
                  x: 0,
                  y: 0,
                  width: widthMm,
                  height: heightMm,
                })
              }
              className="py-1 px-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 flex items-center justify-center gap-1"
            >
              <Maximize2 className="w-3 h-3" /> Fill Card
            </button>
          </div>

          {/* Convert to Printable Element Button */}
          <button
            onClick={handleConvert}
            className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold hover:bg-emerald-500/20 text-[11px] flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Convert to Printable Element
          </button>
        </div>
      )}
    </div>
  );
};
