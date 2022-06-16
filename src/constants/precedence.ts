import { Statement } from '../structures/statement';

export const PRECEDENCE: Record<Statement['name'], number> = {
  'parenthesized': -1,
  'binary': 1,

  'prefix': 999,
};
