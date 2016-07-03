import {ArrayCompiler} from './compiler';
import * as Transform from './transform';
import {Callback} from './types';
import {Builder} from '../compile';
import {Transformable} from '../transform';

export class ArrayBuilder<I, O> extends Builder<I[], O[]> {
  constructor(data:I[]) {
    super(data, new ArrayCompiler());
  }

  filter(fn:Callback.Predicate<O>, context?:any):ArrayBuilder<I, O> {
    return this.chain(new Transform.FilterTransform(fn, context)) as any;
  }

  map<V>(fn:Callback.Map<O, V>, context?:any):ArrayBuilder<I, V> {
    return this.chain(new Transform.MapTransform(fn, context)) as any;
  }

  reduce<V>(fn:Callback.Reduce<O, V>, init?:V, context?:any)  {
    return this.chain(new Transform.ReduceTransform(fn, init, context));
  }

  forEach(fn:Callback.Void<O>, context?:any)  {
    return this.chain(new Transform.ForEachTransform(fn,context));
  }

  find(fn:Callback.Predicate<O>, context?:any) {
    return this.chain(new Transform.FindTransform(fn,context));
  }

  some(fn:Callback.Predicate<O>, context?:any) {
    return this.chain(new Transform.SomeTransform(fn,context));
  }
}