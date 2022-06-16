import { Statement } from '../statement';

export class Function extends Statement {
  public name: string = 'function';
  public body: Statement;
  public parameters: Statement[] = [];
}
