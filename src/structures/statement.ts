import { PRECEDENCE } from '../constants/precedence';
import { Source } from './source';

export enum StackType {
  REGULAR = 0,
  INSIDE = 1
}

type StackElement = {
  name: string;
  type: StackType;
};

export type Stack = StackElement[];

export abstract class Statement {
  public abstract name: string;
  public source: Source;
  public stack: Stack;

  constructor(stack: Stack) {
    this.stack = stack;
  }

  public getStack(type = StackType.REGULAR): StackElement {
    return {
      name: this.name,
      type,
    };
  }

  public get precedence(): number {
    return PRECEDENCE[this.name] ?? -1;
  }
}
