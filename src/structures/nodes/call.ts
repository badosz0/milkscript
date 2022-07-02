import { Node } from '../node';

export class Call extends Node {
  public name: string = 'call';
  public arguments: Node[] = [];
  public caller: Node;
}
