import {ArrayCompiler} from './compiler';
import * as Transform from './transform';
import {Callback} from './types';
import {Builder} from '../compile';

export class ArrayBuilder<I, O> extends Builder<I[], O[]> {
  constructor(data:I[]) {
    super(data, new ArrayCompiler<I, O[]>());
  }

  filter(fn:Callback.Predicate<I>, context?:any):ArrayBuilder<I, O> {
    return this.chain(new Transform.FilterTransform(fn, context)) as any;
  }

  map<V>(fn:Callback.Map<I, V>, context?:any):ArrayBuilder<I, V[]> {
    return this.chain(new Transform.MapTransform(fn, context)) as any;
  }

  reduce<V>(fn:Callback.Reduce<I, V>, init?:V, context?:any)  {
    return this.chain(new Transform.ReduceTransform(fn, init, context));
  }

  forEach(fn:Callback.Void<I>, context?:any)  {
    return this.chain<void>(new Transform.ForEachTransform(fn,context));
  }

  find(fn:Callback.Predicate<I>, context?:any) {
    return this.chain(new Transform.FindTransform(fn,context));
  }

  some(fn:Callback.Predicate<I>, context?:any) {
    return this.chain(new Transform.SomeTransform(fn,context));
  }
}