import { Util, AST } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import { Compilable } from './compilable';
import { Compiler } from './compiler';
import { TransformResponse } from '../transform';

export class CompilerUtil {
  private static computed:{[key:string]:(...args:any[])=>any} = {};

  static manual<I, O>(compilable:Compilable<I, O>, data:I):O {
    return compilable.chain.reduce((acc, fn) => fn.manualTransform(acc), data) as any as O;
  }  

  static readChain<T, I, O>(compilable:Compilable<I, O>, state:T):TransformResponse {
    return compilable.chain
      .map(t => t.transform(state))
      .reduce((res, e) => {
        res.body.push(...e.body)
        res.vars.push(...e.vars);
        return res;
      }, {vars:[], body:[]});
  }

  static compile<T, I, O>(compiler:Compiler<T>, compilable:Compilable<I, O>):(i:I)=>O {
    let key = compilable.analysis.key + "~" + compiler.constructor.name;
    if (CompilerUtil.computed[key]) {
      return CompilerUtil.computed[key];
    } 
    let state = compiler.createState();
    let ast = compiler.compile(compilable, state);
    let res = Util.compile(ast as any, {}) as (i:I)=>O;
    CompilerUtil.computed[key] = res;
    return res;
  }
}
