import { Node, NodeType } from '../node';

export class Function extends Node {
  public type = NodeType.FUNCTION;
  public body: Node;
  public parameters: Node[] = [];
}
