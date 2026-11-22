import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Pack } from '../src/core/content/types';
import { ContentError, parsePack } from '../src/core/content/validator';

export const PACKS = 'content/packs';
export const DRAFTS = 'content/drafts';
export const REVIEW = 'content/review';

export function jsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return jsonFiles(full);
    return entry.name.endsWith('.json') ? [full] : [];
  });
}

/** Reads and validates one pack file. Invalid content throws ContentError; anything else is wrapped with the path. */
export function readPack(file: string): Pack {
  try {
    return parsePack(JSON.parse(readFileSync(file, 'utf8')), file);
  } catch (error) {
    if (error instanceof ContentError) throw error;
    throw new Error(`Cannot read ${file}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
