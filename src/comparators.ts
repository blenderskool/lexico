import { FullOptions, fuzzy, Searcher as FuzzySearcher } from 'fast-fuzzy';
import searchWithFlags from './search';
import {
  CmpOp,
  Comparator,
  ComparatorWithIndexing,
  Data,
  DataWithScore,
  ParseTree,
  SearchFlags,
  TokenType,
} from './types';
import { clone, getIndexesToSearch, getPath } from './utils';

const CmpOperations: Record<CmpOp, (lhs: number | string, rhs: number | string) => boolean> = {
  [TokenType.GT]: (lhs, rhs) => lhs > rhs,
  [TokenType.GTE]: (lhs, rhs) => lhs >= rhs,
  [TokenType.LT]: (lhs, rhs) => lhs < rhs,
  [TokenType.LTE]: (lhs, rhs) => lhs <= rhs,
};

/**
 * Binary comparator only includes records if they match the given query
 */
export class BinaryCmp implements Comparator {
  isAtomSimilar(data: Data, search: string | number, cmpOp?: TokenType) {
    /**
     * Checking the presence of cmpOp is important as it may be undefined,
     * in which case the fallback is equality check.
     */
    if (cmpOp && (typeof data === 'string' || typeof data === 'number')) {
      return CmpOperations[cmpOp](data, search);
    } else {
      return data.toString().toLowerCase().includes(search.toString().toLowerCase());
    }
  }

  isMatching(
    record: Data,
    search: string | number,
    { path, cmpOp }: Pick<SearchFlags, 'path' | 'cmpOp'>
  ): boolean {
    if (typeof record === 'object') {
      if (path !== undefined) {
        const selectedField = getPath<Data, Data>(record, path);

        /**
         * Currently it is assumed that the selected result here is atomic
         * value and not another object.
         *
         * Deep search is not supported and the user has to type targeted field selectors for deep objects
         */

        // if value for the selected field is undefined, don't include in search result
        return selectedField !== undefined
          ? this.isAtomSimilar(selectedField, search, cmpOp)
          : false;
      } else {
        // Todo: Deep search? Support Arrays?
        return Object.values(record).some((value) => this.isAtomSimilar(value, search, cmpOp));
      }
    } else {
      return this.isAtomSimilar(record, search, cmpOp);
    }
  }

  and(lhs: ParseTree, rhs: ParseTree, data: DataWithScore[], flags: SearchFlags): DataWithScore[] {
    const lhsData = searchWithFlags(lhs, data, this, flags);
    return searchWithFlags(rhs, lhsData, this, flags);
  }

  or(lhs: ParseTree, rhs: ParseTree, data: DataWithScore[], flags: SearchFlags): DataWithScore[] {
    const lhsData = searchWithFlags(lhs, data, this, flags);
    const rhsData = searchWithFlags(rhs, data, this, flags);

    // Set is used to remove duplicate items that matched in both lhs and rhs
    return [...new Set([...lhsData, ...rhsData])];
  }

  search(data: DataWithScore[], search: string | number, flags: SearchFlags): DataWithScore[] {
    return data.filter(({ record }) => {
      const matched = this.isMatching(record, search, flags);
      return flags.exclude ? !matched : matched;
    });
  }
}

/**
 * Fuzzy comparator assigns a quantitative score to each record based on the query.
 * Higher the score, higher is that record matching the given query
 *
 * Unlike Binary comparator, it does not include/exclude records.
 */
export class FuzzyCmp implements ComparatorWithIndexing {
  index: Record<string, FuzzySearcher<DataWithScore, FullOptions<DataWithScore>>> = {};

  /**
   * Adds a record to the index
   */
  addToIndex(path: string, key: string, data: DataWithScore) {
    this.index[path] ??= new FuzzySearcher<DataWithScore, FullOptions<DataWithScore>>([], {
      returnMatchData: true,
      keySelector: (s) => getPath<string, Data>(s.record, path).toString(),
      threshold: 0,
    });

    this.index[path].add(data);
  }

  isAtomSimilar(data: Data, search: string | number) {
    return fuzzy(search.toString(), data.toString().toLowerCase()) * 100;
  }

  /**
   * This method does not support comparison operators
   * as they are not defined for fuzzy searching
   */
  getScore(record: Data, search: string | number, { path }: Pick<SearchFlags, 'path'>) {
    if (typeof record === 'object') {
      if (path !== undefined) {
        const selectedField = getPath<Data, Data>(record, path);

        /**
         * Currently it is assumed that the selected result here is atomic
         * value and not another object.
         *
         * Deep search is not supported and the user has to type targeted field selectors for deep objects
         */

        // if value for the selected field is undefined, return a minimum score to not include it
        return selectedField !== undefined
          ? this.isAtomSimilar(selectedField, search)
          : Number.MIN_SAFE_INTEGER;
      }

      // Todo: Deep search? Support Arrays?
      return Object.values(record).reduce<number>(
        (sum, value) => sum + this.isAtomSimilar(value, search),
        0
      );
    }

    return this.isAtomSimilar(record, search);
  }

  and(lhs: ParseTree, rhs: ParseTree, data: DataWithScore[], flags: SearchFlags) {
    const lhsData = searchWithFlags(lhs, clone(data), this, flags);
    const rhsData = searchWithFlags(rhs, clone(data), this, flags);

    data.forEach(
      (item, i) =>
        (item.score =
          0.6 * Math.min(lhsData[i].score, rhsData[i].score) +
          0.4 * Math.max(lhsData[i].score, rhsData[i].score))
    );

    return data;
  }

  or(lhs: ParseTree, rhs: ParseTree, data: DataWithScore[], flags: SearchFlags) {
    const lhsData = searchWithFlags(lhs, clone(data), this, flags);
    const rhsData = searchWithFlags(rhs, clone(data), this, flags);

    data.forEach(
      (item, i) =>
        (item.score =
          0.3 * Math.max(lhsData[i].score, rhsData[i].score) +
          0.7 * Math.min(lhsData[i].score, rhsData[i].score))
    );

    return data;
  }

  search(data: DataWithScore[], search: string | number, flags: SearchFlags): DataWithScore[] {
    // Comparison operators are not defined for fuzzy search, so fallback to BinaryComparator
    if (flags.cmpOp) return new BinaryCmp().search(data, search, flags);

    const indexFields = getIndexesToSearch(flags);

    if (indexFields.length) {
      // If there are fields indexed, only search them optimally
      indexFields.forEach((field) => {
        const result = this.index[field].search(search.toString(), { returnMatchData: true });

        result.forEach((item) => {
          item.item.score += 100 * (flags.exclude ? -item.score : item.score);
          return item.item;
        });
      });
    } else {
      // If no indexed fields, proceed to search normally
      data.forEach((item) => {
        const score = this.getScore(item.record, search, flags);
        item.score += flags.exclude ? -score : score;
      });
    }

    return data;
  }
}
