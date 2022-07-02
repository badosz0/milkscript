import { Node, NodeType } from '../node';

export class Block extends Node {
  public type = NodeType.BLOCK;
  public body: Node[];
}
