import { Transformable, TransformableConstructor, TransformUtil } from '../transform';
import { Analysis, Analyzable } from '../analyze';

export class Compilable<I,O> implements Analyzable {
  public chain:Transformable<any, any>[] = null;
  private pending:[TransformableConstructor<any, any>, any][] = [];
  public analysis:Analysis;
  public context:any[] = []
  public key:string;
  public last:Transformable<any, O>;

  add<V>(cons:TransformableConstructor<O,V>, args:any):Compilable<I, V> {
    if (this.chain !== null) {
      throw new Error("Finalized!");
    }
    this.context.push(args);
    this.pending.push([cons, args]);
    this.key += args.key + "~";
    return this as any as Compilable<I, V>;
  }
  
  finalize() {
    if (this.chain === null) {
      this.analysis = new Analysis('~')
      this.chain = this.pending.map(([cons,args], i) => {
        let res = new cons(args);
        res.analysis = TransformUtil.analyze(res).analysis;
        this.analysis.merge(res.analysis);
        res.position = i;
        return res;
      });
      this.last = this.chain[this.chain.length-1];
    }
  }
}