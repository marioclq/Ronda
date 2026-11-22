import { emptyUserState, parseUserState, type UserState } from './userState';
import type { UserStore } from './userStore';

export const DEFAULT_DB_NAME = 'party-questions';
export const STORE_NAME = 'state';
export const RECORD_KEY = 'user-state';

function describe(error: DOMException | null): string {
  return error === null ? 'unknown error' : `${error.name}: ${error.message}`;
}

/** The whole UserState lives in one record, so every save is one atomic transaction. */
export class IndexedDbStore implements UserStore {
  private connection: Promise<IDBDatabase> | null = null;

  constructor(private readonly dbName: string = DEFAULT_DB_NAME) {}

  private open(): Promise<IDBDatabase> {
    if (this.connection === null) {
      this.connection = new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(this.dbName, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error(`Cannot open IndexedDB "${this.dbName}": ${describe(request.error)}`));
        request.onblocked = () => reject(new Error(`IndexedDB "${this.dbName}" is blocked by another open connection`));
      }).catch((error: unknown) => {
        this.connection = null;
        throw error;
      });
    }
    return this.connection;
  }

  async load(): Promise<UserState> {
    const db = await this.open();
    const raw = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(RECORD_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Reading "${this.dbName}/${RECORD_KEY}" failed: ${describe(request.error)}`));
    });
    if (raw === undefined) return emptyUserState();
    return parseUserState(raw, `IndexedDB ${this.dbName}/${RECORD_KEY}`);
  }

  async save(state: UserState): Promise<void> {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error(`Saving user state to "${this.dbName}" failed: ${describe(tx.error)}`));
      tx.onabort = () => reject(new Error(`Saving user state to "${this.dbName}" was aborted: ${describe(tx.error)}`));
      tx.objectStore(STORE_NAME).put(state, RECORD_KEY);
    });
  }
}
