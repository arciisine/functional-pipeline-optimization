import { Compilable } from '../compile';
import {Macro as m} from '../../node_modules/ecma-ast-transform/src';
import * as Transform from './transform';
import { TransformState } from './types';

export class ArrayCompilable<T, U, V> extends Compilable<T[], V[]> {

  filter(fn:(v:V, i?:number)=>boolean, globals?:any):ArrayCompilable<T, U, V> {
    let tr = new Transform.FilterTransform<V>(fn, globals);
    return new ArrayCompilable<T, U, V>(tr, this);
  }

  map<W>(fn:(v:V, i?:number)=>W, globals?:any):ArrayCompilable<T, V, W> {
    let tr = new Transform.MapTransform<V,W>(fn, globals);
    return new ArrayCompilable<T, V, W>(tr, this);
  }

  reduce<W>(fn:(acc:W, v:V, i?:number, arr?:V[])=>W, globals?:any):Compilable<T, W> {
    let tr = new Transform.ReduceTransform<V, W>(fn, globals);
    return new Compilable<T, W>(tr, this);
  }

  forEach(fn:(v:V, i?:number)=>void, globals?:any):Compilable<T, void> {
    let tr = new Transform.ForEachTransform<V>(fn, globals);
    return new Compilable<T, void>(tr, this);
  }

  find(fn:(v:V, i?:number)=>boolean, globals?:any):Compilable<T, V> {
    let tr = new Transform.FindTransform<V>(fn, globals);
    return new Compilable<T, V>(tr, this);
  }

  some(fn:(v:V, i?:number)=>boolean, globals?:any):Compilable<T, boolean> {
    let tr = new Transform.SomeTransform<V>(fn, globals);
    return new Compilable<T, boolean>(tr, this);
  }
}