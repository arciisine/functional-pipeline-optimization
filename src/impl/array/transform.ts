import { AST, Macro as m, Util } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import { BaseArrayTransformable } from './base-transformable';
import { Transformable, TransformResponse, Analysis, BaseTransformable } from '../../core';
import { TransformState, Callback, Handler } from './types';

export class SliceTransform<T> extends BaseTransformable<T[], T[]>  {

  constructor(inputs?:[number, number]) {
    super(inputs, { start : 0, end : 1})
  }

  analyze():Analysis {
    return new Analysis("~");
  }

  transform(state:TransformState):TransformResponse {
    let counter = m.Id();
    let start = m.Id();
    let end = m.Id();
    let incr = m.Expr(m.Increment(counter));
    let check:AST.Expression = 
      AST.BinaryExpression({
        left:counter, 
        operator:'<', 
        right: start
      })
      
    if (this.inputs[1] !== undefined) {
      check = AST.LogicalExpression({
        left : check,
        operator : '||',
        right : AST.BinaryExpression({
          left:counter, 
          operator:'>=', 
          right: end
        })
      });
    }
    return {
      vars : [
        counter, m.Literal(-1), 
        start, this.getContextValue(state, 'start'), 
        end, this.getContextValue(state, 'end')],
      body : [
        incr, m.IfThen(check, [m.Continue(state.continueLabel)])
      ]
    }
  }

  manualTransform(data:T[]):T[] {
    return data.slice(this.inputs[0], this.inputs[1]);
  }
}

export class FilterTransform<T> extends 
  BaseArrayTransformable<T, T[], Callback.Predicate<T>, Handler.Standard<T, T, boolean>> 
{
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

export class MapTransform<T, U> extends 
  BaseArrayTransformable<T, T[], Callback.Transform<T, U>, Handler.Standard<T, T, U>> 
{
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

export class ForEachTransform<T> extends 
  BaseArrayTransformable<T, void, Callback.Void<T>, Handler.Standard<T, T, void>>
{
  onReturn(state:TransformState, node:AST.ReturnStatement) {
    return m.Block(node.argument, m.Continue(state.continueLabel));
  }
}

export class FindTransform<T> extends
  BaseArrayTransformable<T, T, Callback.Predicate<T>, Handler.Standard<T, T, boolean>> 
{
  onReturn(state:TransformState, node:AST.ReturnStatement) {
    return m.IfThen(node.argument, [state.buildReturn(state.elementId)]);
  }
}

export class SomeTransform<T> extends 
  BaseArrayTransformable<T, boolean, Callback.Predicate<T>, Handler.Standard<T, boolean, boolean>> 
{
  onReturn(state:TransformState, node:AST.ReturnStatement) {
    return m.IfThen(node.argument, [state.buildReturn(m.Literal(true))]);
  }
}

export class ReduceTransform<T, U>  extends 
  BaseArrayTransformable<T, U, Callback.Accumulate<T, U>, Handler.Reduce<T, U>>
{
  constructor(inputs:[Callback.Accumulate<T, U>, U, any]) {
    super(inputs, {
      callback : 0,
      initValue : 1,
      context : 2
    });
  }  

  init(state:TransformState):AST.Pattern {
    return this.getContextValue(state, 'initValue');
  }

  getParams(state:TransformState) {
    return [state.returnValueId, state.elementId];
  }

  onReturn(state:TransformState, node:AST.ReturnStatement) {
    return m.Expr(m.Assign(state.returnValueId, node.argument));
  }
}

export const MAPPING = [
  FilterTransform, MapTransform, FindTransform, 
  SomeTransform, ReduceTransform, ForEachTransform,
  SliceTransform
]
  .map(x => { 
    let name = x.name.split('Transform')[0];
    return [name.charAt(0).toLowerCase() + name.substring(1), x] as [string, Function]; 
  })
  .reduce((acc, pair) => (acc[pair[0]] = pair[1]) && acc, {});