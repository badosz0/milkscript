import { Statement } from '../statement';

export class Parenthesized extends Statement {
  public name: string = 'parenthesized';
  public statement: Statement;
}
