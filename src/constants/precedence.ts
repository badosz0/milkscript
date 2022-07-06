import { NodeType } from '../structures/node';

export const PRECEDENCE: Partial<Record<NodeType, number>> = {
  [NodeType.CALL]: 0,

  [NodeType.ASSIGNMENT]: 1,
  [NodeType.BINARY]: 2,

  [NodeType.PREFIX]: 999,
};
