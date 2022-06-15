import { Source } from './source';
import { File } from './file';

export enum TokenType {
  UNKNOWN = 'unknown', // TODO: throw error if lexer returns at least 1 unknown token
  NUMBER = 'number',
  STRING = 'string',
  KEYWORD = 'keyword',
  SYMBOL = 'symbol',
}

export class Token {
  public type: TokenType;
  public value: string = '';
  public source: Source;

  constructor(type: TokenType, file: File) {
    this.type = type;
    this.source = new Source(file);
  }
}
