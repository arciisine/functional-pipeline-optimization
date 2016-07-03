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

  add<V>(toAdd?:Transformable<O, V>):Compilable<I, V> {
    this.chain.push(Analyzer.analyze(toAdd));
    let tag = toAdd.tag;
    this.level = Math.min(this.level, tag.level);
    this.key = `${this.key}|${tag.id}`;
    return this as any as Compilable<I, V>;
  }
}