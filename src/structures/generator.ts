import { assert } from 'node:console';
import { Node, StackType } from './node';
import { Array as MSArray } from './nodes/array';
import { Assignment } from './nodes/assignment';
import { Binary } from './nodes/binary';
import { Block } from './nodes/block';
import { Bool } from './nodes/bool';
import { Call } from './nodes/call';
import { Comparison } from './nodes/comparison';
import { Function } from './nodes/function';
import { Identifier } from './nodes/identifier';
import { Integer } from './nodes/integer';
import { Lua } from './nodes/lua';
import { Minus } from './nodes/minus';
import { Parenthesized } from './nodes/parenthesized';
import { Program } from './nodes/program';
import { Return } from './nodes/return';

export class Generator {
  private program: Program;
  private indentation: number = 0;
  public code: string = '';

  constructor(program: Program) {
    this.program = program;
  }

  private generateIndentation(additional = 0): string {
    return '  '.repeat(this.indentation + additional);
  }

  private generateInteger(node: Integer): string {
    return node.value.toString();
  }

  private generateMinus(node: Minus): string {
    // TODO if for example negative is a number then dont generate ()
    return `-(${this.walk(node.node)})`;
  }

  private generateBool(node: Bool): string {
    return node.value ? 'true' : 'false';
  }

  private generateBinary(node: Binary): string {
    return node.operator.value === '**'
      ? `__pow(${this.walk(node.left)}, ${this.walk(node.right)})` // TODO __pov
      : `${this.walk(node.left)} ${node.operator.value} ${this.walk(node.right)}`;
  }

  private generateComparison(node: Comparison): string {
    return `${this.walk(node.left)} ${node.symbol.value.replace('!=', '~=')} ${this.walk(node.right)}`;
  }

  private generateIdentifier(node: Identifier): string {
    return node.name;
  }

  private generateFunction(node: Function): string {
    const parameters: string[] = [];
    const defaultParameters: Array<{name: string; value: Node}> = [];

    for (const parameter of node.parameters) {
      // TODO:  rest, optional. self
      if (parameter instanceof Identifier) {
        parameters.push(parameter.name);
      } else if (parameter instanceof Assignment) {
        const { name } = parameter.left as Identifier;
        defaultParameters.push({
          name,
          value: parameter.right,
        });
        parameters.push(name);
      } else {
        assert(false);
      }
    }

    this.indentation++;

    const statements = `${this.generateIndentation()}${this.walk(node.body)}\n`;
    let defaultBlock = '';

    for (const parameter of defaultParameters) {
      defaultBlock += `${this.generateIndentation()}if ${parameter.name} == nil then ${parameter.name} = ${this.walk(parameter.value)} end\n`;
    }

    // TODO: selfParameters

    this.indentation--;

    // TODO: in class

    return `function (${parameters.join(', ')})\n${defaultBlock}${statements}${this.generateIndentation()}end`;
  }

  private generateParenthesized(node: Parenthesized): string {
    return `(${this.walk(node.node)})`;
  }

  private generateReturn(node: Return): string {
    return `return${node.node ? ` ${this.walk(node.node)}` : ''}`;
  }

  private generateCall(node: Call): string {
    // TODO: self

    const caller = this.walk(node.caller);

    const callArguments: string[] = [];

    for (const argument of node.arguments) {
      callArguments.push(this.walk(argument));
    }

    // TODO: super

    return `${caller}(${callArguments.join(', ')})`;
  }

  private generateLua(node: Lua): string {
    return node.code.replace(/\\n/g, '\n');
  }

  private generateAssignment(node: Assignment): string {
    const left = this.walk(node.left);
    const right = this.walk(node.right);

    // TODO: sequence
    if (node.left instanceof Identifier && node.local.length > 0) {
      return `local ${node.local.join(', ')}\n${this.generateIndentation()}${left} = ${right}`;
    }

    return `${left} = ${right}`;
  }

  private generateBlock(node: Block): string {
    const standalone = node.stack.at(-1)?.type !== StackType.INSIDE;

    let body = '';

    if (standalone) {
      this.indentation++;
    }

    node.body.forEach((inBody, i) => {
      // TODO: defer
      // TODO: ;
      const newLine = i < (node.body.length - 1) ? '\n' : '';
      const indentation = standalone
        ? this.generateIndentation()
        : (i > 0 ? this.generateIndentation() : '');

      body += `${indentation}${this.walk(inBody)}${newLine}`;
    });

    if (standalone) {
      this.indentation--;
    }

    return !standalone ? `${body}` : `do\n${body}\n${this.generateIndentation()}end`;
  }

  private generateArray(node: MSArray): string {
    const elements: string[] = [];

    for (const element of node.elements) {
  			elements.push(this.walk(element));
    }

    return `{${elements.join(', ')}}`;
  }

  private walk(node: Node): string {
    if (node instanceof Integer) {
      return this.generateInteger(node);
    }
    if (node instanceof Minus) {
      return this.generateMinus(node);
    }
    if (node instanceof Binary) {
      return this.generateBinary(node);
    }
    if (node instanceof Bool) {
      return this.generateBool(node);
    }
    if (node instanceof Comparison) {
      return this.generateComparison(node);
    }
    if (node instanceof Identifier) {
      return this.generateIdentifier(node);
    }
    if (node instanceof Parenthesized) {
      return this.generateParenthesized(node);
    }
    if (node instanceof Function) {
      return this.generateFunction(node);
    }
    if (node instanceof Return) {
      return this.generateReturn(node);
    }
    if (node instanceof Call) {
      return this.generateCall(node);
    }
    if (node instanceof Lua) {
      return this.generateLua(node);
    }
    if (node instanceof Assignment) {
      return this.generateAssignment(node);
    }
    if (node instanceof Block) {
      return this.generateBlock(node);
    }
    if (node instanceof MSArray) {
      return this.generateArray(node);
    }

    assert(false);
  }

  public generate(): string {
    this.program.nodes.forEach((node, i) => {
      this.code += `${this.walk(node)}${i === this.program.nodes.length - 1 ? '' : '\n'}`;
    });

    return this.code;
  }
}
