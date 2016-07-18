import { AST } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import { Compilable } from './compilable';

export interface Compiler<T> {
  createState():T;
  compile<I, O>(compilable:Compilable<I, O>, state:T):AST.Node
}

export interface ExecInput<I> {
  value: I,
  context?: {},
  closed? : any[]
}

export interface ExecOutput<O> {
  value : O,
  assigned? : any[]
}

export interface ExecHandler<I, O>{
  (i:ExecInput<I>):ExecOutput<O>
}

declare global {
  interface Function {
    key:string        
    inline?:boolean
  }
}