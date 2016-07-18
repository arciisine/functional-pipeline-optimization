import { Transformable, TransformUtil } from '../transform';
import { Analysis, Analyzable } from '../analyze';

export class Compilable<I,O> implements Analyzable {
  chain:Transformable<any, any>[] = []
  private _analysis:Analysis;
  public context:any[] = []
  public key:string;

  constructor() {}

  add<V>(op?:Transformable<O, V>):Compilable<I, V> {
    op.position = this.chain.length;
    this.context.push(op.inputs);
    this.chain.push(op);
    this.key += TransformUtil.analyze(op).analysis.key  + "~";
    return this as any as Compilable<I, V>;
  }

  get last():Transformable<any, O> {
    return this.chain[this.chain.length-1];
  }

  get analysis():Analysis {
    if (this._analysis === undefined) {
      this._analysis = new Analysis('~')
      for (let i = 0; i < this.chain.length; i++) {
        this._analysis.merge(this.chain[i])
      }
    }
    return this._analysis
  }
}