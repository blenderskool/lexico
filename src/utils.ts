import { SearchFlags } from './types';

/**
 * Expands a terse object with multiple keys sharing same values to a JS compatible object
 * @param object terse object
 * @param separator separator that separates multiple keys from the single key
 * @returns expanded object
 */
export const expand = <T>(object: Record<string, T>, separator = ', ') =>
  Object.keys(object).reduce((obj, key) => {
    key.split(separator).forEach((subkey) => {
      obj[subkey] = object[key];
    });
    return obj;
  }, {} as Record<string, T>);

/**
 * Applies "expand" utility to each object in the array.
 * @param objects array of terse objects
 * @param separator
 * @returns array of expanded objects
 */
export const expandEach = <T>(objects: Record<string, T>[], separator = ', ') =>
  objects.map((obj) => expand(obj, separator));

/**
 * Gets a value in the object selected by a dot path
 * @param obj Object
 * @param path Dot path string
 * @returns Selected field
 */
export const getPath = <R, T extends Object>(object: T, path: string) =>
  path
    .split('.')
    .filter((key) => key.length)
    .reduce((parent, key) => parent?.[key], object) as R;

/**
 * Shallow clones each element in the `data` array
 * @param data Array of elements
 * @returns A shallow clone of each element in `data`s
 */
export const clone = <T>(data: T[]) => data.map((elm) => ({ ...elm }));

/**
 * Construct a list of indexes that needs to be searched based on the search flags set.
 * @param flags Search flags
 * @returns List of indexes to be searched
 */
export const getIndexesToSearch = (flags: SearchFlags): string[] => {
  /**
   * If indexedFields is defined and (either path selector is empty or path selector is part of indexedFields),
   * only then get the indexes to search.
   */
  if (flags.indexFields.size && (!flags.path || flags.indexFields.has(flags.path)))
    return flags.path ? [flags.path] : [...flags.indexFields];

  return [];
};

export const splitWithOffsets = (str: string, delimiter: string | RegExp) => {
  const splits: [string, number][] = [];
  let prevLength = 0;

  for (const subStr of str.split(delimiter)) {
    splits.push([subStr, prevLength]);
    prevLength = prevLength + subStr.length;
  }

  return splits;
};
