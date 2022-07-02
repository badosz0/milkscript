import { Node, NodeType } from '../node';

export class Bool extends Node {
  public type = NodeType.BOOL;
  public value: boolean;
}
