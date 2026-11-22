import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useGlassStyle } from '../../app/GlassStyleContext';
import { Glass, type GlassProps } from '../components/Glass';
import { effectiveBezel, lensPrimitives } from './lensFilter';
import { renderDisplacementMapUrl } from './renderMap';
import { supportsRefraction } from './supportsRefraction';

function systemReducesTransparency(): boolean {
  return window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
}

interface Shape {
  readonly width: number;
  readonly height: number;
  readonly radius: number;
}

/**
 * Glass that bends what is behind it at the rim (Chromium, including Android WebView); plain frosted glass elsewhere.
 * The lens follows the element's real size and corner radius and is redrawn when either changes.
 */
export function LensGlass({ style, children, ...rest }: GlassProps) {
  const { style: glass } = useGlassStyle();
  const supported = useMemo(() => supportsRefraction(), []) && !glass.reduceTransparency && !systemReducesTransparency();
  const ref = useRef<HTMLDivElement>(null);
  const filterId = `lens-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [shape, setShape] = useState<Shape | null>(null);
  const lens = { curvature: glass.curvature, bezel: glass.rimDepth, dispersion: glass.dispersion, magnify: glass.magnify };

  useEffect(() => {
    const element = ref.current;
    if (!supported || element === null) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry === undefined) return;
      const width = Math.round(entry.borderBoxSize[0]?.inlineSize ?? 0);
      const height = Math.round(entry.borderBoxSize[0]?.blockSize ?? 0);
      if (width < 8 || height < 8) return;
      const radius = Math.min(parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0, width / 2, height / 2);
      setShape((current) =>
        current?.width === width && current.height === height && current.radius === radius ? current : { width, height, radius },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [supported]);

  const bezel = shape === null ? 0 : effectiveBezel(lens.bezel, shape.width, shape.height);
  const mapUrl = useMemo(
    () => (supported && shape !== null ? renderDisplacementMapUrl({ ...shape, bezel, magnify: lens.magnify }) : null),
    [supported, shape, bezel, lens.magnify],
  );
  const primitives = mapUrl === null || shape === null ? null : lensPrimitives(mapUrl, shape.width, shape.height, bezel, lens);
  // Blur after bending stays light so the bend at the rim reads; the frost elsewhere comes from the glass tokens.
  const backdrop = `url(#${filterId}) blur(${(glass.frost / 3).toFixed(1)}px) saturate(${glass.saturation / 100})`;

  return (
    <>
      {primitives === null || shape === null ? null : (
        <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
          <filter id={filterId} x="0" y="0" width={shape.width} height={shape.height} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            {primitives.map(({ tag: Tag, attrs }, index) => (
              <Tag key={index} {...attrs} />
            ))}
          </filter>
        </svg>
      )}
      <Glass
        ref={ref}
        data-refract={primitives === null ? undefined : 'true'}
        style={primitives === null ? style : { ...style, backdropFilter: backdrop, WebkitBackdropFilter: backdrop }}
        {...rest}
      >
        {children}
      </Glass>
    </>
  );
}
