import { Node, NodeType } from '../node';

export class Minus extends Node {
  public type = NodeType.MINUS;
  public node: Node;
}
