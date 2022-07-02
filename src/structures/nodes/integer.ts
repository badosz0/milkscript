import { Node, NodeType } from '../node';

export class Integer extends Node {
  public type = NodeType.INTEGER;
  public value: number;
}
