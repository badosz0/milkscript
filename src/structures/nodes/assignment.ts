import { Node } from '../node';
import { Token } from '../token';

export class Assignment extends Node {
  public name: string = 'assignment';
  public left: Node;
  public right: Node;
  public symbol: Token;
}
