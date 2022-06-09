import { Compiler } from './structures/compiler';

function init(): void {
  const compiler = new Compiler();

  if (process.argv.length === 2) {
    // TODO:
    throw new Error('no file');
  }

  compiler.compile(process.argv[2]);
}

if (require.main === module) {
  init();
}
