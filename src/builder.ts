import type Lexico from '.';

interface SearchOpts {
  scope?: string;
  operator?: '!' | '>' | '<' | '>=' | '<=';
}

interface SearchNode {
  term: string | number | LexicoOps;
  opts: SearchOpts;
}

type Node = LexicoOps | Tree | SearchNode;

interface Tree {
  lhs: Node;
  op: LexicoOps;
  rhs: Node;
}

interface AcceptsSearch {
  search(term: string | number | LexicoOps, opts: SearchOpts);
}

export class LexicoBuilder implements AcceptsSearch {
  private stack: Node[] = [];
  private lexico: Lexico;

  constructor(lexico: Lexico) {
    this.lexico = lexico;
  }

  private constructTree() {
    // If stack size is more than 3, then create a tree Node
    if (this.stack.length >= 3) {
      const rhs = this.stack.pop() as Tree | SearchNode;
      const op = this.stack.pop() as LexicoOps;
      const lhs = this.stack.pop() as Tree | SearchNode;

      const tree: Tree = { lhs, op, rhs };
      this.stack.push(tree);
    }
  }

  private get tree() {
    return this.stack[0];
  }

  /**
   * Add a search term to the query
   * @param term Search term, can also be another search query.
   * @param opts Search term options
   */
  search(term: string | number | LexicoOps, opts: SearchOpts = {}) {
    this.stack.push({ term, opts });
    this.constructTree();

    const op = new LexicoOps(this);
    this.stack.push(op);
    return op;
  }
}

class LexicoOps implements AcceptsSearch {
  private builder: LexicoBuilder;
  private type: 'AND' | 'OR';

  constructor(builder: LexicoBuilder) {
    this.builder = builder;
  }

  /**
   * `AND` operator
   */
  AND() {
    this.type = 'AND';
    return this.builder;
  }

  /**
   * `OR` operator
   */
  OR() {
    this.type = 'OR';
    return this.builder;
  }

  /**
   * Add a search term to the query
   * @param term Search term, can also be another search query.
   * @param opts Search term options
   */
  search(term: string | number | LexicoOps, opts: SearchOpts = {}) {
    this.type = 'AND';
    return this.builder.search(term, opts);
  }

  /**
   * Converts the built search query to a string representation
   */
  toString() {
    const tree = this.builder['tree'];
    const strParts: string[] = [];

    const recursive = (node: Tree | SearchNode | LexicoOps) => {
      if ('term' in node) {
        // Process a search term node. The node could be simple / nested search term.
        const asStr = node.term.toString();

        let part = '';
        if (node.term instanceof LexicoOps) {
          // Nested group
          part = `(${asStr})`;
        } else if (part.match(/\s|<|>|!|:/g)) {
          // Search term has a special operator that can cause side-effects, thus escape it in quotes.
          part = `"${part}"`;
        } else {
          // Simple search term
          part = asStr;
        }

        // Apply the scope and comparison operators
        part = node.opts.operator ? `${node.opts.operator}${part}` : part;
        part = node.opts.scope ? `${node.opts.scope}:${part}` : part;

        strParts.push(part);
      } else if (node instanceof LexicoOps) {
        // Node is of type operator, the relevant token is stored under `type` field
        strParts.push(node.type);
      } else {
        // Recursively process lhs, op, rhs of the tree
        recursive(node.lhs);
        recursive(node.op);
        recursive(node.rhs);
      }
    };

    recursive(tree);
    return strParts.join(' ');
  }

  /**
   * Compiles the built search query which can then be used for searching
   * through data.
   */
  compile() {
    /**
     * TODO: Try generating parse tree directly instead of creating a string and
     * then parsing it to generate the parse tree.
     */
    return this.builder['lexico'].compile(this.toString());
  }
}
