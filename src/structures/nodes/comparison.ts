import { Node, NodeType } from '../node';
import { Token } from '../token';

export class Comparison extends Node {
  public type = NodeType.COMPARISON;
  public left: Node;
  public right: Node;
  public symbol: Token;
}
