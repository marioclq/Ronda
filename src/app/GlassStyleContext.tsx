import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_GLASS, type GlassStyle } from '../store/glassStyle';
import { glassCssVars } from '../ui/theme/glassVars';
import { useUserState } from './UserStateContext';

interface GlassStyleApi {
  /** The look in effect: a live preview while tuning, else the saved one, else the defaults. */
  readonly style: GlassStyle;
  /** Shows a style without saving it (null ends the preview). */
  preview(style: GlassStyle | null): void;
}

const Context = createContext<GlassStyleApi | null>(null);

export function useGlassStyle(): GlassStyleApi {
  const value = useContext(Context);
  if (value === null) throw new Error('useGlassStyle must be used inside GlassStyleProvider');
  return value;
}

/** Applies the glass style to <html>: --lg-* variables, the tint colour and data-rt for reduced transparency. */
export function GlassStyleProvider({ children }: { children: ReactNode }) {
  const { state } = useUserState();
  const [previewed, setPreviewed] = useState<GlassStyle | null>(null);
  const style = previewed ?? state.settings.glass ?? DEFAULT_GLASS;

  useEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(glassCssVars(style))) root.style.setProperty(name, value);
    root.dataset.glassTint = style.tintColor;
    root.toggleAttribute('data-rt', style.reduceTransparency);
  }, [style]);

  const api = useMemo<GlassStyleApi>(() => ({ style, preview: setPreviewed }), [style]);
  return <Context.Provider value={api}>{children}</Context.Provider>;
}
