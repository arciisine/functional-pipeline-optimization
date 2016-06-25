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

export interface Transformable {
  (...args:any[]):any,
  key? : string,
  id? : number,
  type? : string,
  init?: any,
  globals?:any,
  pure?: boolean,
  transformer?:Transformer
}
