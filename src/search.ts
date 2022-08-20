import { Data, CmpOp, ParseTree, Token, TokenType } from './types';
import { getPath } from './utils';

type SearchFlags = {
  path?: string;
  exclude?: boolean;
  cmpOp?: CmpOp;
};

function And(lhs: ParseTree, rhs: ParseTree, data: Data[], flags: SearchFlags) {
  const lhsData = searchWithFlags(lhs, data, flags);
  return searchWithFlags(rhs, lhsData, flags);
}

function Or(lhs: ParseTree, rhs: ParseTree, data: Data[], flags: SearchFlags) {
  const lhsData = searchWithFlags(lhs, data, flags);
  const rhsData = searchWithFlags(rhs, data, flags);

  // Set is used to remove duplicate items that matched in both lhs and rhs
  return [...new Set([...lhsData, ...rhsData])];
}

/**
 * Helper function to exclude the left parenthesis token when it exists and return its body
 * @param parseTree ParseTree
 * @returns ParseTree
 */
function excludeParenthesis(parseTree: ParseTree) {
  return parseTree.body[parseTree.body[0].type === TokenType.LParen ? 1 : 0];
}

const CmpOperations: Record<
  CmpOp,
  (lhs: number | string, rhs: number | string) => boolean
> = {
  [TokenType.GT]: (lhs, rhs) => lhs > rhs,
  [TokenType.GTE]: (lhs, rhs) => lhs >= rhs,
  [TokenType.LT]: (lhs, rhs) => lhs < rhs,
  [TokenType.LTE]: (lhs, rhs) => lhs <= rhs,
};

function isAtomSimilar(data: Data, search: string | number, cmpOp?: TokenType) {
  /**
   * Checking the presence of cmpOp is important as it may be undefined,
   * in which case the fallback is equality check.
   */
  if (cmpOp && (typeof data === 'string' || typeof data === 'number')) {
    return CmpOperations[cmpOp](data, search);
  } else {
    return data
      .toString()
      .toLowerCase()
      .includes(search.toString().toLowerCase());
  }
}

function isItemMatching(
  item: Data,
  search: string | number,
  { path, cmpOp }: Pick<SearchFlags, 'path' | 'cmpOp'>
) {
  if (typeof item === 'object') {
    if (path !== undefined) {
      const selectedField = getPath(item, path);

      // if value for the selected field is undefined, don't include in search result
      return selectedField !== undefined
        ? isAtomSimilar(selectedField, search, cmpOp)
        : false;
    } else {
      // Todo: Deep search? Support Arrays?
      return Object.values(item).some((value) =>
        isAtomSimilar(value, search, cmpOp)
      );
    }
  } else {
    return isAtomSimilar(item, search, cmpOp);
  }
}

function searchWithFlags(
  parseTree: ParseTree | Token,
  data: Data[],
  flags: SearchFlags = {}
): Data[] {
  // Base case when a token has been reached
  if (!('body' in parseTree)) {
    switch (parseTree.type) {
      case TokenType.SearchTerm:
        return data.filter((item: Data) => {
          let search = parseTree.token;
          const matched = isItemMatching(item, search, flags);

          return flags.exclude ? !matched : matched;
        });
      default:
        // Other searchable tokens not supported
        return [];
    }
  }

  // Recurse the tree
  switch (parseTree.type) {
    case 'Group': {
      const path = (parseTree.body[0] as Token).token as string;
      return searchWithFlags(parseTree.body[2], data, { ...flags, path });
    }
    case 'And': {
      const lhs = parseTree.body[0] as ParseTree;
      const rhs = parseTree.body[2] as ParseTree;

      // De-Morgan's law
      return flags.exclude
        ? Or(lhs, rhs, data, flags)
        : And(lhs, rhs, data, flags);
    }
    case 'Or': {
      const lhs = parseTree.body[0] as ParseTree;
      const rhs = parseTree.body[2] as ParseTree;

      // De-Morgan's law
      return flags.exclude
        ? And(lhs, rhs, data, flags)
        : Or(lhs, rhs, data, flags);
    }
    case 'S': {
      // Performs logical "AND" operation on all branches of the root
      return parseTree.body.reduce(
        (prevData, body) => searchWithFlags(body, prevData, flags),
        data
      );
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

      return searchWithFlags(excludeParenthesis(parseTree), data, {
        ...flags,
        ...nextFlags,
      });
    }
    default:
      return searchWithFlags(excludeParenthesis(parseTree), data, flags);
  }
}

export default function search(compiled: ParseTree | Token, data: Data[]) {
  return searchWithFlags(compiled, data);
}
