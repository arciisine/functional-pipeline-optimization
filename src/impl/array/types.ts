import { AST } from '../../../node_modules/@arcsine/ecma-ast-transform/src';

export type VariableState = 'dynamic'|'inline'|'static'

export interface TransformState {
  contextId:AST.Identifier,
  elementId:AST.Identifier,
  returnValueId:AST.Identifier
  returnFnId:AST.Identifier,
  continueLabel:AST.Identifier,
  iteratorId:AST.Identifier,
  arrayId:AST.Identifier,
  functionId:AST.Identifier,
  buildReturn:(val:AST.Node)=>AST.ReturnStatement
  variableState:VariableState[]
}

export interface ExtraState {
  variableState:VariableState[]
}

export namespace Callback { 
  export interface Transform<T, W> {
    (v:T, i?:number, arr?:T[]):W
  }
  export interface Predicate<T> extends Transform<T, boolean> {}
  export interface Void<T> extends Transform<T, void> {}
  export interface None extends Function {}

  export interface Accumulate<T, W> {
    (acc:W, v:T, i?:number, arr?:T[]):W
  }
}

export namespace Handler {
  export interface Standard<T, U, V> {
    (callback:(v:T, i?:number, arr?:T[])=>V, context?:any):U
  }

  export interface Range<T> {
    (start:number, end?:number):T
  }

  export interface Reduce<T, U> {
    (callback:(acc:U, v:T, i?:number, arr?:T[])=>U, init:U, context?:any):U
  }
}