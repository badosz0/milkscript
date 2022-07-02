import { Node, NodeType } from '../node';

export class Parenthesized extends Node {
  public type = NodeType.PARENTHESIZED;
  public node: Node;
}
