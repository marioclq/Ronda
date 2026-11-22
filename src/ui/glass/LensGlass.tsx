import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Glass, type GlassProps } from '../components/Glass';
import { renderDisplacementMapUrl } from './renderMap';
import { supportsRefraction } from './supportsRefraction';

const RADIUS = 34; // matches --radius-lg
const BEZEL = 28;
const SCALE = 46; // feDisplacementMap scale in px: how far the rim bends the backdrop

interface Size {
  readonly width: number;
  readonly height: number;
}

/** Glass with an SVG refraction layer on the rim when the browser can render it; plain glass otherwise. */
export function LensGlass({ style, children, ...rest }: GlassProps) {
  const supported = useMemo(() => supportsRefraction(), []);
  const ref = useRef<HTMLDivElement>(null);
  const filterId = `lens-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [size, setSize] = useState<Size | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!supported || element === null) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry === undefined) return;
      const width = Math.round(entry.borderBoxSize[0]?.inlineSize ?? 0);
      const height = Math.round(entry.borderBoxSize[0]?.blockSize ?? 0);
      if (width > 0 && height > 0) setSize((current) => (current?.width === width && current.height === height ? current : { width, height }));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [supported]);

  const mapUrl = useMemo(
    () => (supported && size !== null ? renderDisplacementMapUrl({ ...size, radius: RADIUS, bezel: BEZEL }) : null),
    [supported, size],
  );

  return (
    <>
      {mapUrl === null || size === null ? null : (
        <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
          <filter id={filterId} x="0" y="0" width={size.width} height={size.height} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feImage href={mapUrl} x="0" y="0" width={size.width} height={size.height} result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={SCALE} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      )}
      <Glass
        ref={ref}
        data-refract={mapUrl === null ? undefined : 'true'}
        style={mapUrl === null ? style : { ...style, backdropFilter: `url(#${filterId}) blur(6px) saturate(1.8)` }}
        {...rest}
      >
        {children}
      </Glass>
    </>
  );
}
