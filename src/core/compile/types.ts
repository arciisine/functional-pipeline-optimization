import { AST } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import { Compilable } from './compilable';

export interface Compiler<T> {
  createState(extraState?:any):T;
  compile<I, O>(compilable:Compilable<I, O>, state:T):AST.Node
}

export interface ExecOutput<O> {
  value : O,
  assigned? : any[]
}

export interface ExecHandler<I, O>{
  (value:I, context?: {}, closed? : any[]):ExecOutput<O>
}

