import { Node, NodeType } from '../node';

export class Lua extends Node {
  public type = NodeType.LUA;
  public code: string;
}
