import { Transformable, TransformableConstructor, TransformUtil } from '../transform';
import { Analysis, Analyzable } from '../analyze';

export class Compilable<I,O> implements Analyzable {
  _chain:Transformable<any, any>[] = null;
  private _pending:[TransformableConstructor<any, any>, any][] = [];
  private _analysis:Analysis;
  public context:any[] = []
  public key:string;

  constructor() {}

  add<V>(cons:TransformableConstructor<O,V>, args:any):Compilable<I, V> {
    let key = args.key;
    this.context.push(args);
    
    //If chain is yet to be materialized
    if (this._chain === null && key) {
      //Store constructor and args
      this._pending.push([cons, args]);
    } else {
      //Instantiate latest
      let len = this.chain.length; //Make sure chain is created
      let op = new cons(args);
      op.position = len;
      this.chain.push(op);
      key = TransformUtil.analyze(op).analysis.key ;
    }
    this.key += key + "~";
    return this as any as Compilable<I, V>;
  }
  
  get chain():Transformable<any, any>[] {
    if (this._chain === null) {
      this._chain = this._pending.map(([cons, args], i) => {
        let res = new cons(args);
        TransformUtil.analyze(res).analysis;
        res.position = i;
        return res;
      })
    }
    return this._chain;
  }

  get last():Transformable<any, O> {
    let len = this.chain.length-1;
    return this._chain[len];
  }

  get analysis():Analysis {
    if (this._analysis === undefined) {
      this._analysis = new Analysis('~')
      let len = this.chain.length;
      for (let i = 0; i < len; i++) {
        this._analysis.merge(this._chain[i])
      }
    }
    return this._analysis
  }
}