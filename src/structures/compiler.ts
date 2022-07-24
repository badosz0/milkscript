import { writeFileSync } from 'node:fs';
import { Analyzer } from './analyzer';
import { CompileError } from './error';
import { File } from './file';
import { Generator } from './generator';
import { Lexer } from './lexer';
import { Parser } from './parser';

export type CompilerFlags = Record<string, string | boolean>;

export class Compiler {
  public compile(path: string, flags: CompilerFlags): void {
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

      writeFileSync(flags.output as string ?? 'out.lua', code);
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
