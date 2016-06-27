import { Util, AST, Macro as m } from '../../node_modules/ecma-ast-transform/src';
import { Compilable } from './compilable';
import { TransformResponse } from '../transform';

export abstract class Compiler<I,O,T> {
  private static computed:{[key:string]:(...args:any[])=>any} = {};

  abstract createState():T;
  abstract compile(collector:Compilable<I, O>, state:T):AST.Node;

  exec(collector:Compilable<I, O>, data:I):O {
    return this.getCompiled(collector)(data);
  }

  execManual(collector:Compilable<I, O>, data:I):O {
    return collector.chain.reduce((data, fn) => fn.manual(data), data) as any as O;
  }  

  generate(collector:Compilable<I, O>, state:T):TransformResponse {
    let vars:AST.Node[] = []
    let body:AST.Node[] = []
         
    collector.chain.slice()
      .reverse()
      .map(t => {
        return t.transformer({node:Util.parse(t.raw)}, state)
      })
      .reverse()
      .forEach(e => {
        body.push(...e.body)
        vars.push(...e.vars);
      });
    
    return { vars, body };
  }

  getCompiled(collector:Compilable<I, O>):(i:I)=>O {
    if (Compiler.computed[collector.key]) {
      return Compiler.computed[collector.key];
    } 
    let res = Util.compile(this.compile(collector, this.createState()) as any, {}) as (i:I)=>O;
    Compiler.computed[collector.key] = res;
    return res;
  }
}