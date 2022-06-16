import { Statement } from '../statement';

export class Program extends Statement {
  public name: string = 'program';
  public statements: Statement[] = [];
}
