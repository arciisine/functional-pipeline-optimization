import { Transformable, TransformUtil } from '../transform';
import { Analysis, Analyzable } from '../analyze';

export class Compilable<I,O> implements Analyzable {
  chain:Transformable<any, any>[] = []
  private _analysis:Analysis;  

  constructor() {}

  add<V>(op?:Transformable<O, V>):Compilable<I, V> {
    this.chain.push(TransformUtil.analyze(op));
    return this as any as Compilable<I, V>;
  }

  get analysis():Analysis {
    if (this._analysis === undefined) {
      this._analysis = new Analysis('~')
      this.chain.forEach(op => this._analysis.merge(op));
    }
    return this._analysis
  }
}