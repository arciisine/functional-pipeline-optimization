import { AST, Macro as m, Util } from '../../node_modules/@arcsine/ecma-ast-transform/src';
import { BaseTransformable } from './base-transformable';
import { TransformState } from './types';

export abstract class ArrayTransformable<T, U, V> extends 
  BaseTransformable<T, U, (el:T, i?:number, arr?:T[])=>V, 
    (callback:(el:T, i?:number, arr?:T[])=>V, context?:any)=>U> 
{
  getParams(state:TransformState) {
    return [state.elementId];
  }
}

export class FilterTransform<T> extends ArrayTransformable<T, T[], boolean> {
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

export class MapTransform<T, U> extends ArrayTransformable<T, U[], U> {
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

export class ForEachTransform<T> extends ArrayTransformable<T, void, void> {
  onReturn(state:TransformState, node:AST.ReturnStatement) {
    return m.Continue(state.continueLabel);
  }
}

export class FindTransform<T> extends ArrayTransformable<T, T, boolean> {
  onReturn(state:TransformState, node:AST.ReturnStatement) {
    return m.IfThen(node.argument, [m.Return(state.elementId)]);
  }
}

export class SomeTransform<T> extends ArrayTransformable<T, boolean, boolean> {
  onReturn(state:TransformState, node:AST.ReturnStatement) {
    return m.IfThen(node.argument, [m.Return(m.Literal(true))]);
  }
}

export class ReduceTransform<T, U>  extends 
  BaseTransformable<T, U, (acc:U, el:T, i?:number, arr?:T[])=>U, 
    (callback:(acc:U, el:T, i?:number, arr?:T[])=>U, context?:any)=>U> 
{
  constructor(callback:(acc:U, el:T, i?:number, arr?:T[])=>U, public initValue?:U, context?:any) {
    super(callback, context);
    this.inputs.splice(1, 0, this.initValue); //put init value in the right position
  }

  getParams(state:TransformState) {
    return [state.returnValueId, state.elementId];
  }

  onReturn(state:TransformState, node:AST.ReturnStatement) {
    return m.Expr(m.Assign(state.returnValueId, node.argument));
  }

  init(state:TransformState):AST.Node {
    let decl = Util.parseExpression(`let a = ${JSON.stringify(this.initValue)}`) as AST.VariableDeclaration;
    return decl.declarations[0].init;
  }
}
