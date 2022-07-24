export function parseArgs(args: string[]): Record<string, string | boolean> {
  const parsedArgs: Record<string, string | boolean> = {};
  let currentFlag = '_';

  for (const token of args) {
    if (token.startsWith('-')) {
      if (token.charAt(1) === '-') {
        if (!parsedArgs[currentFlag] && currentFlag !== '_') {
          parsedArgs[currentFlag] = true;
        }

        currentFlag = token.slice(2);
        continue;
      }

      for (const digit of token.slice(1)) {
        parsedArgs[digit] = true;
        currentFlag = digit;
      }

      continue;
    }
    if (parsedArgs[currentFlag] && typeof parsedArgs[currentFlag] === 'string') {
      parsedArgs[currentFlag] += ' ' + token;
    } else {
      parsedArgs[currentFlag] = token;
    }
  }

  if (!parsedArgs[currentFlag] && currentFlag !== '_') {
    parsedArgs[currentFlag] = true;
  }

  return parsedArgs;
}
