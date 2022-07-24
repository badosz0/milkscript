import { assert } from 'node:console';
import { LUA_KEYWORDS } from '../constants/lua';
import { PRECEDENCE } from '../constants/precedence';
import { CompileError } from './error';
import { Source } from './source';
import { Stack, StackType, Node, NodeType } from './node';
import { Assignment } from './nodes/assignment';
import { Binary } from './nodes/binary';
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
import { Token, TokenType } from './token';
import { Block } from './nodes/block';
import { Array } from './nodes/array';
import { For } from './nodes/for';
import { Match, MatchCase, MatchDefaultCase } from './nodes/match';
import { Text } from './nodes/text';

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

  private getPrecedence(node: Node | NodeType): number {
    return PRECEDENCE[node instanceof Node ? node.type : node] ?? 0;
  }

  private createSource(start: Token | Node, end: Node | Token): Source {
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

  private parseNumber(token: Token, precedence: number, stack: Stack): Node {
    const integer = new Integer(stack);
    integer.value = Number(token.value);
    integer.source = token.source;

    return this.checkExpression(integer, precedence, [ ...stack, integer.getStack() ]);
  }

  private parseString(token: Token, precedence: number, stack: Stack): Node {
    const text = new Text(stack);
    text.value = token.value;
    text.source = token.source;

    return this.checkExpression(text, precedence, [ ...stack, text.getStack() ]);
  }

  private parseSymbol(token: Token, precedence: number, stack: Stack): Node {
    switch (token.value) {
      case '-':
        return this.parseMinus(token, precedence, stack);
      case '(':
        return this.parseParenthesizedOrFunction(token, precedence, stack);
      case '{':
        return this.parseBlock(token, precedence, stack);
      case '[':
        return this.parseArray(token, precedence, stack);
      case '#':
        return this.parseDirective(token, precedence, stack);
      default:
        assert(false, 'symbol');// TODO: default error
    }
  }

  private parseArray(token: Token, precedence: number, stack: Stack): Node {
    const array = new Array(stack);
    const elements: Node[] = [];

    while (true) {
      if (!this.peek()) {
        throw new CompileError(19, token.source);
      }

      if (this.checkToken(TokenType.SYMBOL, ']')) {
        break;
      }

      const element = this.walk(array.precedence, [ ...stack, array.getStack(StackType.INSIDE) ]);

      if (!this.peek()) {
        throw new CompileError(19, token.source);
      }

      if (this.checkToken(TokenType.SYMBOL, ']')) {
        elements.push(element);
        break;
      }

      if (!this.checkToken(TokenType.SYMBOL, ',')) {
        throw new CompileError(20, this.peek().source);
      } else {
        elements.push(element);
        this.advance();
      }
    }

    array.elements = elements;
    array.source = this.createSource(token, this.advance());

    return this.checkExpression(array, precedence, [ ...stack, array.getStack() ]);
  }

  private parseBlock(token: Token, precedence: number, stack: Stack): Node {
    if (!this.peek()) {
      throw new CompileError(17, token.source);
    }

    const block = new Block(stack);
    const nodes: Node[] = [];

    while (true) {
      if (!this.peek()) {
        throw new CompileError(17, token.source);
      }

      if (this.checkToken(TokenType.SYMBOL, '}')) {
        break;
      }

      nodes.push(this.walk(block.precedence, [ ...stack, block.getStack(StackType.INSIDE) ]));
    }

    block.body = nodes;
    block.source = this.createSource(token, this.advance());

    return block;
  }

  private parseDirective(token: Token, precedence: number, stack: Stack): Node {
    const directive = this.peek();

    if (!directive) {
      throw new CompileError(12, token.source);
    }

    if (directive.type !== TokenType.KEYWORD) {
      throw new CompileError(13, directive.source);
    }

    switch (directive.value) {
      case 'lua':
        return this.parseLua(token, precedence, stack);
      default:
        throw new CompileError(14, directive.source);
    }
  }

  private parseLua(token: Token, precedence: number, stack: Stack): Node {
    const keyword = this.advance();

    if (!this.checkTokenType(TokenType.STRING)) {
      throw new CompileError(15, this.createSource(token, keyword));
    }

    const code = this.advance();

    const lua = new Lua(stack);
    lua.source = this.createSource(token, code);
    lua.code = code.value;

    return lua;
  }

  private parseParenthesizedOrFunction(token: Token, precedence: number, stack: Stack): Node {
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

  private parseParenthesized(token: Token, precedence: number, stack: Stack): Node {
    if (!this.peek()) {
      throw new CompileError(6, token.source);
    }

    if (this.checkToken(TokenType.SYMBOL, ')')) {
      throw new CompileError(7, this.createSource(token, this.peek()));
    }

    const parenthesized = new Parenthesized(stack);
    const node = this.walk(parenthesized.precedence, [ ...stack, parenthesized.getStack(StackType.INSIDE) ]);

    parenthesized.node = node;

    if (!this.checkToken(TokenType.SYMBOL, ')')) {
      throw new CompileError(6, this.createSource(token, node));
    }

    parenthesized.source = this.createSource(token, this.advance());

    return this.checkExpression(parenthesized, precedence, [ ...stack, parenthesized.getStack() ]);
  }

  private parseFunction(token: Token, stack: Stack): Node {
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

  private parseMinus(token: Token, precedence: number, stack: Stack): Node {
    // TODO: if no peek, error
    const minus = new Minus(stack);
    const node = this.walk(this.getPrecedence(NodeType.PREFIX), [ ...stack, minus.getStack(StackType.INSIDE) ]);

    minus.node = node;
    minus.source = this.createSource(token, node);

    return this.checkExpression(minus, precedence, [ ...stack, minus.getStack() ]);
  }

  private parseKeyword(token: Token, precedence: number, stack: Stack): Node {
    switch (token.value) {
      case 'true':
      case 'false':
        return this.parseBool(token, precedence, stack);
      case 'for':
        return this.parseFor(token, precedence, stack);
      case 'match':
        return this.parseMatch(token, precedence, stack);
      case 'return':
        return this.parseReturn(token, stack);
      default:
        return this.parseIdentifier(token, precedence, stack);
    }
  }

  private parseFor(token: Token, precedence: number, stack: Stack): Node {
    const for_ = new For(stack);

    if (!this.peek()) {
      throw new CompileError(21, token.source);
    }

    if (this.checkToken(TokenType.SYMBOL, '<')) {
      for_.reverse = true;
      this.advance();
    }

    let first = this.walk(for_.precedence, [ ...stack, for_.getStack(StackType.INSIDE) ]);

    if (!this.peek()) {
      throw new CompileError(21, token.source);
    }

    if (this.checkToken(TokenType.SYMBOL, ':')) {
      if (!(first instanceof Identifier)) {
        throw new CompileError(22, token.source);
      }

      for_.name = first.name;
      this.advance();

      first = this.walk(for_.precedence, [ ...stack, for_.getStack(StackType.INSIDE) ]);
    }

    if (this.checkToken(TokenType.SYMBOL, '..')) {
      this.advance();
      for_.from = first;

      if (!this.peek()) {
        throw new CompileError(21, this.createSource(token, first));
      }

      for_.to = this.walk(for_.precedence, [ ...stack, for_.getStack(StackType.INSIDE) ]);
    } else {
      for_.variable = first;
    }

    if (!this.peek()) {
      throw new CompileError(21, this.createSource(token, first));
    }

    for_.body = this.walk(for_.precedence, [ ...stack, for_.getStack(StackType.INSIDE) ]);
    for_.source = this.createSource(token, for_.body);

    return for_;
  }

  private parseMatch(token: Token, precedence: number, stack: Stack): Node {
    const match = new Match(stack);

    if (!this.peek()) {
      throw new CompileError(23, token.source);
    }

    match.test = this.walk(match.precedence, [ ...stack, match.getStack(StackType.INSIDE) ]);

    if (!this.checkToken(TokenType.SYMBOL, '{')) {
      throw new CompileError(23, token.source);
    }

    let last: Node | Token = this.advance();

    while (true) {
      if (!this.peek()) {
        throw new CompileError(23, this.createSource(token, last));
      }

      let case_: MatchCase | MatchDefaultCase;

      if (this.checkToken(TokenType.KEYWORD, 'default')) {
        case_ = new MatchDefaultCase();
        this.advance();
      } else {
        case_ = new MatchCase();
      }

      while (true && !(case_ instanceof MatchDefaultCase)) {
        case_.conditions.push(this.walk(match.precedence, [ ...stack, match.getStack(StackType.INSIDE) ]));

        if (!this.checkToken(TokenType.SYMBOL, '|')) {
          break;
        }

        this.advance();
      }

      if (this.checkToken(TokenType.SYMBOL, '->')) {
        last = this.advance();

        if (!this.peek()) {
          throw new CompileError(23, this.createSource(token, last));
        }

        case_.body = this.walk(match.precedence, [ ...stack, match.getStack(StackType.INSIDE) ]);
        last = case_.body;
      } else if (this.checkToken(TokenType.SYMBOL, '=>')) {
        last = this.advance();

        if (!this.peek()) {
          throw new CompileError(23, this.createSource(token, last));
        }

        case_.body = this.parseReturn(last, [ ...stack, match.getStack(StackType.INSIDE) ]);
        last = case_.body;
      } else {
        throw new CompileError(24, this.createSource(token, last));
      }

      match.cases.push(case_);

      if (this.checkToken(TokenType.SYMBOL, '}')) {
        break;
      }
    }

    match.source = this.createSource(token, this.advance());

    return match;
  }

  private parseBool(token: Token, precedence: number, stack: Stack): Node {
    const bool = new Bool(stack);
    bool.value = token.value === 'true';
    bool.source = token.source;

    return this.checkExpression(bool, precedence, [ ...stack, bool.getStack() ]);
  }

  private parseReturn(token: Token, stack: Stack): Node {
    const return_ = new Return(stack);

    if (this.peek()?.source.line.start === token.source.line.end) {
      return_.node = this.walk(return_.precedence, [ ...stack, return_.getStack(StackType.INSIDE) ]);
      return_.source = this.createSource(token, return_.node);
    } else {
      return_.source = token.source;
    }

    return return_;
  }

  private parseIdentifier(token: Token, precedence: number, stack: Stack): Node {
    const identifier = new Identifier(stack);
    identifier.name = token.value;
    identifier.source = token.source;

    if (LUA_KEYWORDS.includes(identifier.name)) {
      identifier.name = `__${identifier.name}`;
    }

    return this.checkExpression(identifier, precedence, [ ...stack, identifier.getStack() ]);
  }

  private checkExpression(node: Node, precedence: number, stack: Stack): Node {
    if (this.peek()) {
      node = this.checkBinary(node, precedence, stack);
      node = this.checkComparison(node, precedence, stack);
      node = this.checkCall(node, precedence, stack);
      node = this.checkAssignment(node, precedence, stack);
    }

    return node;
  }

  private checkBinary(node: Node, precedence: number, stack: Stack): Node {
    if (!this.checkTokenType(TokenType.SYMBOL) || ![ '+', '-', '*', '/', '%', '**' ].includes(this.peek().value)) {
      return node;
    }

    if (this.getPrecedence(NodeType.BINARY) < precedence) {
      return node;
    }

    const operator = this.advance();

    if (!this.peek()) {
      throw new CompileError(5, this.createSource(node, operator));
    }

    const binary = new Binary(stack);
    binary.operator = operator;
    binary.left = node;
    binary.right = this.walk(binary.precedence, [ ...stack, binary.getStack(StackType.INSIDE) ]);
    binary.source = this.createSource(binary.left, binary.right);

    return this.checkExpression(binary, precedence, [ ...stack, binary.getStack() ]);
  }

  private checkComparison(node: Node, precedence: number, stack: Stack): Node {
    if (!this.checkTokenType(TokenType.SYMBOL) || ![ '<', '>', '<=', '>=', '==', '!=' ].includes(this.peek().value)) {
      return node;
    }

    if (this.getPrecedence(NodeType.COMPARISON) < precedence) {
      return node;
    }

    const symbol = this.advance();

    if (!this.peek()) {
      throw new CompileError(4, this.createSource(node, symbol));
    }

    const comparison = new Comparison(stack);
    comparison.symbol = symbol;
    comparison.left = node;
    comparison.right = this.walk(comparison.precedence, [ ...stack, comparison.getStack(StackType.INSIDE) ]);
    comparison.source = this.createSource(comparison.left, comparison.right);

    return this.checkExpression(comparison, precedence, [ ...stack, comparison.getStack() ]);
  }

  private checkAssignment(node: Node, precedence: number, stack: Stack): Node {
    if (!this.checkToken(TokenType.SYMBOL, '=')) {
      return node;
    }

    if (this.getPrecedence(NodeType.ASSIGNMENT) < precedence) {
      return node;
    }

    const symbol = this.advance();

    if (!this.peek()) {
      throw new CompileError(16, this.createSource(node, symbol));
    }

    const assignment = new Assignment(stack);

    assignment.left = node;
    assignment.right = this.walk(assignment.precedence, [ ...stack, assignment.getStack(StackType.INSIDE) ]);
    assignment.source = this.createSource(assignment.left, assignment.right);

    return this.checkExpression(assignment, precedence, [ ...stack, assignment.getStack() ]);
  }

  private checkCall(node: Node, precedence: number, stack: Stack): Node {
    if (!this.checkToken(TokenType.SYMBOL, '(')) {
      return node;
    }

    if (this.peek().source.index.start !== node.source.index.end) {
      return node;
    }

    if (this.getPrecedence(NodeType.CALL) < precedence) {
      return node;
    }

    const call = new Call(stack);
    call.caller = node;

    const leftParen = this.advance();

    while (true) {
      if (!this.peek()) {
	      throw new CompileError(10, this.createSource(node, leftParen));
      }

      if (this.checkToken(TokenType.SYMBOL, ')')) {
        break;
      }

      const argument = this.walk(call.precedence, [ ...stack, call.getStack(StackType.INSIDE) ]);

      if (!this.peek()) {
	      throw new CompileError(10, this.createSource(node, leftParen));
      }

      if (this.checkToken(TokenType.SYMBOL, ')')) {
        call.arguments.push(argument);
        break;
      }

      if (!this.checkToken(TokenType.SYMBOL, ',')) {
        throw new CompileError(11, this.createSource(node, leftParen));
      } else {
        call.arguments.push(argument);
        this.advance();
      }
    }

    call.source = this.createSource(node, this.advance());

    return this.checkExpression(call, precedence, [ ...stack, call.getStack() ]);
  }

  private walk(precendence: number, stack: Stack): Node {
    const token = this.advance();

    switch (token.type) {
      case TokenType.NUMBER:
        return this.parseNumber(token, precendence, stack);
      case TokenType.SYMBOL:
        return this.parseSymbol(token, precendence, stack);
      case TokenType.KEYWORD:
        return this.parseKeyword(token, precendence, stack);
      case TokenType.STRING:
        return this.parseString(token, precendence, stack);
    }
  }

  public parse(): Program {
    const stack: Stack = [ ];

    while (this.index < this.tokens.length) {
      this.program.nodes.push(this.walk(this.getPrecedence(NodeType.PROGRAM), stack));
    }

    return this.program;
  }
}
