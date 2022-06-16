import { Statement } from '../statement';

export class Identifier extends Statement {
  public name: string = 'identifier';
  public variable: string;
}
