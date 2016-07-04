import { AST } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import { Compilable } from './compilable';

export interface Compiler<T> {
  createState():T;
  compile<I, O>(compilable:Compilable<I, O>, state:T):AST.Node
}