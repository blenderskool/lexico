import { BinaryCmp } from './comparators';
import { LRParser } from './parser';
import searchWithFlags from './search';
import table from './table';
import { Comparator, Data, DataWithScore, Token, TokenType, ComparatorWithIndexing } from './types';
import { getPath } from './utils';

type SeekrOptions = {
  data?: Data[];
  indexes?: string[];
};

class Lexer {
  static getNextToken(splitStr: string[]) {
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

  static *lexer(input: string) {
    const splitStr = input.split(/(:|"|<=|>=|<|>|!|\s+|\(|\))/g);
    let prevToken: Token = null;

    while (splitStr.length) {
      const lexicon = Lexer.getNextToken(splitStr);

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
}

export default class Seekr {
  private comparator: Comparator | ComparatorWithIndexing;
  static parser = new LRParser<Token>(table);
  private scoredData: DataWithScore[];
  private indexes: Set<string> = new Set();

  constructor(
    comparator: Comparator | ComparatorWithIndexing = new BinaryCmp(),
    opts?: SeekrOptions
  ) {
    this.comparator = comparator;

    if (opts?.indexes) {
      this.indexes = new Set(opts.indexes);
    }

    /**
     * If data is provided during initialization, and comparator supports search index,
     * initiate index construction for faster searches
     */
    if (opts?.data) {
      this.scoredData = this.createScoredDataAndIndex(opts.data);
    }
  }

  private createScoredDataAndIndex(data: Data[]): DataWithScore[] {
    const scoredData = data.map((record) => ({ record, score: 0 }));

    if (this.indexes) {
      scoredData.forEach((item) => this.addItemToIndex(item));
    }

    return scoredData;
  }

  private addItemToIndex(data: DataWithScore) {
    const comparator = this.comparator;
    if ('addToIndex' in comparator) {
      /**
       * @param path it is the path of a field on which `data` is being indexed
       */
      const addItemToFieldIndex = (path: string) => {
        const value = getPath<string | undefined, Data>(data.record, path);
        // If there's no value in associated path, ignore adding this record to the `path`'s index
        if (!value) return;

        /**
         * Indexing happens with the value of the `data` at `path`.
         * This is called `indexKey`, it is different from `path`.
         *
         * `path` is on which `data` is indexed.
         * `indexKey` is the value being indexed (with also a reference to `data` it is a part of and gets returned later).
         */
        const indexKey = value.toString();
        comparator.addToIndex(path, indexKey, data);
      };

      this.indexes.forEach((path) => addItemToFieldIndex(path));
    } else {
      throw new Error('Indexing not supported by this comparator');
    }
  }

  addRecord(record: Data) {
    const scoredItem = { record, score: 0 };
    this.scoredData.push(scoredItem);
    if (this.indexes) {
      this.addItemToIndex(scoredItem);
    }
  }

  compile(input: string) {
    const [tree, err] = Seekr.parser.parse(Lexer.lexer(input));
    if (err) {
      throw err;
    }

    return (data?: Data[]) => {
      /**
       * This guarantees that that the data gets indexed before search is initated
       * with the indexes specified if the comparator supports it.
       *
       * `this.scoredData` is data passed in constructor(where it gets indexed),
       * `data` is data passed during search and gets indexed here
       */
      const scoredData = this.scoredData ?? this.createScoredDataAndIndex(data);

      return searchWithFlags(tree, scoredData, this.comparator, {
        indexFields: this.indexes,
      }).sort((a, b) => b.score - a.score);
    };
  }

  search(input: string, data?: Data[]) {
    return this.compile(input)(data);
  }
}

export * from './comparators';
