import { Source } from './source';

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
  public source: Source = new Source();

  constructor(type: TokenType) {
    this.type = type;
  }
}
