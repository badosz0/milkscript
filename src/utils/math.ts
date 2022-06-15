export type Range = {
  start: number;
  end: number;
};

export function inRange(number: number, range: Range): boolean {
  return number >= range.start && number <= range.end;
}
