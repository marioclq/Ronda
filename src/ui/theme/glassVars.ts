import type { GlassStyle } from '../../store/glassStyle';

/** The CSS custom properties that carry a glass style (see the --lg-* block in tokens.css). */
export function glassCssVars(style: GlassStyle): Readonly<Record<string, string>> {
  return {
    '--lg-frost': `${style.frost}px`,
    '--lg-saturation': String(style.saturation / 100),
    '--lg-tint': String(style.tint),
    '--lg-film': String(style.film),
    '--lg-rim': String(style.rim),
    '--lg-depth': String(style.depth),
  };
}
