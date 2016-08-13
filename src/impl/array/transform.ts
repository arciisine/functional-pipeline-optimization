import { AST, Macro as m, Util } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import { BaseTransformable } from './base-transformable';
import { Transformable, TransformResponse, Analysis } from '../../core';
import { TransformState, Callback, Handler } from './types';

export class SliceTransform<T> implements Transformable<T[], T[]>  {

  constructor(public inputs?:[number, number]) {}

  analyze():Analysis {
    return new Analysis("~");
  }

  transform(state:TransformState):TransformResponse {
    if (this.inputs[0] < 0 || this.inputs[1] < 0) { //If using negative notation, bail
      throw { message : "Negative index is not supported", invalid : true };
    }
    let counter = m.Id();
    let incr = m.Expr(m.Increment(counter));
    let check:AST.Expression = AST.BinaryExpression({
      left:counter, 
      operator:'<', 
      right:m.Literal(this.inputs[0])
    })
    if (this.inputs[1] !== undefined) {
      check = AST.LogicalExpression({
        left : check,
        operator : '||',
        right : AST.BinaryExpression({
          left:counter, 
          operator:'>=', 
          right:m.Literal(this.inputs[1])
        })
      });
    }
    return {
      vars : [counter, m.Literal(-1)],
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
  BaseTransformable<T, T[], Callback.Predicate<T>, Handler.Standard<T, T, boolean>> 
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
  BaseTransformable<T, T[], Callback.Transform<T, U>, Handler.Standard<T, T, U>> 
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
  BaseTransformable<T, void, Callback.Void<T>, Handler.Standard<T, T, void>>
{
  onReturn(state:TransformState, node:AST.ReturnStatement) {
    return m.Block(node.argument, m.Continue(state.continueLabel));
  }
}

export class FindTransform<T> extends
  BaseTransformable<T, T, Callback.Predicate<T>, Handler.Standard<T, T, boolean>> 
{
  onReturn(state:TransformState, node:AST.ReturnStatement) {
    return m.IfThen(node.argument, [state.buildReturn(state.elementId)]);
  }
}

export class SomeTransform<T> extends 
  BaseTransformable<T, boolean, Callback.Predicate<T>, Handler.Standard<T, boolean, boolean>> 
{
  onReturn(state:TransformState, node:AST.ReturnStatement) {
    return m.IfThen(node.argument, [state.buildReturn(m.Literal(true))]);
  }
}

export class ReduceTransform<T, U>  extends 
  BaseTransformable<T, U, Callback.Accumulate<T, U>, Handler.Reduce<T, U>>
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