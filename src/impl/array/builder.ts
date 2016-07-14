import {ArrayCompiler} from './compiler';
import * as Transform from './transform';
import {Callback} from './types';
import {Builder, Transformable} from '../../core';

export class ArrayBuilder<I, O> extends Builder<I[], O[]> {
  constructor(data:I[]) {
    super(data, new ArrayCompiler());
  }

  filter(callback:Callback.Predicate<O>, context?:any):ArrayBuilder<I, O> {
    return this.chain(new Transform.FilterTransform({callback, context})) as any;
  }

  map<V>(callback:Callback.Transform<O, V>, context?:any):ArrayBuilder<I, V> {
    return this.chain(new Transform.MapTransform({callback, context})) as any;
  }

  reduce<V>(callback:Callback.Accumulate<O, V>, initValue?:V, context?:any)  {
    return this.chain(new Transform.ReduceTransform({callback, initValue, context}));
  }

  forEach(callback:Callback.Void<O>, context?:any)  {
    return this.chain(new Transform.ForEachTransform({callback, context}));
  }

  find(callback:Callback.Predicate<O>, context?:any) {
    return this.chain(new Transform.FindTransform({callback, context}));
  }

  some(callback:Callback.Predicate<O>, context?:any) {
    return this.chain(new Transform.SomeTransform({callback, context}));
  }
}