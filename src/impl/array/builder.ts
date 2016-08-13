import {ArrayCompiler} from './compiler';
import * as Transform from './transform';
import {Callback} from './types';
import {Builder, Transformable, Compilable} from '../../core';

export class ArrayBuilder<I, O> extends Builder<I[], O[]> {
  constructor(data:I[]) {
    super(data, new ArrayCompiler());
  }

  slice(start:number, end?:number):ArrayBuilder<I, O> {
    return this.chain(Transform.SliceTransform, {start, end, key:'Array#slice'+start+"~"+end}) as any;
  }

  filter(callback:Callback.Predicate<O>, context?:any):ArrayBuilder<I, O> {
    return this.chain(Transform.FilterTransform, {callback, context, key:callback.key}) as any;
  }

  map<V>(callback:Callback.Transform<O, V>, context?:any):ArrayBuilder<I, V> {
    return this.chain(Transform.MapTransform, {callback, context, key:callback.key}) as any;
  }

  reduce<V>(callback:Callback.Accumulate<O, V>, initValue?:V, context?:any)  {
    return this.chain(Transform.ReduceTransform, {callback, initValue, context, key:callback.key});
  }

  forEach(callback:Callback.Void<O>, context?:any)  {
    return this.chain(Transform.ForEachTransform, {callback, context, key:callback.key});
  }

  find(callback:Callback.Predicate<O>, context?:any) {
    return this.chain(Transform.FindTransform, {callback, context, key:callback.key});
  }

  some(callback:Callback.Predicate<O>, context?:any) {
    return this.chain(Transform.SomeTransform, {callback, context, key:callback.key});
  }
}