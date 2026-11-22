import { isExtremeCardId } from './conventions';

/** Spec section 3: history entries of cards that no longer exist are pruned on load. */
export function pruneHistory(
  history: Readonly<Record<string, number>>,
  knownIds: ReadonlySet<string>,
  extremeLoaded: boolean,
): Readonly<Record<string, number>> {
  const entries = Object.entries(history);
  const kept = entries.filter(([id]) => knownIds.has(id) || (!extremeLoaded && isExtremeCardId(id)));
  return kept.length === entries.length ? history : Object.fromEntries(kept);
}
