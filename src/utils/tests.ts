import { readdirSync } from 'node:fs';
import { COLORS } from '../constants/colors';
import { Compiler } from '../structures/compiler';

const TESTS = readdirSync(`${__dirname}/../../tests`)
  .map((name) => `./tests/${name}`)
  .filter((name) => name.endsWith('.milk'));

export function runTests(): void {
  const failed: Array<[string, string]> = [];

  for (const test of TESTS) {
    const message = `Running test with ${COLORS.brightGray}${test}${COLORS.reset}`;
    process.stdout.write(`${message} ${'.'.repeat(80 - message.length)} `);

    const compiler = new Compiler();
    const output = compiler.compile(test, {
      'no-ouput': true,
      'return-error': true,
    });

    if (!output) {
      process.stdout.write(`${COLORS.brightGreen}PASSED${COLORS.reset}\n`);
    } else {
      failed.push([ test, output ]);
      process.stdout.write(`${COLORS.brightRed}FAILED${COLORS.reset}\n`);
    }
  }

  console.log(`\n${TESTS.length - failed.length}/${TESTS.length} ${COLORS.brightGreen}PASSED${COLORS.reset}\n`);

  for (const fail of failed) {
    // TODO: better format
    console.log(`${COLORS.brightRed}FAILED${COLORS.reset}: ${COLORS.brightGray}${fail[0]}${COLORS.reset}`);
    console.log(`[\n\t${fail[1].replace('\n', '\n\t')}\n]`);
  }
}

