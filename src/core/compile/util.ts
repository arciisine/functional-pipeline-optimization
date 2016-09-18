import { CompileUtil, AST } from '@arcsine/ecma-ast-transform/src';
import { EscodegenOptions } from '@arcsine/ecma-ast-transform/src/escodegen';
import { Compilable } from './compilable';
import { Compiler, ExecOutput, ExecHandler } from './types';
import { TransformResponse } from '../transform';

const CompileConfig:EscodegenOptions = {
  indent : false,
  format : {
    indent: {
      style: '',
      base: 0
    },
    renumber: true,
    hexadecimal: true,
    quotes: 'auto',
    escapeless: true,
    compact: true,
    parentheses: false,
    semicolons: false,
    safeConcatenation: true
  }
};

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
        res.body.push(...(e.body||[]));
        res.vars.push(...(e.vars||[]));
        res.after.push(...(e.after||[]));
        return res;
      }, {vars:[], body:[], after:[]});
  }

  static compile<T, I, O>(compiler:Compiler<T>, compilable:Compilable<I, O>, key:string = null, extraState:any = null):ExecHandler<I,O> {
    if (key && CompilerUtil.computed[key]) {
      return CompilerUtil.computed[key];
    }    

    compilable.finalize();

    let state = compiler.createState(extraState);
    let ast = compiler.compile(compilable, state);
    let res = CompileUtil.compile(ast as any, {}, CompileConfig, [x => x.replace(/continue/g, '; continue')]) as ExecHandler<I,O>;

    console.error("COMPILED", res.toString());

    if (key) {
      CompilerUtil.computed[key] = res;
    }
    return res;
  }
}
