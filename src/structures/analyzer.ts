import { Node, NodeType } from './node';
import { Assignment } from './nodes/assignment';
import { Binary } from './nodes/binary';
import { Function } from './nodes/function';
import { Identifier } from './nodes/identifier';
import { Program } from './nodes/program';
import { Scope } from './scope';

export class Analyzer {
  private program: Program;
  private scope: Scope = new Scope(NodeType.PROGRAM);

  constructor(program: Program) {
    this.program = program;
  }

  private analyzeAssignment(node: Assignment): void {
    // TODO: check left & right valid
    // TODO: const

    if (node.left instanceof Identifier) {
      // TODO: check if name reserved
      const variable = this.scope.getVariable(node.left.name);
      const function_ = this.scope.getFunction(node.left.name);

      if (!variable && !function_) {
        node.local = [ node.left.name ];
      }

      // TODO: if const error

      if (node.right instanceof Function) {
        this.walk(node.right);
        this.scope.addFunction(node.left.name, node.right.parameters, node.right.source);
      } else {
        this.walk(node.right);
        this.scope.addVariable(node.left.name, node.left.source);
      }
    } else {
      this.walk(node.left);
      this.walk(node.right);
    }
  }

  private analyzeBinary(node: Binary): void {
    // TODO: valid left and right

    this.walk(node.left);
    this.walk(node.right);
  }

  private walk(node: Node): void {
    if (node instanceof Assignment) {
      return this.analyzeAssignment(node);
    }
    if (node instanceof Binary) {
      return this.analyzeBinary(node);
    }

    console.log('a: ' + node.type);
  }

  public analyze(): void {
    this.program.nodes.forEach((node) => {
      this.walk(node);
    });
  }
}
