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

  export interface Map<T, W> {
    (v:T, i?:number, arr?:T[]):W
  }

  export interface Reduce<T, W> {
    (acc:W, v:T, i?:number, arr?:T[]):W
  }
}