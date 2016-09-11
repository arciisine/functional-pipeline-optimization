import { Transformable, TransformableConstructor } from '../transform';
import { Analysis, Analyzable } from '../analyze';

export class Compilable<I,O> {
  public chain:Transformable<any, any>[] = null;
  
  constructor(public pending:[TransformableConstructor<any, any>, any[]][] = []) {}

  add<V>(cons:TransformableConstructor<O,V>, inputs:any[]):Compilable<I, V> {
    this.pending.push([cons,inputs]);
    return this as any as Compilable<I, V>;
  }
  
  finalize() {
    if (this.chain !== null) {
      throw new Error("Finalized!");
    } else {
      this.chain = this.pending.map(([cons, inputs], i) => {
        let res = new cons(inputs);
        res.position = i;
        return res;
      });
    }
  }
}