import { LexicoBuilder } from './builder';
import { BinaryCmp } from './comparators';
import { LRParser } from './parser';
import searchWithFlags from './search';
import table from './table';
import { Comparator, ComparatorWithIndexing, Data, DataWithScore, Token, TokenType } from './types';
import { getPath, splitWithOffsets } from './utils';

type LexicoOptions = {
  comparator?: Comparator | ComparatorWithIndexing;
  data?: Data[];
  indexes?: string[];
  disableErrorRecovery?: boolean;
};

class Lexer {
  static getNextToken(tokens: [string, number][]): [string, number] {
    let [lexicon, pos] = tokens.shift();

    // Merge quoted string to one lexicon
    if (lexicon === '"') {
      lexicon = '';
      ++pos;
      while (tokens.length) {
        const [ch] = tokens.shift();
        if (ch === '"') break;
        lexicon += ch;
      }
    }

    return [lexicon, pos];
  }

  static *lexer(input: string) {
    const tokens = splitWithOffsets(input, /(:|"|<=|>=|<|>|!|\s+|\(|\))/g);
    let prevToken: Token = null;

    while (tokens.length) {
      const [lexicon, pos] = Lexer.getNextToken(tokens);

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
          const number = Number(lexicon);
          tokenVal = isNaN(number) ? lexicon : number;
          break;
        }
        default:
          tokenVal = lexicon;
          break;
      }

      const token: Token = { token: tokenVal, type: tokenType, pos };
      yield token;
      prevToken = token;
    }
  }
}

export default class Lexico {
  private comparator: Comparator | ComparatorWithIndexing;
  static parser = new LRParser<Token>(table);
  private scoredData: DataWithScore[];
  private indexes: Set<string> = new Set();
  private disableErrorRecovery: boolean;

  constructor(opts: LexicoOptions = { comparator: new BinaryCmp() }) {
    this.comparator = opts.comparator;
    this.disableErrorRecovery = opts.disableErrorRecovery ?? false;

    if ('indexes' in opts) {
      this.indexes = new Set(opts.indexes);
    }

    /**
     * If data is provided during initialization, initiate scored data and
     * index construction (if supported) for faster searches
     */
    if ('data' in opts) {
      this.scoredData = this.createScoredDataAndIndex(opts.data);
    }
  }

  private createScoredDataAndIndex(data: Data[]): DataWithScore[] {
    const scoredData = data.map((record) => ({ record, score: 0 }));

    if (this.indexes.size) {
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
    const [tree, err] = Lexico.parser.parse(Lexer.lexer(input));

    if (err) throw err;

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

  build() {
    return new LexicoBuilder(this);
  }
}

export * from './comparators';
