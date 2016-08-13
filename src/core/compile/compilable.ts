import { Transformable, TransformableConstructor } from '../transform';
import { Analysis, Analyzable } from '../analyze';

export class Compilable<I,O> implements Analyzable {
  public chain:Transformable<any, any>[] = null;
  public analysis:Analysis = null;
  
  constructor(public pending:[TransformableConstructor<any, any>, any[]][] = []) {}

  add<V>(cons:TransformableConstructor<O,V>, inputs:any[]):Compilable<I, V> {
    this.pending.push([cons,inputs]);
    return this as any as Compilable<I, V>;
  }

  analyze() {
    if (!this.analysis) {
      this.analysis =  new Analysis('~')
      this.chain = this.pending.map(([cons, inputs], i) => {
        let res = new cons(inputs);
        this.analysis.merge(res.analyze());
        res.position = i;
        return res;
      });
    }
    return this.analysis;
  }

  finalize() {
    if (this.analysis !== null) {
      throw new Error("Finalized!");
    } else {
      this.analyze();
    }
  }
}