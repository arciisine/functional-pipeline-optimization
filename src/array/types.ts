import { AST, Macro as m, Util } from '../../node_modules/@arcsine/ecma-ast-transform/src';
import { Transformable, TrackedFunction } from '../transform';

export interface TransformState {
  elementId:AST.Identifier,
  returnValueId:AST.Identifier
  continueLabel:AST.Identifier,
  iteratorId:AST.Identifier,
  arrayId:AST.Identifier,
  functionId:AST.Identifier
}

export abstract class ScalarTransformable<T, U, V> extends Transformable<T[], U> {
  constructor(public callback:(el:T, i?:number, arr?:T[])=>V, public context?:any, globals?:any) {
    super([callback, context], globals);
  }
}

export abstract class ArrayTransformable<T, U, V> extends Transformable<T[], U[]> {
  constructor(public callback:(el:T, i?:number, arr?:T[])=>V, public context?:any, globals?:any) {
    super([callback, context], globals);
  }

  init(state:TransformState) {
    return m.Array();
  }

  collect(state:TransformState):AST.Node {
    return m.Expr(m.Call(m.GetProperty(state.returnValueId, 'push'), state.elementId))
  }
}
