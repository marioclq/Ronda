import raw from '../../content/date/aron-36.json';
import type { DateQuestion, DateSet } from '../core/date/session';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Validates the question file. Questions must be numbered 1..n in order; the procedure plays them in order. */
export function parseDateQuestions(data: unknown): DateQuestion[] {
  if (!isRecord(data) || !Array.isArray(data.questions)) {
    throw new Error(`Date questions file must be { questions: [...] }, got ${JSON.stringify(data)?.slice(0, 120)}`);
  }
  return data.questions.map((item: unknown, index: number): DateQuestion => {
    const where = `questions[${index}]`;
    if (!isRecord(item)) throw new Error(`${where} must be an object, got ${JSON.stringify(item)}`);
    const { number, set, text, timerSeconds } = item;
    if (number !== index + 1) throw new Error(`${where}: questions must be numbered in order; expected ${index + 1}, got ${JSON.stringify(number)}`);
    if (set !== 1 && set !== 2 && set !== 3) throw new Error(`${where}: set must be 1, 2 or 3, got ${JSON.stringify(set)}`);
    if (typeof text !== 'string' || text.trim() === '') throw new Error(`${where}: text must be a non-empty string`);
    if (timerSeconds !== undefined && (typeof timerSeconds !== 'number' || !Number.isInteger(timerSeconds) || timerSeconds < 1)) {
      throw new Error(`${where}: timerSeconds must be a positive integer, got ${JSON.stringify(timerSeconds)}`);
    }
    return { number, set: set as DateSet, text, ...(timerSeconds === undefined ? {} : { timerSeconds }) };
  });
}

const questions = parseDateQuestions(raw);

export function loadDateQuestions(): readonly DateQuestion[] {
  return questions;
}
