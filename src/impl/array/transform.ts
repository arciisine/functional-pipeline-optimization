import { AST, Macro as m, Util } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import { BaseTransformable } from './base-transformable';
import { Transformable, TransformResponse, Analysis } from '../../core';
import { TransformState, Callback, Handler } from './types';

export class SliceTransform<T> implements Transformable<T[], T[]>  {
  inputs:{start?:number} = {}
  callbacks:Function[] = null

  analyze():Analysis {
    return new Analysis("~");
  }

  transform(state:TransformState):TransformResponse {
    let counter = m.Id();
    let startBound = m.Id();
    return {
      vars : [m.Vars(counter, m.Literal(0), startBound, this.inputs.start)],
      body : [
        m.Increment(counter),
        m.IfThen(AST.BinaryExpression({left:counter, operator:'<', right:startBound}), 
          [m.Continue(state.continueLabel)])
      ]
    }
  }

  manualTransform(data:T[]):T[] {
    return data.slice(this.inputs.start);
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
  constructor(inputs:{callback:Callback.Accumulate<T, U>, initValue?:U, context?:any}) {
    super(inputs);
    this.inputArray.unshift(inputs.initValue);
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