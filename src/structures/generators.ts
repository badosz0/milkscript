import { Statement } from './statement';
import { Binary } from './statements/binary';
import { Bool } from './statements/bool';
import { Comparison } from './statements/comparison';
import { Identifier } from './statements/identifier';
import { Integer } from './statements/integer';
import { Minus } from './statements/minus';
import { Program } from './statements/program';

export class Generator {
  private program: Program;
  public code: string = '';

  constructor(program: Program) {
    this.program = program;
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
  }

  public generate(): string {
    this.program.statements.forEach((statement, i) => {
      this.code += `${this.walk(statement)}${i === this.program.statements.length - 1 ? '' : '\n'}`;
    });

    return this.code;
  }
}
