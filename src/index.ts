import { Compiler } from './structures/compiler';
import { parseArgs } from './utils/flags';

function init(): void {
  const compiler = new Compiler();
  const flags = parseArgs(process.argv);
  const path = (flags._ as string).split(' ');

  if (path.length !== 3) {
    // TODO:
    throw new Error('no file');
  }

  compiler.compile(path.at(-1), flags);
}

if (require.main === module) {
  init();
}
