import { CompileError } from './error';
import { Node, NodeType } from './node';
import { Array } from './nodes/array';
import { Assignment } from './nodes/assignment';
import { Binary } from './nodes/binary';
import { Block } from './nodes/block';
import { For } from './nodes/for';
import { Function } from './nodes/function';
import { Identifier } from './nodes/identifier';
import { Match, MatchCase } from './nodes/match';
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

  private analyzeFunction(node: Function): void {
    // TODO: class

    this.scope.start(NodeType.FUNCTION);

    for (const parameter of node.parameters) {
      if (parameter instanceof Assignment) {
        if (!(parameter.left instanceof Identifier)) {
          throw new CompileError(18, parameter.left.source);
        }

        this.scope.addVariable(parameter.left.name, parameter.left.source);
      } else if (parameter instanceof Identifier) {
        this.scope.addVariable(parameter.name, parameter.source);
      } else {
        throw new CompileError(18, parameter.source);
      }
    }

    this.walk(node.body);

    this.scope.end();
  }

  private analyzeBlock(node: Block): void {
    this.scope.start(NodeType.BLOCK);

    // TODO: warn unreachable

    for (const inNode of node.body) {
      this.walk(inNode);
    }

    this.scope.end();
  }

  // eslint-disable-next-line @typescript-eslint/array-type
  private analyzeArray(node: Array): void {
    for (const element of node.elements) {
      // TODO: check valid?
      this.walk(element);
    }
  }

  private analyzeFor(node: For): void {
    if (node.variable) {
      // TODO: check valid?

      this.walk(node.variable);
    }

    if (node.from) {
      // TODO: check valid?

      this.walk(node.from);
    }

    if (node.to) {
      // TODO: check valid?

      this.walk(node.to);
    }

    // todo: check if name reserved

    this.scope.start(NodeType.FOR);

    this.scope.addVariable(node.name, node.source);
    this.scope.addVariable(`${node.name}_index`, node.source);

    this.walk(node.body);

    this.scope.end();
  }

  private analyzeMatch(node: Match): void {
    this.walk(node.test);

    node.cases.forEach((_case) => {
      if (_case instanceof MatchCase) {
        for (const condition of _case.conditions) {
          this.walk(condition);
        }
      } else {
        // TODO: throw if not last
      }

      // TODO: allow only block or return
      this.walk(_case.body);
    });
  }

  private walk(node: Node): void {
    if (node instanceof Assignment) {
      return this.analyzeAssignment(node);
    }
    if (node instanceof Binary) {
      return this.analyzeBinary(node);
    }
    if (node instanceof Block) {
      return this.analyzeBlock(node);
    }
    if (node instanceof Function) {
      return this.analyzeFunction(node);
    }
    if (node instanceof Array) {
      return this.analyzeArray(node);
    }
    if (node instanceof For) {
      return this.analyzeFor(node);
    }
    if (node instanceof Match) {
      return this.analyzeMatch(node);
    }

    // console.log('a: ' + node.type);
  }

  public analyze(): void {
    this.program.nodes.forEach((node) => {
      this.walk(node);
    });
  }
}
