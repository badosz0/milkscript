import { Statement } from '../statement';

export class Call extends Statement {
  public name: string = 'call';
  public arguments: Statement[] = [];
  public caller: Statement;
}
