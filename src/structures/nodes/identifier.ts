import { Node, NodeType } from '../node';

export class Identifier extends Node {
  public type = NodeType.IDENTIFIER;
  public variable: string;
}
