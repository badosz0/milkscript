import { assert } from 'node:console';
import { ALPHABET, ESCAPES, HEX, NUMBERS, SPECIAL_SYMBOLS, SYMBOLS } from '../constants/characters';
import { CompileError } from './error';
import { File } from './file';
import { Token, TokenType } from './token';

export class Lexer {
  private file: File;
  private contentLength: number;

  private tokens: Token[] = [];
  private currentToken: Token;

  private index: number = 0;
  private character: number = 0;
  private line: number = 0;

  constructor(file: File) {
    this.file = file;
    this.contentLength = file.content.length;
    this.currentToken = new Token(TokenType.UNKNOWN, file);
  }

  private peek(position = 0): string {
    return this.file.content[this.index + position];
  }

  private advance(): string {
    this.character++;
    return this.file.content[this.index++];
  }

  private newLine(): void {
    this.line++;
    this.character = 0;
  }

  private eatChar(): string {
    this.character++;
    this.currentToken.value += this.file.content[this.index];
    return this.file.content[this.index++];
  }

  private isDigit(char: string): boolean {
    return NUMBERS.includes(char);
  }

  private isHex(char: string): boolean {
    return [ ...HEX, ...NUMBERS ].includes(char);
  }

  private isAlpha(char: string): boolean {
    return [ '_', ...ALPHABET ].includes(char);
  }

  private isSymbol(char: string): boolean {
    return SYMBOLS.includes(char);
  }

  private removeLastChar(): void {
    this.currentToken.value = this.currentToken.value.slice(0, -1);
  }

  private createToken(type: TokenType): void {
    this.currentToken.type = type;
    this.currentToken.source.line.end = this.line;
    this.currentToken.source.character.end = this.character;
    this.currentToken.source.index.end = this.index;

    this.tokens.push(this.currentToken);
    this.currentToken = new Token(TokenType.UNKNOWN, this.file);
  }

  private skipWhitespaceAndComments(): void {
    while (true) {
      switch (this.peek()) {
        case ' ':
        case '\r':
        case '\t':
          this.advance();
          break;
        case '\n':
          this.advance();
          this.newLine();
          break;
        case '/':
          if (this.peek(1) === '/') {
            while (this.peek() && this.peek() !== '\n') {
              this.advance();
            }
          } else if (this.peek(1) === '*') {
            while (this.peek() && !(this.peek() === '*' && this.peek(1) === '/')) {
              this.advance();
              if (this.peek() === '\n') {
                this.newLine();
              }
            }

            this.advance();
            this.advance();
            break;
          } else {
            return;
          }

          break;

        default:
          return;
      }
    }
  }

  public lex(): Token[] {
    while (this.index < this.contentLength) {
      this.skipWhitespaceAndComments();

      const currentCharacter = this.eatChar();
      if (!currentCharacter) {
        continue;
      }

      this.currentToken.source.index.start = this.index - 1;
      this.currentToken.source.character.start = this.character - 1;
      this.currentToken.source.line.start = this.line;

      if (this.isDigit(currentCharacter)) {
        while (this.isDigit(this.peek())) {
          this.eatChar();
        }

        if (this.peek() === '.' && this.isDigit(this.peek(1))) {
          this.eatChar();

          while (this.isDigit(this.peek())) {
            this.eatChar();
          }
        } else if (this.currentToken.value === '0' && this.peek() === 'x' && this.isHex(this.peek(1))) {
          this.eatChar();
          while (this.isHex(this.peek())) {
            this.eatChar();
          }
        }

        this.createToken(TokenType.NUMBER);
        continue;
      }

      if (this.isAlpha(currentCharacter)) {
        while (this.isAlpha(this.peek()) || this.isDigit(this.peek())) {
          this.eatChar();
        }

        this.createToken(TokenType.KEYWORD);
        continue;
      }

      if (this.isSymbol(currentCharacter)) {
        if (currentCharacter === '"' || currentCharacter === '\'') {
          const quote = currentCharacter;
          this.removeLastChar();

          while (this.peek() && this.peek() !== quote) {
            if (this.peek() === '\\') {
              this.eatChar();
              if (!ESCAPES.includes(this.peek())) {
                this.currentToken.source.character.start = this.character - 1;
                this.currentToken.source.character.end = this.character + 1;
                this.currentToken.source.line.end = this.line;
                throw new CompileError(3, this.currentToken.source);
              }
            }

            if (this.peek() === '\n') {
              this.advance();
              this.newLine();
              this.currentToken.value += '\\n';
            } else if (this.peek() === '\r') {
              this.advance();
              if (this.peek() === '\n') {
                this.advance();
                this.newLine();
                this.currentToken.value += '\\n';
              } else {
                assert(false);
              }
            } else {
              this.eatChar();
            }
          }

          if (!this.peek()) {
            const last2Chars = this.currentToken.value.slice(-2);

            this.currentToken.source.character.end = this.character;
            this.currentToken.source.line.end = last2Chars === '\\n' ? this.line - 1 : this.line;
            throw new CompileError(1, this.currentToken.source);
          }

          this.advance();
          this.createToken(TokenType.STRING);
          continue;
        }

        if (currentCharacter === '.' && this.isDigit(this.peek())) {
          this.currentToken.value = '0.';

          while (this.isDigit(this.peek())) {
            this.eatChar();
          }

          this.createToken(TokenType.NUMBER);
          continue;
        }

        if (SPECIAL_SYMBOLS.includes(currentCharacter + this.peek())) {
          if (SPECIAL_SYMBOLS.includes(currentCharacter + this.peek() + this.peek(1) + this.peek(2))) {
            this.eatChar();
            this.eatChar();
          } else if (SPECIAL_SYMBOLS.includes(currentCharacter + this.peek() + this.peek(1))) {
            this.eatChar();
          }

          this.eatChar();
        }

        this.createToken(TokenType.SYMBOL);
        continue;
      }

      this.currentToken.source.character.end = this.character;
      this.currentToken.source.line.end = this.line;
      throw new CompileError(2, this.currentToken.source);
    }

    return this.tokens;
  }
}
