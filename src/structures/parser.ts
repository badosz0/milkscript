import { LUA_KEYWORDS } from '../constants/lua';
import { PRECEDENCE } from '../constants/precedence';
import { CompileError } from './error';
import { Source } from './source';
import { Stack, StackType, Statement } from './statement';
import { Binary } from './statements/binary';
import { Bool } from './statements/bool';
import { Call } from './statements/call';
import { Comparison } from './statements/comparison';
import { Function } from './statements/function';
import { Identifier } from './statements/identifier';
import { Integer } from './statements/integer';
import { Minus } from './statements/minus';
import { Parenthesized } from './statements/parenthesized';
import { Program } from './statements/program';
import { Return } from './statements/return';
import { Token, TokenType } from './token';

export class Parser {
  private tokens: Token[];
  private index: number = 0;
  private program: Program = new Program([]);

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

  private checkToken(type: TokenType, value: string, skip = 0): boolean {
    const token = this.peek(skip);
    if (!token) {
      return false;
    }

    return type === token.type && value === token.value;
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

  private parseNumber(token: Token, precedence: number, stack: Stack): Statement {
    const integer = new Integer(stack);
    integer.value = Number(token.value);
    integer.source = token.source;

    return this.checkExpression(integer, precedence, [ ...stack, integer.getStack() ]);
  }

  private parseSymbol(token: Token, precedence: number, stack: Stack): Statement {
    switch (token.value) {
      case '-':
        return this.parseMinus(token, precedence, stack);
      case '(':
        return this.parseParenthesizedOrFunction(token, precedence, stack);
    }

    // TODO: default error
  }

  private parseParenthesizedOrFunction(token: Token, precedence: number, stack: Stack): Statement {
    // TODO: if if, for, elseif, case, switch, while, return

    let leftParen = 0;
    let rightParen = 0;

    for (let i = 0; i <= (this.tokens.length - this.index); i++) {
      const peek = this.peek(i);

      if (peek?.type !== TokenType.SYMBOL) {
        continue;
      }

      if (peek.value === '(') {
        leftParen++;
      } else if (peek.value === ')') {
        rightParen++;

        if (rightParen === leftParen + 1) {
          const next = this.peek(i + 1);

          if (next?.type === TokenType.SYMBOL && [ '{', '=>', '->' ].includes(next.value)) {
            return this.parseFunction(token, stack);
          } else {
            break;
          }
        }
      }
    }

    return this.parseParenthesized(token, precedence, stack);
  }

  private parseParenthesized(token: Token, precedence: number, stack: Stack): Statement {
    if (!this.peek()) {
      throw new CompileError(6, token.source);
    }

    if (this.checkToken(TokenType.SYMBOL, ')')) {
      throw new CompileError(7, this.createSource(token, this.peek()));
    }

    const parenthesized = new Parenthesized(stack);
    const statement = this.walk(parenthesized.precedence, [ ...stack, parenthesized.getStack(StackType.INSIDE) ]);

    parenthesized.statement = statement;

    if (!this.checkToken(TokenType.SYMBOL, ')')) {
      throw new CompileError(6, this.createSource(token, statement));
    }

    parenthesized.source = this.createSource(token, this.advance());

    return this.checkExpression(parenthesized, precedence, [ ...stack, parenthesized.getStack() ]);
  }

  private parseFunction(token: Token, stack: Stack): Statement {
    const function_ = new Function(stack);

    while (true) {
      if (!this.peek()) {
        throw new CompileError(8, token.source); // TODO: till last token?
      }

      if (this.checkToken(TokenType.SYMBOL, ')')) {
        break;
      }

      const parameter = this.walk(function_.precedence, [ ...stack, function_.getStack(StackType.INSIDE) ]);

      if (this.checkToken(TokenType.SYMBOL, ')')) {
        function_.parameters.push(parameter);
        break;
      }

      if (!this.checkToken(TokenType.SYMBOL, ',')) {
        throw new CompileError(9, this.createSource(token, this.peek() ?? parameter));
      }

      function_.parameters.push(parameter);
      this.advance();
    }

    const rightParen = this.advance();

    if (this.checkToken(TokenType.SYMBOL, '{')) {
      function_.body = this.walk(function_.precedence, [ ...stack, function_.getStack(StackType.INSIDE) ]);
    } else if (this.checkToken(TokenType.SYMBOL, '->')) {
      const arrow = this.advance();

      if (!this.peek()) {
        throw new CompileError(8, this.createSource(token, arrow));
      }

      function_.body = this.walk(function_.precedence, [ ...stack, function_.getStack(StackType.INSIDE) ]);
    } else if (this.checkToken(TokenType.SYMBOL, '=>')) {
      const arrow = this.advance();

      if (!this.peek()) {
        throw new CompileError(8, this.createSource(token, arrow));
      }

      function_.body = this.parseReturn(arrow, [ ...stack, function_.getStack(StackType.INSIDE) ]);
    } else {
      throw new CompileError(8, this.createSource(token, rightParen));
    }

    function_.source = this.createSource(token, function_.body);

    return function_;
  }

  private parseMinus(token: Token, precedence: number, stack: Stack): Statement {
    // TODO: if no peek, error
    const minus = new Minus(stack);
    const statement = this.walk(this.getPrecedence('prefix'), [ ...stack, minus.getStack(StackType.INSIDE) ]);

    minus.statement = statement;
    minus.source = this.createSource(token, statement);

    return this.checkExpression(minus, precedence, [ ...stack, minus.getStack() ]);
  }

  private parseKeyword(token: Token, precedence: number, stack: Stack): Statement {
    switch (token.value) {
      case 'true':
      case 'false':
        return this.parseBool(token, precedence, stack);
      case 'return':
        return this.parseReturn(token, stack);
      default:
        return this.parseIdentifier(token, precedence, stack);
    }
  }

  private parseBool(token: Token, precedence: number, stack: Stack): Statement {
    const bool = new Bool(stack);
    bool.value = token.value === 'true';
    bool.source = token.source;

    return this.checkExpression(bool, precedence, [ ...stack, bool.getStack() ]);
  }

  private parseReturn(token: Token, stack: Stack): Statement {
    const return_ = new Return(stack);

    if (this.peek()?.source.line.start === token.source.line.end) {
      return_.statement = this.walk(return_.precedence, [ ...stack, return_.getStack(StackType.INSIDE) ]);
      return_.source = this.createSource(token, return_.statement);
    } else {
      return_.source = token.source;
    }

    return return_;
  }

  private parseIdentifier(token: Token, precedence: number, stack: Stack): Statement {
    const identifier = new Identifier(stack);
    identifier.variable = token.value;
    identifier.source = token.source;

    if (LUA_KEYWORDS.includes(identifier.variable)) {
      identifier.variable = `__${identifier.variable}`;
    }

    return this.checkExpression(identifier, precedence, [ ...stack, identifier.getStack() ]);
  }

  private checkExpression(statement: Statement, precedence: number, stack: Stack): Statement {
    if (this.peek()) {
      statement = this.checkBinary(statement, precedence, stack);
      statement = this.checkComparison(statement, precedence, stack);
      statement = this.checkCall(statement, precedence, stack);
    }

    return statement;
  }

  private checkBinary(statement: Statement, precedence: number, stack: Stack): Statement {
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

    const binary = new Binary(stack);
    binary.operator = operator;
    binary.left = statement;
    binary.right = this.walk(binary.precedence, [ ...stack, binary.getStack(StackType.INSIDE) ]);
    binary.source = this.createSource(binary.left, binary.right);

    return this.checkExpression(binary, precedence, [ ...stack, binary.getStack() ]);
  }

  private checkComparison(statement: Statement, precedence: number, stack: Stack): Statement {
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

    const comparison = new Comparison(stack);
    comparison.symbol = symbol;
    comparison.left = statement;
    comparison.right = this.walk(comparison.precedence, [ ...stack, comparison.getStack(StackType.INSIDE) ]);
    comparison.source = this.createSource(comparison.left, comparison.right);

    return this.checkExpression(comparison, precedence, [ ...stack, comparison.getStack() ]);
  }

  private checkCall(statement: Statement, precedence: number, stack: Stack): Statement {
    if (!this.checkToken(TokenType.SYMBOL, '(')) {
      return statement;
    }

    if (this.peek().source.index.start !== statement.source.index.end) {
      return statement;
    }

    if (this.getPrecedence('call') < precedence) {
      return statement;
    }

    const call = new Call(stack);
    call.caller = statement;

    const leftParen = this.advance();

    while (true) {
      if (!this.peek()) {
	      throw new CompileError(10, this.createSource(statement, leftParen));
      }

      if (this.checkToken(TokenType.SYMBOL, ')')) {
        break;
      }

      const argument = this.walk(call.precedence, [ ...stack, call.getStack(StackType.INSIDE) ]);

      if (!this.peek()) {
	      throw new CompileError(10, this.createSource(statement, leftParen));
      }

      if (this.checkToken(TokenType.SYMBOL, ')')) {
        call.arguments.push(argument);
        break;
      }

      if (!this.checkToken(TokenType.SYMBOL, ',')) {
        throw new CompileError(11, this.createSource(statement, leftParen));
      } else {
        call.arguments.push(argument);
        this.advance();
      }
    }

    call.source = this.createSource(statement, this.advance());

    return this.checkExpression(call, precedence, [ ...stack, call.getStack() ]);
  }

  private walk(precendence: number, stack: Stack): Statement {
    const token = this.advance();

    switch (token.type) {
      case TokenType.NUMBER:
        return this.parseNumber(token, precendence, stack);
      case TokenType.SYMBOL:
        return this.parseSymbol(token, precendence, stack);
      case TokenType.KEYWORD:
        return this.parseKeyword(token, precendence, stack);
    }
  }

  public parse(): Program {
    const stack: Stack = [ ];

    while (this.index < this.tokens.length) {
      this.program.statements.push(this.walk(this.getPrecedence('program'), stack));
    }

    return this.program;
  }
}
