import { Node, NodeType } from './node';
import { Source } from './source';

class ScopeVariable {
  public name: string;
  public source: Source;
  // TODO: const
  public level: number;
}

class ScopeFunction {
  public name: string;
  public parameters: Node[];
  public source: Source;
  // TODO: const
  public level: number;
}

export class Scope {
  public nodeType: NodeType;
  public lastNodeType: NodeType;
  public variables: ScopeVariable[] = [];
  public functions: ScopeFunction[] = [];
  public level: number = 0;

  constructor(nodeType: NodeType) {
    this.nodeType = nodeType;
    this.lastNodeType = nodeType;
  }

  public getVariable(name: string): ScopeVariable | null {
    return this.variables.find(v => v.name === name);
  }

  public getFunction(name: string): ScopeFunction | null {
    return this.functions.find(v => v.name === name);
  }

  // TODO: check if already exists eg a = 1, a = () {}, a =3

  public addVariable(name: string, source: Source): void {
    this.variables.push({ name, source, level: this.level });
  }

  public addFunction(name: string, parameters: Node[], source: Source): void {
    this.functions.push({ name, parameters, source, level: this.level });
  }

  public start(nodeType: NodeType): void {
    this.lastNodeType = this.nodeType;
    this.nodeType = nodeType;
    this.level++;
  }

  public end(): void {
    this.nodeType = this.lastNodeType;

    this.variables = this.variables.filter(v => v.level < this.level);
    this.functions = this.functions.filter(f => f.level < this.level);

    this.level--;
  }
}
