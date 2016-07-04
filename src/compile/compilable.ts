import { Transformable, Analysis, Analyzer, Analyzable } from '../transform';

export class Compilable<I,O> implements Analyzable {
  chain:Transformable<any, any>[] = []
  analysis:Analysis = { key : '~' };

  constructor(compilable?:Compilable<any, any>) {
    if (compilable) {
      this.chain = compilable.chain.slice();
      Analyzer.mergeAnalyses(this, compilable);
    }
  }

  add<V>(op?:Transformable<O, V>):Compilable<I, V> {
    this.chain.push(Analyzer.analyze(op));
    Analyzer.mergeAnalyses(this, op)
    return this as any as Compilable<I, V>;
  }
}