import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { DEFAULT_DB_NAME, IndexedDbStore, RECORD_KEY, STORE_NAME } from './indexedDbStore';
import { emptyUserState, UserStateError, type UserState } from './userState';

function uniqueDb(): string {
  return `${DEFAULT_DB_NAME}-test-${crypto.randomUUID()}`;
}

function openRaw(dbName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(`cannot open ${dbName}`));
  });
}

async function putRaw(dbName: string, value: unknown): Promise<void> {
  const db = await openRaw(dbName);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error('putRaw failed'));
    tx.objectStore(STORE_NAME).put(value, RECORD_KEY);
  });
  db.close();
}

async function getRaw(dbName: string): Promise<unknown> {
  const db = await openRaw(dbName);
  const value = await new Promise<unknown>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(RECORD_KEY);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('getRaw failed'));
  });
  db.close();
  return value;
}

describe('IndexedDbStore', () => {
  it('returns an empty state the first time', async () => {
    expect(await new IndexedDbStore(uniqueDb()).load()).toEqual(emptyUserState());
  });

  it('returns what was saved', async () => {
    const dbName = uniqueDb();
    const state: UserState = {
      ...emptyUserState(),
      players: [{ id: 'p1', name: 'Ana', gender: 'WOMAN', attractedTo: 'ANYONE' }],
      history: { 'starter-soft-001': 5 },
    };
    await new IndexedDbStore(dbName).save(state);
    expect(await new IndexedDbStore(dbName).load()).toEqual(state);
  });

  it('fails on a corrupt record and leaves the record untouched', async () => {
    const dbName = uniqueDb();
    const corrupt = { schemaVersion: 1, players: 'not-an-array' };
    await putRaw(dbName, corrupt);
    await expect(new IndexedDbStore(dbName).load()).rejects.toBeInstanceOf(UserStateError);
    expect(await getRaw(dbName)).toEqual(corrupt);
  });

  it('fails on an unknown schemaVersion and leaves the record untouched', async () => {
    const dbName = uniqueDb();
    const future = { ...emptyUserState(), schemaVersion: 7 };
    await putRaw(dbName, future);
    await expect(new IndexedDbStore(dbName).load()).rejects.toThrow('schemaVersion');
    expect(await getRaw(dbName)).toEqual(future);
  });
});
