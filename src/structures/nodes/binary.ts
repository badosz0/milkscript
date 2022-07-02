import { Node } from '../node';
import { Token } from '../token';

export class Binary extends Node {
  public name: string = 'binary';
  public left: Node;
  public right: Node;
  public operator: Token;
}
