import { Analyzer } from './analyzer';
import { CompileError } from './error';
import { File } from './file';
import { Generator } from './generator';
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

      const analyzer = new Analyzer(program);
      analyzer.analyze();

      const generator = new Generator(program);
      const code = generator.generate();

      // console.log(JSON.stringify(program, null, 2));
      console.log(code);
    } catch (error) {
      if (error instanceof CompileError) {
        error.print();
        return;
      }

      console.log(error);
      // TODO
    }
  }
}
