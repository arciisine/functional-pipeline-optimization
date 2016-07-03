import { Util, AST, Macro as m } from '../../node_modules/@arcsine/ecma-ast-transform/src';
import { Compilable } from './compilable';
import { TransformResponse } from '../transform';

export abstract class Compiler<T> {
  private static computed:{[key:string]:(...args:any[])=>any} = {};

  abstract prepareState():T;
  abstract compile<I, O>(compilable:Compilable<I, O>, state:T):AST.Node;

  exec<I, O>(compilable:Compilable<I, O>, data:I):O {
    return this.getCompiled(compilable)(data);
  }

  execManual<I, O>(compilable:Compilable<I, O>, data:I):O {
    return compilable.chain.reduce((acc, fn) => fn.manualTransform(acc), data) as any as O;
  }  

  generate<I, O>(compilable:Compilable<I, O>, state:T):TransformResponse {
    return compilable.chain
      .map(t => t.transform(state))
      .reduce((res, e) => {
        res.body.push(...e.body)
        res.vars.push(...e.vars);
        return res;
      }, {vars:[], body:[]});
  }

  getCompiled<I, O>(compilable:Compilable<I, O>):(i:I)=>O {
    if (Compiler.computed[compilable.key]) {
      return Compiler.computed[compilable.key];
    } 
    let res = Util.compile(this.compile(compilable, this.prepareState()) as any, {}) as (i:I)=>O;
    Compiler.computed[compilable.key] = res;
    return res;
  }
}