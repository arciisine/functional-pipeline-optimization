import { Transformable, TransformUtil } from '../transform';
import { Analysis, Analyzable } from '../analyze';

export class Compilable<I,O> implements Analyzable {
  chain:Transformable<any, any>[] = []
  analysis:Analysis = new Analysis('~');

  constructor(compilable?:Compilable<any, any>) {
    if (compilable) {
      this.chain = compilable.chain.slice();
      this.analysis.merge(compilable);
    }
  }

  add<V>(op?:Transformable<O, V>):Compilable<I, V> {
    this.chain.push(TransformUtil.analyze(op));
    this.analysis.merge(op);
    return this as any as Compilable<I, V>;
  }
}