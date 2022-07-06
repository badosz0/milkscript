import { Node, NodeType } from '../node';

export class For extends Node {
  public type = NodeType.FOR;
  public from?: Node;
  public to?: Node;
  public variable: Node;
  public name: string = 'it';
  public reverse = false;
  public body: Node;
}
