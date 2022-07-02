import { Node } from '../structures/node';

export const PRECEDENCE: Record<Node['name'], number> = {
  'parenthesized': -1,
  'function': -1,
  'return': -1,
  'call': -1,

  'assignment': 1,
  'binary': 2,

  'prefix': 999,
};
