import { Compilable } from '../compile';
import {Macro as m} from '../../node_modules/ecma-ast-transform/src';
import * as Transform from './transform';
import { TransformState } from './types';

export class ArrayCompilable<T, U, V> extends Compilable<T[], V[]> {

  filter(fn:(v:V, i?:number, arr?:V[])=>boolean, globals?:any):ArrayCompilable<T, U, V> {
    let tr = new Transform.FilterTransform<V>(fn, globals);
    return new ArrayCompilable<T, U, V>(this, tr);
  }

  map<W>(fn:(v:V, i?:number, arr?:V[])=>W, globals?:any):ArrayCompilable<T, V, W> {
    let tr = new Transform.MapTransform<V,W>(fn, globals);
    return new ArrayCompilable<T, V, W>(this, tr);
  }

  reduce<W>(fn:(acc:W, v:V, i?:number, arr?:V[])=>W,  globals?:any, init?:W):Compilable<T, W> {
    let tr = new Transform.ReduceTransform<V, W>(fn, globals, init);
    return new Compilable<T, W>(this, tr);
  }

  forEach(fn:(v:V, i?:number, arr?:V[])=>void, globals?:any):Compilable<T, void> {
    let tr = new Transform.ForEachTransform<V>(fn, globals);
    return new Compilable<T, void>(this, tr);
  }

  find(fn:(v:V, i?:number, arr?:V[])=>boolean, globals?:any):Compilable<T, V> {
    let tr = new Transform.FindTransform<V>(fn, globals);
    return new Compilable<T, V>(this, tr);
  }

  some(fn:(v:V, i?:number, arr?:V[])=>boolean, globals?:any):Compilable<T, boolean> {
    let tr = new Transform.SomeTransform<V>(fn, globals);
    return new Compilable<T, boolean>(this, tr);
  }
}