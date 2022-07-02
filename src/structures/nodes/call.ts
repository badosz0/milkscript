import { Node, NodeType } from '../node';

export class Call extends Node {
  public type = NodeType.CALL;
  public arguments: Node[] = [];
  public caller: Node;
}
