import { Node } from '../node';

export class Identifier extends Node {
  public name: string = 'identifier';
  public variable: string;
}
