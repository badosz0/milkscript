import { Statement } from '../statement';
import { Token } from '../token';

export class Assignment extends Statement {
  public name: string = 'assignment';
  public left: Statement;
  public right: Statement;
  public symbol: Token;
}
