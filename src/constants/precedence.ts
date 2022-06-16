import { Statement } from '../structures/statement';

export const PRECEDENCE: Record<Statement['name'], number> = {
  'binary': 1,
  'prefix': 999,
};
