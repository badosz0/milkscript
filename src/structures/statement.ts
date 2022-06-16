import { PRECEDENCE } from '../constants/precedence';
import { Source } from './source';

export abstract class Statement {
  public abstract name: string;
  public source: Source;

  public get precedence(): number {
    return PRECEDENCE[this.name] ?? -1;
  }
}
