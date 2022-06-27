import { Statement } from '../structures/statement';

export const PRECEDENCE: Record<Statement['name'], number> = {
  'parenthesized': -1,
  'function': -1,
  'return': -1,
  'call': -1,

  'assignment': 1,
  'binary': 2,

  'prefix': 999,
};
