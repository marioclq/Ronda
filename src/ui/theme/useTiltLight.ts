import { useEffect } from 'react';
import { tiltFromOrientation } from './tilt';

/**
 * Feeds the phone's tilt into --tilt-x and --tilt-y on <html>, so the glass's rim light and film move like
 * they sit under a real lamp. Off with reduced motion or when disabled. Chromium (Android WebView included)
 * delivers orientation events without a prompt; iOS Safari delivers none until a permission this app does not
 * ask for, so there the glass simply keeps its fixed light.
 */
export function useTiltLight(enabled: boolean): void {
  useEffect(() => {
    const root = document.documentElement;
    const reset = (): void => {
      root.style.setProperty('--tilt-x', '0');
      root.style.setProperty('--tilt-y', '0');
    };
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!enabled || motion.matches || typeof DeviceOrientationEvent === 'undefined') {
      reset();
      return;
    }
    let frame = 0;
    let latest: DeviceOrientationEvent | null = null;
    const apply = (): void => {
      frame = 0;
      if (latest === null) return;
      const { x, y } = tiltFromOrientation(latest.beta, latest.gamma);
      root.style.setProperty('--tilt-x', x.toFixed(3));
      root.style.setProperty('--tilt-y', y.toFixed(3));
    };
    const onOrientation = (event: DeviceOrientationEvent): void => {
      latest = event;
      if (frame === 0) frame = window.requestAnimationFrame(apply);
    };
    window.addEventListener('deviceorientation', onOrientation);
    return () => {
      window.removeEventListener('deviceorientation', onOrientation);
      if (frame !== 0) window.cancelAnimationFrame(frame);
      reset();
    };
  }, [enabled]);
}
