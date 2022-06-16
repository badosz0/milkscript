import { LUA_KEYWORDS } from '../constants/lua';
import { PRECEDENCE } from '../constants/precedence';
import { CompileError } from './error';
import { Source } from './source';
import { Statement } from './statement';
import { Binary } from './statements/binary';
import { Bool } from './statements/bool';
import { Comparison } from './statements/comparison';
import { Identifier } from './statements/identifier';
import { Integer } from './statements/integer';
import { Minus } from './statements/minus';
import { Program } from './statements/program';
import { Token, TokenType } from './token';

export class Parser {
  private tokens: Token[];
  private index: number = 0;
  private program: Program = new Program();

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(position = 0): Token {
    return this.tokens[this.index + position];
  }

  private advance(): Token {
    return this.tokens[this.index++];
  }

  private checkTokenType(type: TokenType, skip = 0): boolean {
    const token = this.peek(skip);
    if (!token) {
      return false;
    }

    return type === token.type;
  }

  private getPrecedence(statement: Statement | string): number {
    return PRECEDENCE[typeof statement === 'string' ? statement : statement.name] ?? -1;
  }

  private createSource(start: Token | Statement, end: Statement | Token): Source {
    return {
      file: start.source.file,
      line: {
        start: start.source.line.start,
        end: end.source.line.end,
      },
      character: {
        start: start.source.character.start,
        end: end.source.character.end,
      },
      index: {
        start: start.source.index.start,
        end: end.source.index.end,
      },
    };
  }

  private parseNumber(token: Token, precedence: number): Statement {
    const integer = new Integer();
    integer.value = Number(token.value);
    integer.source = token.source;

    return this.checkExpression(integer, precedence);
  }

  private parseSymbol(token: Token, precedence: number): Statement {
    switch (token.value) {
      case '-':
        return this.parseMinus(token, precedence);

      // TODO: default error
    }
  }

  private parseMinus(token: Token, precedence: number): Statement {
    // TODO: if no peek, error
    const minus = new Minus();
    const statement = this.walk(this.getPrecedence('prefix'));

    minus.statement = statement;
    minus.source = this.createSource(token, statement);

    return this.checkExpression(minus, precedence);
  }

  private parseKeyword(token: Token, precedence: number): Statement {
    switch (token.value) {
      case 'true':
      case 'false':
        return this.parseBool(token, precedence);
      default:
        return this.parseIdentifier(token, precedence);
    }
  }

  private parseBool(token: Token, precedence: number): Statement {
    const bool = new Bool();
    bool.value = token.value === 'true';
    bool.source = token.source;

    return this.checkExpression(bool, precedence);
  }

  private parseIdentifier(token: Token, precedence: number): Statement {
    const identifier = new Identifier();
    identifier.variable = token.value;
    identifier.source = token.source;

    if (LUA_KEYWORDS.includes(identifier.variable)) {
      identifier.variable = `__${identifier.variable}`;
    }

    return this.checkExpression(identifier, precedence);
  }

  private checkExpression(statement: Statement, precedence: number): Statement {
    if (this.peek()) {
      statement = this.checkBinary(statement, precedence);
      statement = this.checkComparison(statement, precedence);
    }

    return statement;
  }

  private checkBinary(statement: Statement, precedence: number): Statement {
    if (!this.checkTokenType(TokenType.SYMBOL) || ![ '+', '-', '*', '/', '%', '**' ].includes(this.peek().value)) {
      return statement;
    }

    if (this.getPrecedence('binary') < precedence) {
      return statement;
    }

    const operator = this.advance();

    if (!this.peek()) {
      throw new CompileError(5, this.createSource(statement, operator));
    }

    const binary = new Binary();
    binary.operator = operator;
    binary.left = statement;
    binary.right = this.walk(binary.precedence);
    binary.source = this.createSource(binary.left, binary.right);

    return this.checkExpression(binary, precedence);
  }

  private checkComparison(statement: Statement, precedence: number): Statement {
    if (!this.checkTokenType(TokenType.SYMBOL) || ![ '<', '>', '<=', '>=', '==', '!=' ].includes(this.peek().value)) {
      return statement;
    }

    if (this.getPrecedence('comparison') < precedence) {
      return statement;
    }

    const symbol = this.advance();

    if (!this.peek()) {
      throw new CompileError(4, this.createSource(statement, symbol));
    }

    const comparison = new Comparison();
    comparison.symbol = symbol;
    comparison.left = statement;
    comparison.right = this.walk(comparison.precedence);
    comparison.source = this.createSource(comparison.left, comparison.right);

    return this.checkExpression(comparison, precedence);
  }

  private walk(precendence: number): Statement {
    const token = this.advance();

    switch (token.type) {
      case TokenType.NUMBER:
        return this.parseNumber(token, precendence);
      case TokenType.SYMBOL:
        return this.parseSymbol(token, precendence);
      case TokenType.KEYWORD:
        return this.parseKeyword(token, precendence);
    }
  }

  public parse(): Program {
    while (this.index < this.tokens.length) {
      this.program.statements.push(this.walk(this.getPrecedence('program')));
    }

    return this.program;
  }
}
