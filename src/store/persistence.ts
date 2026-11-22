export type PersistenceResult = 'UNSUPPORTED' | 'GRANTED' | 'DENIED';

/** Call from a user gesture. Chrome decides by heuristics, so DENIED is a normal answer (spec section 3). */
export async function requestPersistence(storage: StorageManager | undefined): Promise<PersistenceResult> {
  if (storage === undefined || typeof storage.persist !== 'function') return 'UNSUPPORTED';
  return (await storage.persist()) ? 'GRANTED' : 'DENIED';
}
