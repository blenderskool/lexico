import { ErrorRecoveryFn } from './parser';
import { Token, TokenType } from './types';

export const errorRecoveryForInput = (input: string): ErrorRecoveryFn<Token> => {
  let offset = input.length;
  return ({ token, possibleTokens }) => {
    if (possibleTokens.includes(TokenType.SearchTerm)) {
      /**
       * Safest move is to make the token a search term if that is possible in the current step.
       * This handles recoveries from most of the error cases
       */
      token.value = {
        type: TokenType.SearchTerm,
        token: token.value ?? '',
        position: token.value?.position ?? offset++,
      };
      token.done = false;
    } else if (possibleTokens.includes(TokenType.RParen)) {
      /**
       * When right parenthesis is expected, add it as a token
       */
      token.value = {
        type: TokenType.RParen,
        token: ')',
        position: token.value?.position ?? offset++,
      };
      token.done = false;
    } else if (possibleTokens.includes('$') && possibleTokens.length === 1) {
      /**
       * Case where expected token is EOF, i.e. end of parsing. In this case, the rest of the string
       * is ignored and search is only performed on the string parsed till here.
       */
      token.done = true;
    } else {
      throw new Error(
        `Lexico – Error recovery failed for query \`${input}\`. Please open an issue at https://github.com/blenderskool/lexico`
      );
    }
  };
};
