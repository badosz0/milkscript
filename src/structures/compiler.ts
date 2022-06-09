import { File } from './file';
import { Lexer } from './lexer';

export class Compiler {
  public compile(path: string): void {
    const file = new File(path);
    const lexer = new Lexer(file);

    const tokens = lexer.lex();

    console.log(tokens);
  }
}
