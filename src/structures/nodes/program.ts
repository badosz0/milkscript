import { Node, NodeType } from '../node';

export class Program extends Node {
  public type = NodeType.PROGRAM;
  public nodes: Node[] = [];
}
