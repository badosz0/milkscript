import { Statement } from '../statement';
import { Token } from '../token';

export class Comparison extends Statement {
  public name: string = 'comparison';
  public left: Statement;
  public right: Statement;
  public symbol: Token;
}