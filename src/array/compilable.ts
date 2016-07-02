import { Compilable } from '../compile';
import {Macro as m} from '../../node_modules/@arcsine/ecma-ast-transform/src';
import * as Transform from './transform';
import { TransformState } from './types';

export class ArrayCompilable<T, U, V> extends Compilable<T[], V[]> {

  filter(fn:(v:V, i?:number, arr?:V[])=>boolean, context?:any, globals?:any):ArrayCompilable<T, U, V> {
    let tr = new Transform.FilterTransform<V>(fn, context);
    tr.globals = globals; 
    return new ArrayCompilable<T, U, V>(this, tr);
  }

  map<W>(fn:(v:V, i?:number, arr?:V[])=>W, context?:any, globals?:any):ArrayCompilable<T, V, W> {
    let tr = new Transform.MapTransform<V,W>(fn, context);
    tr.globals = globals;
    return new ArrayCompilable<T, V, W>(this, tr);
  }

  reduce<W>(fn:(acc:W, v:V, i?:number, arr?:V[])=>W, init?:W, context?:any, globals?:any):Compilable<T, W> {
    let tr = new Transform.ReduceTransform<V, W>(fn, init, context);
    tr.globals = globals;    
    return new Compilable<T, W>(this, tr);
  }

  forEach(fn:(v:V, i?:number, arr?:V[])=>void, context?:any, globals?:any):Compilable<T, void> {
    let tr = new Transform.ForEachTransform<V>(fn, context);
    tr.globals = globals;
    return new Compilable<T, void>(this, tr);
  }

  find(fn:(v:V, i?:number, arr?:V[])=>boolean, context?:any, globals?:any):Compilable<T, V> {
    let tr = new Transform.FindTransform<V>(fn, context);
    tr.globals = globals;
    return new Compilable<T, V>(this, tr);
  }

  some(fn:(v:V, i?:number, arr?:V[])=>boolean, context?:any, globals?:any):Compilable<T, boolean> {
    let tr = new Transform.SomeTransform<V>(fn, context);
    tr.globals = globals;
    return new Compilable<T, boolean>(this, tr);
  }
}