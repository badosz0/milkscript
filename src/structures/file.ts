import { readFileSync } from 'node:fs';

export class File {
  public path: string;
  public content: string;

  constructor(path: string) {
    this.path = path;
    this.content = readFileSync(this.path, 'utf-8');
  }
}
