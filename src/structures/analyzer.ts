import { assert } from 'node:console';
import { Node } from './node';
import { Program } from './nodes/program';

export class Analyzer {
  private program: Program;

  constructor(program: Program) {
    this.program = program;
  }

  private walk(node: Node): void {
    assert(false, node.type);
  }

  public analyze(): void {
    this.program.nodes.forEach((node) => {
      this.walk(node);
    });
  }
}
