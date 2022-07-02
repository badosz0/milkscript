import { Node, NodeType } from '../node';
import { Token } from '../token';

export class Binary extends Node {
  public type = NodeType.BINARY;
  public left: Node;
  public right: Node;
  public operator: Token;
}
