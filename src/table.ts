import { Actions } from './parser';
import { TokenType } from './types';
import { expandEach } from './utils';

// This table was generated using Vyaakaran
// TODO: Add the grammar here for reference
export default expandEach<Actions | number>([
  {
    [TokenType.SearchTerm]: { shift: 8 },
    [TokenType.Exclude]: { shift: 9 },
    [TokenType.LParen]: { shift: 12 },
    [TokenType.GT]: { shift: 13 },
    [TokenType.LT]: { shift: 14 },
    [TokenType.GTE]: { shift: 15 },
    [TokenType.LTE]: { shift: 16 },
    $: {
      reduce: ['S', 'EPSILON'],
    },
    S: 1,
    Search: 2,
    And: 3,
    Or: 4,
    SearchType: 5,
    Group: 6,
    Term: 7,
    SearchTerm: 10,
    CmpOp: 11,
  },
  {
    $: {
      accept: true,
    },
  },
  {
    [TokenType.SearchTerm]: { shift: 8 },
    [TokenType.Exclude]: { shift: 9 },
    [TokenType.LParen]: { shift: 12 },
    [TokenType.GT]: { shift: 13 },
    [TokenType.LT]: { shift: 14 },
    [TokenType.GTE]: { shift: 15 },
    [TokenType.LTE]: { shift: 16 },
    $: {
      reduce: ['S', 'EPSILON'],
    },
    S: 17,
    Search: 2,
    And: 3,
    Or: 4,
    SearchType: 5,
    Group: 6,
    Term: 7,
    SearchTerm: 10,
    CmpOp: 11,
  },
  {
    [`${TokenType.SearchTerm}, ${TokenType.Exclude}, ${TokenType.LParen}, ${TokenType.RParen}, ${TokenType.GT}, ${TokenType.LT}, ${TokenType.GTE}, ${TokenType.LTE}, $`]:
      {
        reduce: ['Search', 'And'],
      },
  },
  {
    [`${TokenType.SearchTerm}, ${TokenType.Exclude}, ${TokenType.LParen}, ${TokenType.RParen}, ${TokenType.GT}, ${TokenType.LT}, ${TokenType.GTE}, ${TokenType.LTE}, $`]:
      {
        reduce: ['Search', 'Or'],
      },
  },
  {
    [TokenType.And]: { shift: 18 },
    [TokenType.Or]: { shift: 19 },
    [`${TokenType.SearchTerm}, ${TokenType.Exclude}, ${TokenType.LParen}, ${TokenType.RParen}, ${TokenType.GT}, ${TokenType.LT}, ${TokenType.GTE}, ${TokenType.LTE}, $`]:
      {
        reduce: ['Search', 'SearchType'],
      },
  },
  {
    [`${TokenType.And}, ${TokenType.Or}, ${TokenType.SearchTerm}, ${TokenType.Exclude}, ${TokenType.LParen}, ${TokenType.RParen}, ${TokenType.GT}, ${TokenType.LT}, ${TokenType.GTE}, ${TokenType.LTE}, $`]:
      {
        reduce: ['SearchType', 'Group'],
      },
  },
  {
    [`${TokenType.And}, ${TokenType.Or}, ${TokenType.SearchTerm}, ${TokenType.Exclude}, ${TokenType.LParen}, ${TokenType.RParen}, ${TokenType.GT}, ${TokenType.LT}, ${TokenType.GTE}, ${TokenType.LTE}, $`]:
      {
        reduce: ['SearchType', 'Term'],
      },
  },
  {
    [`${TokenType.And}, ${TokenType.Or}, ${TokenType.SearchTerm}, ${TokenType.Exclude}, ${TokenType.LParen}, ${TokenType.RParen}, ${TokenType.GT}, ${TokenType.LT}, ${TokenType.GTE}, ${TokenType.LTE}, $`]:
      {
        reduce: ['SearchTerm', TokenType.SearchTerm],
      },
    [TokenType.GroupTerminator]: { shift: 20 },
  },
  {
    [TokenType.SearchTerm]: { shift: 22 },
    [TokenType.LParen]: { shift: 12 },
    SearchTerm: 21,
  },
  {
    [`${TokenType.And}, ${TokenType.Or}, ${TokenType.SearchTerm}, ${TokenType.Exclude}, ${TokenType.LParen}, ${TokenType.RParen}, ${TokenType.GT}, ${TokenType.LT}, ${TokenType.GTE}, ${TokenType.LTE}, $`]:
      {
        reduce: ['Term', 'SearchTerm'],
      },
  },
  {
    [TokenType.Number]: { shift: 23 },
  },
  {
    [TokenType.SearchTerm]: { shift: 8 },
    [TokenType.Exclude]: { shift: 9 },
    [TokenType.LParen]: { shift: 12 },
    [TokenType.GT]: { shift: 13 },
    [TokenType.LT]: { shift: 14 },
    [TokenType.GTE]: { shift: 15 },
    [TokenType.LTE]: { shift: 16 },
    Search: 24,
    And: 3,
    Or: 4,
    SearchType: 5,
    Group: 6,
    Term: 7,
    SearchTerm: 10,
    CmpOp: 11,
  },
  {
    [TokenType.Number]: {
      reduce: ['CmpOp', TokenType.GT],
    },
  },
  {
    [TokenType.Number]: {
      reduce: ['CmpOp', TokenType.LT],
    },
  },
  {
    [TokenType.Number]: {
      reduce: ['CmpOp', TokenType.GTE],
    },
  },
  {
    [TokenType.Number]: {
      reduce: ['CmpOp', TokenType.LTE],
    },
  },
  {
    $: {
      reduce: ['S', 'Search S'],
    },
  },
  {
    [TokenType.SearchTerm]: { shift: 8 },
    [TokenType.Exclude]: { shift: 9 },
    [TokenType.LParen]: { shift: 12 },
    [TokenType.GT]: { shift: 13 },
    [TokenType.LT]: { shift: 14 },
    [TokenType.GTE]: { shift: 15 },
    [TokenType.LTE]: { shift: 16 },
    Search: 25,
    And: 3,
    Or: 4,
    SearchType: 5,
    Group: 6,
    Term: 7,
    SearchTerm: 10,
    CmpOp: 11,
  },
  {
    [TokenType.SearchTerm]: { shift: 8 },
    [TokenType.Exclude]: { shift: 9 },
    [TokenType.LParen]: { shift: 12 },
    [TokenType.GT]: { shift: 13 },
    [TokenType.LT]: { shift: 14 },
    [TokenType.GTE]: { shift: 15 },
    [TokenType.LTE]: { shift: 16 },
    Search: 26,
    And: 3,
    Or: 4,
    SearchType: 5,
    Group: 6,
    Term: 7,
    SearchTerm: 10,
    CmpOp: 11,
  },
  {
    [TokenType.SearchTerm]: { shift: 22 },
    [TokenType.Exclude]: { shift: 9 },
    [TokenType.LParen]: { shift: 12 },
    [TokenType.GT]: { shift: 13 },
    [TokenType.LT]: { shift: 14 },
    [TokenType.GTE]: { shift: 15 },
    [TokenType.LTE]: { shift: 16 },
    Term: 27,
    SearchTerm: 10,
    CmpOp: 11,
  },
  {
    [`${TokenType.And}, ${TokenType.Or}, ${TokenType.SearchTerm}, ${TokenType.Exclude}, ${TokenType.LParen}, ${TokenType.RParen}, ${TokenType.GT}, ${TokenType.LT}, ${TokenType.GTE}, ${TokenType.LTE}, $`]:
      {
        reduce: ['Term', `${TokenType.Exclude} SearchTerm`],
      },
  },
  {
    [`${TokenType.And}, ${TokenType.Or}, ${TokenType.SearchTerm}, ${TokenType.Exclude}, ${TokenType.LParen}, ${TokenType.RParen}, ${TokenType.GT}, ${TokenType.LT}, ${TokenType.GTE}, ${TokenType.LTE}, $`]:
      {
        reduce: ['SearchTerm', TokenType.SearchTerm],
      },
  },
  {
    [`${TokenType.And}, ${TokenType.Or}, ${TokenType.SearchTerm}, ${TokenType.Exclude}, ${TokenType.LParen}, ${TokenType.RParen}, ${TokenType.GT}, ${TokenType.LT}, ${TokenType.GTE}, ${TokenType.LTE}, $`]:
      {
        reduce: ['Term', `CmpOp ${TokenType.Number}`],
      },
  },
  {
    [TokenType.RParen]: { shift: 28 },
  },
  {
    [`${TokenType.SearchTerm}, ${TokenType.Exclude}, ${TokenType.LParen}, ${TokenType.RParen}, ${TokenType.GT}, ${TokenType.LT}, ${TokenType.GTE}, ${TokenType.LTE}, $`]:
      {
        reduce: ['And', `SearchType ${TokenType.And} Search`],
      },
  },
  {
    [`${TokenType.SearchTerm}, ${TokenType.Exclude}, ${TokenType.LParen}, ${TokenType.RParen}, ${TokenType.GT}, ${TokenType.LT}, ${TokenType.GTE}, ${TokenType.LTE}, $`]:
      {
        reduce: ['Or', `SearchType ${TokenType.Or} Search`],
      },
  },
  {
    [`${TokenType.And}, ${TokenType.Or}, ${TokenType.SearchTerm}, ${TokenType.Exclude}, ${TokenType.LParen}, ${TokenType.RParen}, ${TokenType.GT}, ${TokenType.LT}, ${TokenType.GTE}, ${TokenType.LTE}, $`]:
      {
        reduce: [
          'Group',
          `${TokenType.SearchTerm} ${TokenType.GroupTerminator} Term`,
        ],
      },
  },
  {
    [`${TokenType.And}, ${TokenType.Or}, ${TokenType.SearchTerm}, ${TokenType.Exclude}, ${TokenType.LParen}, ${TokenType.RParen}, ${TokenType.GT}, ${TokenType.LT}, ${TokenType.GTE}, ${TokenType.LTE}, $`]:
      {
        reduce: [
          'SearchTerm',
          `${TokenType.LParen} Search ${TokenType.RParen}`,
        ],
      },
  },
]);
