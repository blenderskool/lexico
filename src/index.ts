import { LRParser } from './parser';
import search from './search';
import table from './table';
import { Data, ParseTree, Token, TokenType } from './types';

export default class Seekr {
  tree: ParseTree | Token;
  static parser = new LRParser<Token>(table);

  private getNextToken(splitStr: string[]) {
    let lexicon = splitStr.shift();

    // Merge quoted string to one lexicon
    if (lexicon === '"') {
      lexicon = '';
      while (splitStr.length) {
        const ch = splitStr.shift();
        if (ch === '"') break;
        lexicon += ch;
      }
    }

    return lexicon;
  }

  private *lexer(input: string) {
    const splitStr = input.split(/(:|"|<=|>=|<|>|!|\s+|\(|\))/g);
    let prevToken: Token = null;

    while (splitStr.length) {
      const lexicon = this.getNextToken(splitStr);

      if (lexicon.trim().length === 0) continue;
      let tokenVal: string | number;
      let tokenType: TokenType;

      switch (lexicon) {
        case ':':
          tokenType = TokenType.GroupTerminator;
          break;
        case '!':
          tokenType = TokenType.Exclude;
          break;
        case '>':
          tokenType = TokenType.GT;
          break;
        case '<':
          tokenType = TokenType.LT;
          break;
        case '>=':
          tokenType = TokenType.GTE;
          break;
        case '<=':
          tokenType = TokenType.LTE;
          break;
        case '(':
          tokenType = TokenType.LParen;
          break;
        case ')':
          tokenType = TokenType.RParen;
          break;
        case 'AND':
          tokenType = TokenType.And;
          break;
        case 'OR':
          tokenType = TokenType.Or;
          break;
        default:
          tokenType = TokenType.SearchTerm;
          break;
      }

      switch (prevToken?.type) {
        case TokenType.GT:
        case TokenType.LT:
        case TokenType.GTE:
        case TokenType.LTE: {
          const number = parseInt(lexicon);
          tokenVal = isNaN(number) ? lexicon : number;
          break;
        }
        default:
          tokenVal = lexicon;
          break;
      }

      const token = { token: tokenVal, type: tokenType };
      yield token;
      prevToken = token;
    }
  }

  compile(input: string) {
    const [tree, err] = Seekr.parser.parse(this.lexer(input));
    if (err) {
      throw err;
    }

    return (data: Data[]) => search(tree, data);
  }

  search(input: string, data: Data[]) {
    return this.compile(input)(data);
  }
}

const input = process.argv[2];
const ls = new Seekr();
const results = ls.search(input, []);
