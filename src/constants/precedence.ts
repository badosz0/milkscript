import { NodeType } from '../structures/node';

export const PRECEDENCE: Partial<Record<NodeType, number>> = {
  [NodeType.PARENTHESIZED]: -1,
  [NodeType.FUNCTION]: -1,
  [NodeType.RETURN]: -1,
  [NodeType.CALL]: -1,

  [NodeType.ASSIGNMENT]: 1,
  [NodeType.BINARY]: 2,

  [NodeType.PREFIX]: 999,
};
