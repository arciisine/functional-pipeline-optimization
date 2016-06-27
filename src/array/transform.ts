import { AST, Macro as m } from '../../node_modules/ecma-ast-transform/src';
import { TransformResponse, TransformReference } from '../transform';
import { ArrayUtil } from './util'
import { TransformState, ScalarTransformable, ArrayTransformable } from './types';

export const SUPPORTED = ['filter', 'map', 'reduce', 'forEach', 'find' ,'some'];

export class FilterTransform<T> extends ArrayTransformable<T, T> {
  transformer(ref:TransformReference, state:TransformState):TransformResponse  {
    ref.params = [state.elementId];
    ref.onReturn = node => m.IfThen(m.Negate(node.argument), [m.Continue(state.continueLabel)]);
    return ArrayUtil.standardTransformer(ref);
  }
  manual(data:T[]):T[] { 
    return data.filter(this.raw) 
  }
}

export class MapTransform<T, U> extends ArrayTransformable<T, U> {
  transformer(ref:TransformReference, state:TransformState):TransformResponse  {
    ref.params = [state.elementId];
    ref.onReturn = node => m.Expr(m.Assign(state.elementId, node.argument));
    return ArrayUtil.standardTransformer(ref);
  }
  manual(data:T[]):U[] { 
    return data.map(this.raw) 
  }
}

export class ReduceTransform<T, U> extends ScalarTransformable<T, U> {
  transformer(ref:TransformReference, state:TransformState):TransformResponse  {
    ref.params = [state.returnValueId, state.elementId];
    ref.onReturn = node => m.Expr(m.Assign(state.returnValueId, node.argument));
    return ArrayUtil.standardTransformer(ref);
  }
  manual(data:T[]):U { 
     return data.reduce(this.raw, this.initValue); 
  }
}

export class ForEachTransform<T> extends ScalarTransformable<T, void> {
  transformer(ref:TransformReference, state:TransformState):TransformResponse  {
    ref.params = [state.elementId];
    ref.onReturn = node => m.Continue(state.continueLabel);
    return ArrayUtil.standardTransformer(ref);
  }
  manual(data:T[]):void { 
    return data.forEach(this.raw) 
  }
}

export class FindTransform<T> extends ScalarTransformable<T, T> {
  transformer(ref:TransformReference, state:TransformState):TransformResponse  {
    ref.params = [state.elementId];
    ref.onReturn = node => m.IfThen(node.argument, [m.Return(state.elementId)]);
    return ArrayUtil.standardTransformer(ref);
  }
  manual(data:T[]):T { 
    return data.find(this.raw) 
  }
}

export class SomeTransform<T> extends ScalarTransformable<T, boolean> {
  transformer(ref:TransformReference, state:TransformState):TransformResponse  {
    ref.params = [state.elementId];
    ref.onReturn = node => m.IfThen(node.argument, [m.Return(m.Literal(true))]);
    return ArrayUtil.standardTransformer(ref);
  }
  manual(data:T[]):boolean { 
    return data.some(this.raw) 
  }
}