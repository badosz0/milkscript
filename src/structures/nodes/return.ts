import { Node } from '../node';

export class Return extends Node {
  public name: string = 'return';
  public node?: Node;
}
