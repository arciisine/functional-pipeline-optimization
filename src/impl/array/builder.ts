import {ArrayCompiler} from './compiler';
import * as Transform from './transform';
import {Callback} from './types';
import {Builder, Transformable, Compilable} from '../../core';

export class ArrayBuilder<I, O> extends Builder<I[], O[]> {
  constructor(data:I[]) {
    super(data, new ArrayCompiler(), new Compilable<I[], O[]>());
  }

  slice(start:number, end?:number):ArrayBuilder<I, O> {
    return this.chain(Transform.SliceTransform, [start, end], 'Array#slice'+start+"~"+end) as any;
  }

  filter(callback:Callback.Predicate<O>, context?:any):ArrayBuilder<I, O> {
    return this.chain(Transform.FilterTransform, [callback, context], callback.key || callback.name) as any;
  }

  map<V>(callback:Callback.Transform<O, V>, context?:any):ArrayBuilder<I, V> {
    return this.chain(Transform.MapTransform, [callback, context], callback.key || callback.name) as any;
  }

  reduce<V>(callback:Callback.Accumulate<O, V>, initValue?:V, context?:any)  {
    return this.chain(Transform.ReduceTransform, [callback, initValue, context], callback.key || callback.name);
  }

  forEach(callback:Callback.Void<O>, context?:any)  {
    return this.chain(Transform.ForEachTransform, [callback, context], callback.key || callback.name);
  }

  find(callback:Callback.Predicate<O>, context?:any) {
    return this.chain(Transform.FindTransform, [callback, context], callback.key || callback.name);
  }

  some(callback:Callback.Predicate<O>, context?:any) {
    return this.chain(Transform.SomeTransform, [callback, context], callback.key || callback.name);
  }
}