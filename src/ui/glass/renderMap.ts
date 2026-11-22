import { renderDisplacementPixels, type LensSpec } from './displacementMap';

/** Draws the displacement map on a canvas and returns it as a PNG data URI (allowed by img-src data:). */
export function renderDisplacementMapUrl(spec: LensSpec): string {
  const canvas = document.createElement('canvas');
  canvas.width = spec.width;
  canvas.height = spec.height;
  const context = canvas.getContext('2d');
  if (context === null) throw new Error(`Cannot get a 2D canvas context for a ${spec.width}x${spec.height} displacement map`);
  context.putImageData(new ImageData(renderDisplacementPixels(spec), spec.width, spec.height), 0, 0);
  return canvas.toDataURL('image/png');
}
