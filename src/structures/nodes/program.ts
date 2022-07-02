import { Node } from '../node';

export class Program extends Node {
  public name: string = 'program';
  public nodes: Node[] = [];
}
