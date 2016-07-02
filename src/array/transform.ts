import { AST, Macro as m, Util } from '../../node_modules/@arcsine/ecma-ast-transform/src';
import { BaseTransformable } from './base-transformable';
import { TransformState } from './types';

export const SUPPORTED = ['filter', 'map', 'reduce', 'forEach', 'find' ,'some'];

export abstract class ScalarTransformable<T, U, V> extends 
  BaseTransformable<T, U, (el:T, i?:number, arr?:T[])=>V, 
    (callback:(el:T, i?:number, arr?:T[])=>V, context?:any)=>U> 
{
  constructor(public callback:(el:T, i?:number, arr?:T[])=>V, public context?:any) {
    super(callback, context);
  }

  getParams(state:TransformState) {
    return [state.elementId];
  }
}

export abstract class ReduceTransformable<T, U, V> extends 
  BaseTransformable<T, U, (acc:U, el:T, i?:number, arr?:T[])=>V, 
    (callback:(acc:U, el:T, i?:number, arr?:T[])=>V, context?:any)=>U> 
{
  constructor(callback:(acc:U, el:T, i?:number, arr?:T[])=>V, public initValue?:U, context?:any) {
    super(callback, context);
    this.inputs.splice(1, 0, this.initValue); //put init value in the right position
  }

  getParams(state:TransformState) {
    return [state.returnValueId, state.elementId];
  }
}

export class FilterTransform<T> extends ScalarTransformable<T, T[], boolean> {
  init(state:TransformState) {
    return m.Array();
  }

  collect(state:TransformState):AST.Node {
    return m.Expr(m.Call(m.GetProperty(state.returnValueId, 'push'), state.elementId))
  }

  onReturn(state:TransformState, node:AST.ReturnStatement) {
    return m.IfThen(m.Negate(node.argument), [m.Continue(state.continueLabel)]);
  }
}

export class MapTransform<T, U> extends ScalarTransformable<T, U[], U> {
  init(state:TransformState) {
    return m.Array();
  }

  collect(state:TransformState):AST.Node {
    return m.Expr(m.Call(m.GetProperty(state.returnValueId, 'push'), state.elementId))
  }

  onReturn(state:TransformState, node:AST.ReturnStatement) {
    return m.Expr(m.Assign(state.elementId, node.argument));
  }
}

export class ForEachTransform<T> extends ScalarTransformable<T, void, void> {
  onReturn(state:TransformState, node:AST.ReturnStatement) {
    return m.Continue(state.continueLabel);
  }
}

export class FindTransform<T> extends ScalarTransformable<T, T, boolean> {
  onReturn(state:TransformState, node:AST.ReturnStatement) {
    return m.IfThen(node.argument, [m.Return(state.elementId)]);
  }
}

export class SomeTransform<T> extends ScalarTransformable<T, boolean, boolean> {
  onReturn(state:TransformState, node:AST.ReturnStatement) {
    return m.IfThen(node.argument, [m.Return(m.Literal(true))]);
  }
}

export class ReduceTransform<T, U> extends ReduceTransformable<T, U, U> {

  onReturn(state:TransformState, node:AST.ReturnStatement) {
    return m.Expr(m.Assign(state.returnValueId, node.argument));
  }

  init(state:TransformState):AST.Node {
    let decl = Util.parseExpression(`let a = ${JSON.stringify(this.initValue)}`) as AST.VariableDeclaration;
    return decl.declarations[0].init;
  }
}
