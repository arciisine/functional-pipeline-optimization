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

export interface Transformable<I, O> {
  raw:(...args:any[])=>any,
  args?:any[]
  manual?:(i:I, ...args:any[])=>O,
  transformer?:Transformer,
  key? : string,
  id? : number,
  init?: any,
  globals?:any,
  pure?: boolean
}