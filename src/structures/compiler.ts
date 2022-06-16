import { CompileError } from './error';
import { File } from './file';
import { Lexer } from './lexer';
import { Parser } from './parser';

export class Compiler {
  public compile(path: string): void {
    const file = new File(path);
    const lexer = new Lexer(file);

    try {
      const tokens = lexer.lex();

      const parser = new Parser(tokens);
      const program = parser.parse();

      console.log(JSON.stringify(program, null, 2));
    } catch (error) {
      if (error instanceof CompileError) {
        error.print();
      }

      console.log(error);
      // TODO
    }
  }
}
