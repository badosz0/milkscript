import { PRECEDENCE } from '../constants/precedence';
import { Source } from './source';

export enum StackType {
  REGULAR = 0,
  INSIDE = 1
}

type StackElement = {
  node: Node;
  type: StackType;
};

export type Stack = StackElement[];

export abstract class Node {
  public abstract type: NodeType;
  public source: Source;
  public stack: Stack;

  constructor(stack: Stack) {
    this.stack = stack;
  }

  public getStack(type = StackType.REGULAR): StackElement {
    return {
      node: this,
      type,
    };
  }

  public get precedence(): number {
    return PRECEDENCE[this.type] ?? -1;
  }
}

export const enum NodeType {
  ARRAY = 'array',
  ASSIGNMENT = 'assignment',
  BINARY = 'binary operation',
  BLOCK = 'block statement',
  BOOL = 'boolean',
  CALL = 'function call',
  COMPARISON = 'comparison',
  FUNCTION = 'function declaration',
  IDENTIFIER = 'identifier',
  INTEGER = 'integer',
  LUA = 'lua code',
  MINUS = 'negitive statement',
  PARENTHESIZED = 'parenthesized statement',
  PROGRAM = 'program',
  RETURN = 'return statement',
  FOR = 'for statement',

  PREFIX = 'prefix'
}
