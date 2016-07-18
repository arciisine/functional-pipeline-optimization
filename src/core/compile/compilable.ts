import { Transformable, TransformableConstructor, TransformUtil } from '../transform';
import { Analysis, Analyzable } from '../analyze';

export class Compilable<I,O> implements Analyzable {
  public chain:Transformable<any, any>[] = null;
  private pending:[TransformableConstructor<any, any>, any][] = [];
  private _analysis:Analysis;
  public context:any[] = []
  public key:string;

  constructor() {}

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
      this.chain = [];
      for (let i = 0; i < this.pending.length; i++) {
        let [cons,args] = this.pending[i];
        let res = new cons(args);
        TransformUtil.analyze(res).analysis;
        res.position = i;
        this.chain.push(res);
      }
    }
  }

  get last():Transformable<any, O> {
    return this.chain[this.chain.length-1];
  }

  get analysis():Analysis {
    if (this.chain === null) {
      throw new Error("Not finalized!");
    }
    if (this._analysis === undefined) {
      this._analysis = new Analysis('~')
      let len = this.chain.length;
      for (let i = 0; i < len; i++) {
        this._analysis.merge(this.chain[i])
      }
    }
    return this._analysis
  }
}