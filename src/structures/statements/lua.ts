import { Statement } from '../statement';

export class Lua extends Statement {
  public name: string = 'lua code';
  public code: string;
}
