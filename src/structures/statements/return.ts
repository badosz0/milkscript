import { Statement } from '../statement';

export class Return extends Statement {
  public name: string = 'return';
  public statement?: Statement;
}
