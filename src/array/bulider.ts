import {ArrayCompiler} from './compiler';
import * as Transform from './transform';
import {Callback} from './types';
import {Builder} from '../compile';

export class BaseBuilder<I, O> extends Builder<I[], O, ArrayCompiler<I, O>> {
  constructor(data:I[]) {
    super(data, new ArrayCompiler<I, O>());
  }
}

export class ArrayBuilder<I, O> extends BaseBuilder<I,O[]> {
  filter(fn:Callback.Predicate<I>, context?:any):ArrayBuilder<I, O[]> {
    return this.chain(new Transform.FilterTransform(fn, context)) as any;
  }

  map<W>(fn:Callback.Map<I, O>, context?:any):ArrayBuilder<I, O[]> {
    return this.chain(new Transform.MapTransform(fn, context)) as any;
  }

  reduce<W>(fn:Callback.Reduce<I, O>, init?:O, context?:any):BaseBuilder<I, O> {
    return this.chain(new Transform.ReduceTransform(fn, init, context)) as any;
  }

  forEach(fn:Callback.Void<I>, context?:any):BaseBuilder<I, void> {
    return this.chain(new Transform.ForEachTransform(fn,context)) as any;
  }

  find(fn:Callback.Predicate<I>, context?:any):BaseBuilder<I, O> {
    return this.chain(new Transform.FindTransform(fn,context)) as any;
  }

  some(fn:Callback.Predicate<I>, context?:any):BaseBuilder<I, boolean> {
    return this.chain(new Transform.SomeTransform(fn,context)) as any;
  }
}