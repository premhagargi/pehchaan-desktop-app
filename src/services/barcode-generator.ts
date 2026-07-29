import bwipjs from 'bwip-js';
import { BarcodeOptions } from '../types';

export async function generateBarcodeDataUrl(
  text: string,
  options: BarcodeOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const bcid = options.symbology || 'qrcode';
      const canvas = document.createElement('canvas');
      bwipjs.toCanvas(canvas, {
        bcid: bcid === 'code128' ? 'code128' : bcid === 'ean13' ? 'ean13' : bcid === 'code39' ? 'code39' : 'qrcode',
        text: text || 'SAMPLE123',
        scale: options.scale || 3,
        height: bcid === 'qrcode' ? 20 : 10,
        includetext: options.includeText ?? false,
        textxalign: 'center',
      });
      resolve(canvas.toDataURL('image/png'));
    } catch (e) {
      console.warn('BWIP barcode generation error:', e);
      // Fallback SVG data URL
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#f87171"/><text x="50" y="55" font-size="12" fill="#fff" text-anchor="middle">ERR</text></svg>`;
      resolve(`data:image/svg+xml;base64,${btoa(svg)}`);
    }
  });
}
