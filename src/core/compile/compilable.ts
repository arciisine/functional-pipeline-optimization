import { Transformable, TransformableConstructor } from '../transform';
import { Analysis, Analyzable } from '../analyze';

export class Compilable<I,O> implements Analyzable {
  public chain:Transformable<any, any>[] = null;
  public pending:[TransformableConstructor<any, any>, any][];
  public analysis:Analysis = null;
  private keys:string[];
  public last:Transformable<any, O>;
  
  constructor() {
    this.keys = [this.constructor.name]
    this.pending = []
  }

  add<V>(cons:TransformableConstructor<O,V>, args:any):Compilable<I, V> {
    this.pending.push([cons,args]);
    this.keys.push(args.key);
    return this as any as Compilable<I, V>;
  }

  analyze() {
    let analysis =  new Analysis('~')
    this.chain = this.pending.map(([cons,args], i) => {
      let res = new cons(args);
      analysis.merge(res.analyze());
      res.position = i;
      return res;
    });
    this.last = this.chain[this.chain.length-1];
    return analysis;
  }

  get key() {
    return this.keys.join("~");
  }
  
  finalize() {
    if (this.analysis !== null) {
      throw new Error("Finalized!");
    } else {
      this.analysis = this.analyze();
    }
  }
}