import { Statement } from '../statement';
import { Token } from '../token';

export class Binary extends Statement {
  public name: string = 'binary';
  public left: Statement;
  public right: Statement;
  public operator: Token;
}
