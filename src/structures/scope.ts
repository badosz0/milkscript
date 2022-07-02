import { NodeType } from './node';
import { Source } from './source';

class ScopeVariable {
  public name: string;
  public source: Source;
  // TODO: const
  public level: number;
}

export class Scope {
  public nodeType: NodeType;
  public variables: ScopeVariable[] = [];
  public level: number = 0;

  constructor(nodeType: NodeType) {
    this.nodeType = nodeType;
  }

  public getVariable(name: string): ScopeVariable | null {
    return this.variables.find(v => v.name === name);
  }

  public addVariable(name: string, source: Source): void {
    this.variables.push({ name, source, level: this.level });
  }
}
