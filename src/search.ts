import { BinaryCmp } from './comparators';
import {
  CmpOp,
  Comparator,
  Data,
  DataWithScore,
  ParseTree,
  SearchFlags,
  Token,
  TokenType,
} from './types';

/**
 * Helper function to exclude the left parenthesis token when it exists and return its body
 * @param parseTree ParseTree
 * @returns ParseTree
 */
const excludeParenthesis = (parseTree: ParseTree) =>
  parseTree.body[parseTree.body[0].type === TokenType.LParen ? 1 : 0];

/**
 * Helper function that applies AND operation while also
 * inverting to OR operation when `exclude` flag is enabled
 */
const And = (
  lhs: ParseTree,
  rhs: ParseTree,
  data: DataWithScore[],
  flags: SearchFlags,
  comparator: Comparator
) => (flags.exclude ? comparator.or(lhs, rhs, data, flags) : comparator.and(lhs, rhs, data, flags));

export function searchWithFlags(
  parseTree: ParseTree | Token,
  data: DataWithScore[],
  comparator: Comparator,
  flags: SearchFlags = {}
): DataWithScore[] {
  // Base case when a token has been reached
  if (!('body' in parseTree)) {
    switch (parseTree.type) {
      case TokenType.SearchTerm:
        return comparator.search(data, parseTree.token, flags);
      default:
        // Other searchable tokens not supported
        return [];
    }
  }

  // Recurse the tree
  switch (parseTree.type) {
    case 'Group': {
      const path = (parseTree.body[0] as Token).token as string;
      return searchWithFlags(parseTree.body[2], data, comparator, {
        ...flags,
        // If there is already some path in the context, then append to it
        path: flags.path ? `${flags.path}.${path}` : path,
      });
    }
    case 'And': {
      const lhs = parseTree.body[0] as ParseTree;
      const rhs = parseTree.body[2] as ParseTree;

      return And(lhs, rhs, data, flags, comparator);
    }
    case 'Or': {
      const lhs = parseTree.body[0] as ParseTree;
      const rhs = parseTree.body[2] as ParseTree;

      // De-Morgan's law
      return flags.exclude
        ? comparator.and(lhs, rhs, data, flags)
        : comparator.or(lhs, rhs, data, flags);
    }
    case 'Term': {
      const firstSymbol = parseTree.body.shift();
      const nextFlags = { ...flags };

      switch (firstSymbol.type) {
        case TokenType.Exclude:
          nextFlags.exclude = !nextFlags.exclude;
          break;
        case 'CmpOp':
          // These typecasts are safe because the grammar and parser guarantees it
          nextFlags.cmpOp = (firstSymbol.body[0] as Token).type as CmpOp;
          break;
        default:
          parseTree.body.unshift(firstSymbol);
      }

      return searchWithFlags(excludeParenthesis(parseTree), data, comparator, {
        ...flags,
        ...nextFlags,
      });
    }
    case 'S': {
      /**
       * Performs "AND" operation on all branches of the root if there is more than 1 child,
       * otherwise fallback to searching the only child
       */
      if (parseTree.body.length > 1) {
        let prevTree = parseTree.body[0] as ParseTree;
        let result = data;
        parseTree.body.slice(1).forEach((next: ParseTree) => {
          result = And(prevTree, next, result, flags, comparator);
          prevTree = next;
        });

        return result;
      }

      /**
       * There's no break here as we want to fallback to searching the
       * only child of "S" root if there are no multiple children (and hence no AND operation)
       */
    }
    default:
      return searchWithFlags(excludeParenthesis(parseTree), data, comparator, flags);
  }
}

export default function search(
  compiled: ParseTree | Token,
  data: Data[],
  comparator: Comparator = new BinaryCmp()
) {
  const scoredData = data.map((record) => ({
    record,
    score: 0,
  }));

  return searchWithFlags(compiled, scoredData, comparator).sort((a, b) => b.score - a.score);
}
