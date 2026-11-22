interface NavigatorWithBrands extends Navigator {
  readonly userAgentData?: { readonly brands: readonly { readonly brand: string }[] };
}

/**
 * Only Chromium renders `backdrop-filter: url(#svg-filter)` (Safari and Firefox ignore it, see decision 1).
 * Whether Chrome for Android renders feDisplacementMap inside it is NOT verified: check on the phone (Task 15, step 8).
 */
export function supportsRefraction(): boolean {
  const brands = (navigator as NavigatorWithBrands).userAgentData?.brands;
  const isChromium = brands !== undefined && brands.some((entry) => entry.brand === 'Chromium');
  return isChromium && CSS.supports('backdrop-filter', 'url(#probe)');
}
