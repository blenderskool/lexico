export interface Token {
  type: string;
}

export interface ParseTree<T extends Token> {
  type: string;
  body: (ParseTree<T> | T)[];
}

export interface CompileError {
  type: 'Error' | 'Warning';
  message: string;
}

export type Actions =
  | { accept: boolean }
  | { shift: number }
  | {
      // [lhs, rhs]
      reduce: [string, string];
    };

export class LRParser<U extends Token> {
  private parseTable: Record<string, Actions | number>[];

  constructor(parseTable: Record<string, Actions | number>[]) {
    this.parseTable = parseTable;
  }

  // Most of the implementation here is referred from algorithm in the Wikipedia article of LR parser
  parse<T extends Generator<U>>(lexer: T): [ParseTree<U>, CompileError] {
    const parseTable = this.parseTable;
    const stack: (ParseTree<U> | number)[] = [0];
    let token = lexer.next();

    // TODO: handle EPSILON and nullable rules parsing.
    while (true) {
      const s = stack[stack.length - 1];
      const expectedActions = parseTable[typeof s === 'number' ? s : s.type];
      const action = (expectedActions[token.done ? '$' : token.value.type] ??
        {}) as Actions;

      if ('shift' in action) {
        stack.push(token.value);
        stack.push(action.shift);
        token = lexer.next();
      } else if ('reduce' in action) {
        const [lhs, rhs] = action.reduce;
        let L = rhs.split(' ').length;

        const root: ParseTree<U> = { type: lhs, body: [] };

        while (L) {
          stack.pop() as number;

          const node = stack.pop() as ParseTree<U>;
          root.body.unshift(node);
          --L;
        }

        const p = stack[stack.length - 1] as number;
        const n = parseTable[p][lhs] as number;

        stack.push(root);
        stack.push(n);
      } else if ('accept' in action) {
        // TODO: handle error case (when stack has more than just the start state)
        return [stack[1] as ParseTree<U>, null];
      } else {
        // error case
        // Construct error message by returing tokens that were expected from parse table
        const possibleTokens = Object.keys(expectedActions).filter(
          (key) => typeof expectedActions[key] !== 'number'
        );

        return [
          null,
          {
            message: `Expected ${
              possibleTokens.length > 1 ? 'one of ' : ''
            }${possibleTokens.join(', ')}`,
            type: 'Error',
          },
        ];
      }
    }
  }
}
