import { AST } from '../../node_modules/@arcsine/ecma-ast-transform/src';

export interface TransformState {
  elementId:AST.Identifier,
  returnValueId:AST.Identifier
  continueLabel:AST.Identifier,
  iteratorId:AST.Identifier,
  arrayId:AST.Identifier,
  functionId:AST.Identifier
}

export namespace Callback { 
  export interface Predicate<T> {
    (v:T, i?:number, arr?:T[]):boolean
  }

  export interface Void<T> {
    (v:T, i?:number, arr?:T[]):void
  }

  export interface Transform<T, W> {
    (v:T, i?:number, arr?:T[]):W
  }

  export interface Accumulate<T, W> {
    (acc:W, v:T, i?:number, arr?:T[]):W
  }
}

export namespace Handler {
  export interface Standard<T, U, V> {
    (callback:(v:T, i?:number, arr?:T[])=>V, context?:any):U
  }

  export interface Reduce<T, U> {
    (callback:(acc:U, v:T, i?:number, arr?:T[])=>U, init:U, context?:any):U
  }
}