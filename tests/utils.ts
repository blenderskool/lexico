import { getPath } from '../src/utils';

export const pick = <T extends Object, U>(data: T[], path: string): U[] =>
  data.map((item) => getPath<U, T>(item, path));

export const exclude = <T>(s1: T[], s2: T[]): T[] => s1.filter((item) => !s2.includes(item));
