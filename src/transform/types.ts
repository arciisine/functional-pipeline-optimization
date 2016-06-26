import {AST} from '../../node_modules/ecma-ast-transform/src';

export interface Transformer {
  (ref:TransformReference, state:TransformState):TransformResponse
}

export interface TransformReference {
  node:AST.Node,
  params?:AST.Identifier[],
  onReturn?:(node:AST.ReturnStatement)=>AST.Node
}

export interface TransformState {
  element:AST.Identifier,
  ret?:AST.Identifier
  continueLabel?:AST.Identifier    
}

export interface TransformResponse {
  body:AST.Node[],
  vars:AST.Node[]
}

export abstract class Transformable<I, O> {

  key: string;
  id: number;
  pure: boolean;
  constructor(public raw:(...args:any[])=>any, public globals?:any) {}

  abstract transformer(ref:TransformReference, state:TransformState):TransformResponse;
  abstract manual(data:I):O;
}