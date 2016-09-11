import {AST} from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import {Analysis, Analyzable} from '../analyze';

export interface TransformResponse {
  vars?:AST.Node[],
  body?:AST.Node[],
  after?:AST.Node[]
}

export interface Transformable<I, O> extends Analyzable {
  position?:number;
  
  transform<T>(state:T):TransformResponse;
  manualTransform(data:I):O;
}

export interface TransformableConstructor<I,O> {
  new(opts:any):Transformable<I, O>
}