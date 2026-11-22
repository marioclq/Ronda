export interface Box {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

/** True when a tap at (x, y) falls outside the box: on a dialog's backdrop rather than on the sheet. */
export function isOutside(box: Box, x: number, y: number): boolean {
  return x < box.left || x > box.right || y < box.top || y > box.bottom;
}
