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
  Number = '13',
}

export type NumCmpOp =
  | TokenType.GT
  | TokenType.GTE
  | TokenType.LT
  | TokenType.LTE;

interface TokenNumber extends BaseToken {
  type: TokenType.Number;
  token: number;
}

interface TokenString extends BaseToken {
  type: Exclude<TokenType, TokenType.Number>;
  token: string;
}

export type Token = TokenNumber | TokenString;

export type Data = { [key: string]: Data } | string | number | boolean;

export type ParseTree = BaseParseTree<Token>;
