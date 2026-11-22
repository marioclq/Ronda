import { describe, expect, it } from 'vitest';
import { requestPersistence } from './persistence';

describe('requestPersistence', () => {
  it('reports UNSUPPORTED when the browser has no storage manager or no persist()', async () => {
    expect(await requestPersistence(undefined)).toBe('UNSUPPORTED');
    expect(await requestPersistence({} as StorageManager)).toBe('UNSUPPORTED');
  });

  it('reports what the browser decided', async () => {
    expect(await requestPersistence({ persist: () => Promise.resolve(true) } as StorageManager)).toBe('GRANTED');
    expect(await requestPersistence({ persist: () => Promise.resolve(false) } as StorageManager)).toBe('DENIED');
  });
});
