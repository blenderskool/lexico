import { Token as BaseToken, ParseTree as BaseParseTree } from './parser';

// "const" enum gets inlined by TypeScript, resulting in more optimizations by Terser
export const enum TokenType {
  GroupTerm = '1',
  SearchTerm = '2',
  GroupTerminator = '3',
  LParen = '4',
  RParen = '5',
  And = '6',
  Or = '7',
  Exclude = '8',
  GT = '9',
  GTE = '10',
  LT = '11',
  LTE = '12',
}

export type CmpOp = TokenType.GT | TokenType.GTE | TokenType.LT | TokenType.LTE;

export interface Token extends BaseToken {
  type: TokenType;
  token: string | number;
}

export type Data = { [key: string]: Data } | string | number | boolean;

export interface DataWithScore {
  record: Data;
  score: number;
}

export type ParseTree = BaseParseTree<Token>;

export interface SearchFlags {
  path?: string;
  exclude?: boolean;
  cmpOp?: CmpOp;
  indexFields: Set<string>;
}

export interface Comparator {
  /**
   * Performs `lhs` AND `rhs` operation on `data`
   * @returns Resulting data after the operation
   */
  and(lhs: ParseTree, rhs: ParseTree, data: DataWithScore[], flags: SearchFlags): DataWithScore[];

  /**
   * Performs `lhs` OR `rhs` operation on `data`
   * @returns Resulting data after the operation
   */
  or(lhs: ParseTree, rhs: ParseTree, data: DataWithScore[], flags: SearchFlags): DataWithScore[];

  /**
   * Searches `data` with query as `search` and `flags` applied
   * @returns Resulting data after the operation
   */
  search(data: DataWithScore[], search: string | number, flags: SearchFlags): DataWithScore[];
}

export interface ComparatorWithIndexing extends Comparator {
  addToIndex(path: string, key: string, value: DataWithScore): void;
}
