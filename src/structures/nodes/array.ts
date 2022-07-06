import { Node, NodeType } from '../node';

export class Array extends Node {
  public type = NodeType.ARRAY;
  public elements: Node[];
}
