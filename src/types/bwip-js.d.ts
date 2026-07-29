declare module 'bwip-js' {
  export function toCanvas(
    canvas: HTMLCanvasElement | string,
    opts: Record<string, any>
  ): HTMLCanvasElement;
  export function toBuffer(opts: Record<string, any>): Promise<Buffer>;
}
