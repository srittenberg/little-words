import { Word } from './types';
import wordsData from '../data/words.json';

export function getWords(): Word[] {
  const words = wordsData as Word[];
  // Sort alphabetically by label
  return [...words].sort((a, b) => a.label.localeCompare(b.label));
}
