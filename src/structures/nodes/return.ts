import { Node, NodeType } from '../node';

export class Return extends Node {
  public type = NodeType.RETURN;
  public node?: Node;
}
