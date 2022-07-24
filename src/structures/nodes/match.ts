import { Node, NodeType } from '../node';

export class MatchCase {
  public conditions: Node[] = [];
  public body: Node;
}

export class MatchDefaultCase {
  public body: Node;
}

export class Match extends Node {
  public type = NodeType.MATCH;
  public test: Node;
  public cases: Array<MatchCase | MatchDefaultCase> = [];
}
