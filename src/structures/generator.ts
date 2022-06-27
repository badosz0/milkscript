import { assert } from 'node:console';
import { Statement } from './statement';
import { Binary } from './statements/binary';
import { Bool } from './statements/bool';
import { Call } from './statements/call';
import { Comparison } from './statements/comparison';
import { Function } from './statements/function';
import { Identifier } from './statements/identifier';
import { Integer } from './statements/integer';
import { Lua } from './statements/lua';
import { Minus } from './statements/minus';
import { Parenthesized } from './statements/parenthesized';
import { Program } from './statements/program';
import { Return } from './statements/return';

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

  private generateInteger(statement: Integer): string {
    return statement.value.toString();
  }

  private generateMinus(statement: Minus): string {
    // TODO if for example negative is a number then dont generate ()
    return `-(${this.walk(statement.statement)})`;
  }

  private generateBool(statement: Bool): string {
    return statement.value ? 'true' : 'false';
  }

  private generateBinary(statement: Binary): string {
    return statement.operator.value === '**'
      ? `__pow(${this.walk(statement.left)}, ${this.walk(statement.right)})` // TODO __pov
      : `${this.walk(statement.left)} ${statement.operator.value} ${this.walk(statement.right)}`;
  }

  private generateComparison(statement: Comparison): string {
    return `${this.walk(statement.left)} ${statement.symbol.value.replace('!=', '~=')} ${this.walk(statement.right)}`;
  }

  private generateIdentifier(statement: Identifier): string {
    return statement.variable;
  }

  private generateFunction(statement: Function): string {
    const parameters: string[] = [];

    for (const parameter of statement.parameters) {
      // TODO: assignment, rest, optional. se;f
      if (parameter instanceof Identifier) {
        parameters.push(parameter.variable);
      } else {
        assert(false);
      }
    }

    this.indentation++;

    const statements = `${this.generateIndentation()}${this.walk(statement.body)}\n`;

    // TODO: default block
    // TODO: selfParameters

    this.indentation--;

    // TODO: in class

    return `function (${parameters.join(', ')})\n${statements}${this.generateIndentation()}end`;
  }

  private generateParenthesized(statement: Parenthesized): string {
    return `(${this.walk(statement.statement)})`;
  }

  private generateReturn(statement: Return): string {
    return `return${statement.statement ? ` ${this.walk(statement.statement)}` : ''}`;
  }

  private generateCall(statement: Call): string {
    // TODO: self

    const caller = this.walk(statement.caller);

    const callArguments: string[] = [];

    for (const argument of statement.arguments) {
      callArguments.push(this.walk(argument));
    }

    // TODO: super

    return `${caller}(${callArguments.join(', ')})`;
  }

  private generateLua(statement: Lua): string {
    return statement.code.replace(/\\n/g, '\n');
  }

  private walk(statement: Statement): string {
    if (statement instanceof Integer) {
      return this.generateInteger(statement);
    }
    if (statement instanceof Minus) {
      return this.generateMinus(statement);
    }
    if (statement instanceof Binary) {
      return this.generateBinary(statement);
    }
    if (statement instanceof Bool) {
      return this.generateBool(statement);
    }
    if (statement instanceof Comparison) {
      return this.generateComparison(statement);
    }
    if (statement instanceof Identifier) {
      return this.generateIdentifier(statement);
    }
    if (statement instanceof Parenthesized) {
      return this.generateParenthesized(statement);
    }
    if (statement instanceof Function) {
      return this.generateFunction(statement);
    }
    if (statement instanceof Return) {
      return this.generateReturn(statement);
    }
    if (statement instanceof Call) {
      return this.generateCall(statement);
    }
    if (statement instanceof Lua) {
      return this.generateLua(statement);
    }

    assert(false);
  }

  public generate(): string {
    this.program.statements.forEach((statement, i) => {
      this.code += `${this.walk(statement)}${i === this.program.statements.length - 1 ? '' : '\n'}`;
    });

    return this.code;
  }
}
