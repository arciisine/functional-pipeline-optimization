import { Transformable, TransformTag, TransformLevel, Analyzer } from '../transform';

export class Compilable<I,O>  {
  chain:Transformable<any, any>[] = []
  tag:TransformTag = {
    key : '~',
    level : TransformLevel.NO_DEPENDENCE
  };

  constructor(compilable?:Compilable<any, any>) {
    if (compilable) {
      this.chain = compilable.chain.slice();
      this.tag = Analyzer.mergeTags(this.tag, compilable);
    }
  }

  add<V>(toAdd?:Transformable<O, V>):Compilable<I, V> {
    this.chain.push(Analyzer.tag(toAdd));
    Analyzer.mergeTags(this.tag, toAdd)
    return this as any as Compilable<I, V>;
  }
}