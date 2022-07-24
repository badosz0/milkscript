import { Node, NodeType } from '../node';

export class Text extends Node {
  public type = NodeType.TEXT;
  public value: string;
}
