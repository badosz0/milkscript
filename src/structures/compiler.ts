import { CompileError } from './error';
import { File } from './file';
import { Lexer } from './lexer';

export class Compiler {
  public compile(path: string): void {
    const file = new File(path);
    const lexer = new Lexer(file);

    try {
      const tokens = lexer.lex();
      console.log(tokens);
    } catch (error) {
      if (error instanceof CompileError) {
        error.print();
      }
      // TODO
    }
  }
}
