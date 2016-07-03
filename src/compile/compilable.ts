import { Transformable, TransformLevel, Analyzer } from '../transform';

export class Compilable<I,O>  {
  key:string = '~';
  level:TransformLevel = TransformLevel.NO_DEPENDENCE;
  chain:Transformable<any, any>[] = []

  constructor(compilable?:Compilable<any, any>) {
    if (compilable) {
      this.chain = compilable.chain.slice();
      this.level = compilable.level;
      this.key = compilable.key;
    }
  }

  add(toAdd?:Transformable<any, any>):this {
    this.chain.push(Analyzer.analyze(toAdd));
    this.level = Math.min(this.level, toAdd.level);
    this.key = `${this.key}|${toAdd.id}`;
    return this;
  }
}