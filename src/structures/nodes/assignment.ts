import { Node, NodeType } from '../node';
import { Token } from '../token';

export class Assignment extends Node {
  public type = NodeType.ASSIGNMENT;
  public left: Node;
  public right: Node;
  public symbol: Token;
  public local: string[] = [];
}
