type Range = {
  start: number;
  end: number;
};

export class Source {
  public index: Range = { start: 0, end: 0 };

  public character: Range = { start: 0, end: 0 };
  public line: Range = { start: 0, end: 0 };
}
