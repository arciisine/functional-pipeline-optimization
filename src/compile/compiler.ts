import { Util, AST, Macro as m } from '../../node_modules/@arcsine/ecma-ast-transform/src';
import { Compilable } from './compilable';
import { TransformResponse } from '../transform';

export abstract class Compiler<I,O,T> {
  private static computed:{[key:string]:(...args:any[])=>any} = {};

  abstract prepareState():T;
  abstract compile(compilable:Compilable<I, O>, state:T):AST.Node;

  exec(compilable:Compilable<I, O>, data:I):O {
    return this.getCompiled(compilable)(data);
  }

  execManual(compilable:Compilable<I, O>, data:I):O {
    return compilable.chain.reduce((acc, fn) => fn.manualTransform(acc), data) as any as O;
  }  

  generate(compilable:Compilable<I, O>, state:T):TransformResponse {
    let vars:AST.Node[] = []
    let body:AST.Node[] = []
         
    compilable.chain.slice()
      .reverse()
      .map(t => t.transform(state))
      .reverse()
      .forEach(e => {
        body.push(...e.body)
        vars.push(...e.vars);
      });
    
    return { vars, body };
  }

  getCompiled(compilable:Compilable<I, O>):(i:I)=>O {
    if (Compiler.computed[compilable.key]) {
      return Compiler.computed[compilable.key];
    } 
    let res = Util.compile(this.compile(compilable, this.prepareState()) as any, {}) as (i:I)=>O;
    Compiler.computed[compilable.key] = res;
    return res;
  }
}