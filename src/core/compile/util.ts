import { CompileUtil, AST, OptimizeUtil } from '@arcsine/ecma-ast-transform/src';
import { EscodegenOptions } from '@arcsine/ecma-ast-transform/src/escodegen';
import { Compilable } from './compilable';
import { Compiler, ExecOutput, ExecHandler } from './types';
import { TransformResponse } from '../transform';

const CompileConfig:EscodegenOptions = {
  indent : false,
  format : {
    indent: {
      style: '  ',
      base: 0
    },
    renumber: true,
    hexadecimal: true,
    quotes: 'auto',
    escapeless: true,
    safeConcatenation: true
  }
};

export class CompilerUtil {
  static computed:{[key:string]:ExecHandler<any, any>|null} = {};

  static manual<I, O>(compilable:Compilable<I, O>, data:I):O {
    compilable.finalize();
    return compilable.chain.reduce((acc, fn) => fn.manualTransform(acc), data) as any as O;
  }  

  static readChain<T, I, O>(compilable:Compilable<I, O>, state:T):TransformResponse {
    let out = compilable.chain
      .map(t => t.transform(state))
      .reduce((res, e) => {
        res.body.push(...(e.body||[]));
        res.vars.push(...(e.vars||[]));
        res.after.push(...(e.after||[]));
        return res;
      }, {vars:[], body:[], after:[]});
    return out;
  }

  static compile<T, I, O>(compiler:Compiler<T>, compilable:Compilable<I, O>, key?:string, extraState?:any):ExecHandler<I,O> {
    let computed:ExecHandler<I,O>|null = key ? CompilerUtil.computed[key] : null;
    
    if (key && computed !== null) {
      return computed;
    }    

    compilable.finalize();
    const optimizer = OptimizeUtil.closure();
    let state = compiler.createState(extraState);
    let ast = compiler.compile(compilable, state);

    let src = CompileUtil.compileFunction(ast as any, {}, CompileConfig);
    //src = optimizer(src);    
    let res = CompileUtil.evaluate<ExecHandler<I,O>>(src);

    console.error("COMPILED", res.toString());

    if (key) {
      CompilerUtil.computed[key] = res;
    }
    return res;
  }
}
