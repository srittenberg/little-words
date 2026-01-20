import { Word } from './types';
import wordsData from '../data/words.json';

export function getWords(): Word[] {
  return wordsData as Word[];
}
