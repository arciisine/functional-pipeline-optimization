import { AST } from '@arcsine/ecma-ast-transform/src';
import { Analysis } from '../../core';

export enum VariableState { 
  'dynamic', 
  'inline', 
  'static' 
}

export interface ExtraState {
  operations:[string, VariableState][]
}

export interface TransformState extends ExtraState {
  analysis:Analysis,
  contextId:AST.Identifier,
  elementId:AST.Identifier,
  returnValueId:AST.Identifier
  returnFnId:AST.Identifier,
  continueLabel:AST.Identifier,
  iteratorId:AST.Identifier,
  arrayId:AST.Identifier,
  tempElementId:AST.Identifier,
  tempIndexId:AST.Identifier,
  functionId:AST.Identifier,
  assignedReturn:AST.ArrayExpression,
  buildReturn:(val:AST.Node)=>AST.ReturnStatement
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