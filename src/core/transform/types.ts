import {AST} from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import {Analysis, Analyzable} from '../analyze';

export interface TransformResponse {
  body:AST.Node[],
  vars:AST.Node[]
}

export interface Transformable<I, O> extends Analyzable {
  inputs:{[key:string]:any};
  callbacks:Function[]
  
  transform<T>(state:T):TransformResponse;
  manualTransform(data:I):O;
}