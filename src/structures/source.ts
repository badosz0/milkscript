import { Range } from '../utils/math';
import { File } from './file';

export class Source {
  public index: Range = { start: 0, end: 0 };

  public character: Range = { start: 0, end: 0 };
  public line: Range = { start: 0, end: 0 };

  public file: File;

  constructor(file: File) {
    this.file = file;
  }
}
