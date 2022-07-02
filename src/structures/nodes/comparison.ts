import { Node } from '../node';
import { Token } from '../token';

export class Comparison extends Node {
  public name: string = 'comparison';
  public left: Node;
  public right: Node;
  public symbol: Token;
}
