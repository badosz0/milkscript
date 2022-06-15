import { COLORS } from '../constants/colors';
import { ERRORS } from '../constants/errors';
import { inRange } from '../utils/math';
import { Source } from './source';

export class CompileError extends Error {
  public override name = 'CompileError';
  public errorID: number;
  public errorMessage: string;
  public source: Source;

  constructor(errorID: number, source: Source) {
    super('CompileError');
    this.errorMessage = ERRORS[errorID];
    this.errorID = errorID;
    this.source = source;
  }

  public print(): void {
    const contentLines = this.source.file.content.split('\n');
    const errorDisplay = `[M${this.errorID.toString().padStart(3, '0')}]`;

    const startLine = Math.max(0, this.source.line.start - 3);
    const endLine = Math.min(contentLines.length - 1, this.source.line.start + 3);
    const spaceBeforeLine = Math.max(4, endLine.toString().length);
    const isMultiLineError = this.source.line.start !== this.source.line.end;

    let log = `${COLORS.brightRed}${' '.repeat(Math.max(0, spaceBeforeLine - 4))}Error ${errorDisplay}${COLORS.reset}: ${this.errorMessage}\n`;

    log += `${' '.repeat(spaceBeforeLine)}┌─[${this.source.file.path}]\n`;
    log += `${' '.repeat(spaceBeforeLine)}│\n`;

    for (let i = startLine; i <= endLine; i++) {
      const lineNumber = (i + 1).toString();
      const lineColor = inRange(i, this.source.line) ? COLORS.brightWhite : COLORS.brightGray;
      const lineDisplay = `${lineColor}${' '.repeat(spaceBeforeLine - lineNumber.length - 1)}${lineNumber} ${COLORS.reset}${COLORS.brightGray}│ `;

      log += `${lineDisplay}${lineColor}${contentLines[i]}${COLORS.reset}\n`;

      if (i === this.source.line.end) {
        const underlineLength = isMultiLineError
          ? Math.max(...contentLines.filter((_, lx) => inRange(lx, this.source.line)).map(l => l.length))
          : this.source.character.end - this.source.character.start;
        const undelineBeforeAnchor = '─'.repeat((underlineLength / 2) - ((underlineLength / 2) % 1 !== 0 ? 0 : 1));
        const underline = `${undelineBeforeAnchor}┬${'─'.repeat(Math.trunc(underlineLength / 2))}`;
        const infoPrefix = `${' '.repeat(spaceBeforeLine)}· ${COLORS.brightGreen}`;

        log += `${infoPrefix}${' '.repeat(isMultiLineError ? 0 : this.source.character.start)}${underline}${COLORS.reset}\n`;
        log += `${infoPrefix}${' '.repeat((isMultiLineError ? 0 : this.source.character.start) + undelineBeforeAnchor.length)}╰─ here${COLORS.reset}\n`;
      }
    }

    log += `${' '.repeat(spaceBeforeLine)}│\n`;
    log += `${' '.repeat(spaceBeforeLine)}└─`;

    log += COLORS.reset;
    console.log(log);
  }
}
