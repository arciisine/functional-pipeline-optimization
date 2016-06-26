import {Macro as m} from '../../node_modules/ecma-ast-transform/src';
import {
  TransformResponse, 
  TransformReference, 
  TransformState,
  Transformable, 
  TransformUtil 
} from '../transform';

export const SUPPORTED = ['filter', 'map', 'reduce', 'forEach', 'find' ,'some'];

export class FilterTransform<T> extends Transformable<T[], T[]> {
  transformer(ref:TransformReference, state:TransformState):TransformResponse  {
    ref.params = [state.element];
    ref.onReturn = node => m.IfThen(m.Negate(node.argument), [m.Continue(state.continueLabel)]);
    return TransformUtil.standardTransformer(ref);
  }
  manual(data:T[]):T[] { 
    return data.filter(this.raw) 
  }
}

export class MapTransform<T, U> extends Transformable<T[], U[]> {
  transformer(ref:TransformReference, state:TransformState):TransformResponse  {
    ref.params = [state.element];
    ref.onReturn = node => m.Expr(m.Assign(state.element, node.argument));
    return TransformUtil.standardTransformer(ref);
  }
  manual(data:T[]):U[] { 
    return data.map(this.raw) 
  }
}

export class ReduceTransform<T, U> extends Transformable<T[], U> {
  constructor(raw, globals, public init:U = null) {
    super(raw, globals)
  }
  transformer(ref:TransformReference, state:TransformState):TransformResponse  {
    ref.params = [state.ret, state.element];
    ref.onReturn = node => m.Expr(m.Assign(state.ret, node.argument));
    return TransformUtil.standardTransformer(ref);
  }
  manual(data:T[]):U { 
     return data.reduce(this.raw, this.init); 
  }
}

export class ForEachTransform<T> extends Transformable<T[], void> {
  transformer(ref:TransformReference, state:TransformState):TransformResponse  {
    ref.params = [state.element];
    ref.onReturn = node => m.Continue(state.continueLabel);
    return TransformUtil.standardTransformer(ref);
  }
  manual(data:T[]):void { 
    return data.forEach(this.raw) 
  }
}

export class FindTransform<T> extends Transformable<T[], T> {
  transformer(ref:TransformReference, state:TransformState):TransformResponse  {
    ref.params = [state.element];
    ref.onReturn = node => m.IfThen(node.argument, [m.Return(state.element)]);
    return TransformUtil.standardTransformer(ref);
  }
  manual(data:T[]):T { 
    return data.find(this.raw) 
  }
}

export class SomeTransform<T> extends Transformable<T[], boolean> {
  transformer(ref:TransformReference, state:TransformState):TransformResponse  {
    ref.params = [state.element];
    ref.onReturn = node => m.IfThen(node.argument, [m.Return(m.Literal(true))]);
    return TransformUtil.standardTransformer(ref);
  }
  manual(data:T[]):boolean { 
    return data.some(this.raw) 
  }
}