import { Node } from '../node';

export class Function extends Node {
  public name: string = 'function';
  public body: Node;
  public parameters: Node[] = [];
}
