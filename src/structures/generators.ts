import { Statement } from './statement';
import { Binary } from './statements/binary';
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

  private generateBinary(statement: Binary): string {
    return statement.operator.value === '**'
      ? `__pow(${this.walk(statement.left)}, ${this.walk(statement.right)})`
      : `${this.walk(statement.left)} ${statement.operator.value} ${this.walk(statement.right)}`;
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
  }

  public generate(): string {
    this.program.statements.forEach((statement, i) => {
      this.code += `${this.walk(statement)}${i === this.program.statements.length - 1 ? '' : '\n'}`;
    });

    return this.code;
  }
}
