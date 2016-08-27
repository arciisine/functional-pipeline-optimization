import { CompileUtil, AST } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import { Compilable } from './compilable';
import { Compiler, ExecInput, ExecOutput, ExecHandler } from './types';
import { TransformResponse } from '../transform';

export class CompilerUtil {
  static computed:{[key:string]:ExecHandler<any, any>} = {};

  static manual<I, O>(compilable:Compilable<I, O>, data:I):O {
    compilable.finalize();
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

  static compile<T, I, O>(compiler:Compiler<T>, compilable:Compilable<I, O>, key:string = null):ExecHandler<I,O> {
    if (key && CompilerUtil.computed[key]) {
      return CompilerUtil.computed[key];
    }

    //Generate merged analysis 
    let state = compiler.createState();
    compilable.finalize(); //Prep final state

    let ast = compiler.compile(compilable, state);
    let res = CompileUtil.compile(ast as any, {}) as ExecHandler<I,O>;
    console.debug(res.toString())
    if (key) {
      CompilerUtil.computed[key] = res;
    }
    return res;
  }
}
