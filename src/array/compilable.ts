import {Transformable, TransformState} from '../transform';
import { Transformers } from './transformers';
import { ScalarCompilable, CompileUtil } from '../compile';
import {Macro as m} from '../../node_modules/ecma-ast-transform/src';
import {ArrayTransformable, ReduceTransformable} from './types';

function extend<T,U>(o:T, v:U):T&U {
  for (var k in v) {
    o[k] = v[k];
  }
  return o as (T&U);
}

export class ArrayCompilable<T, U, V> extends ScalarCompilable<T, V[]> {
  constructor(source:T[], chain:Transformable<any, any>[] = []) {
    super(source, chain, []);
  }

  getCollectAST(state:TransformState) {
    return m.Expr(m.Call(m.GetProperty(state.ret, 'push'), state.element))
  }
   
  filter(fn:(v:V, i?:number)=>boolean, globals?:any):ArrayCompilable<T, U, V> {
    let tr = CompileUtil.tag(fn, extend(Transformers.filter, {globals}));
    return new ArrayCompilable<T, U, V>(this.source, [...this.chain,tr]);
  }

  map<W>(fn:(v:V, i?:number)=>W, globals?:any):ArrayCompilable<T, V, W> {
    let tr = CompileUtil.tag(fn, extend(Transformers.map, {globals}));
    return new ArrayCompilable<T, V, W>(this.source, [...this.chain,tr]);
  }

  reduce<W>(fn:(acc:W, v:V, i?:number, arr?:V[])=>W, init:W, globals?:any):ScalarCompilable<T, W> {
    let tr = CompileUtil.tag(fn, extend(Transformers.reduce, {globals}));
    return new ScalarCompilable<T, W>(this.source, [...this.chain,tr], init);
  }

  forEach(fn:(v:V, i?:number)=>void, globals?:any):ScalarCompilable<T, void> {
    let tr = CompileUtil.tag(fn, extend(Transformers.forEach, {globals}));
    return new ScalarCompilable<T, void>(this.source, [...this.chain,tr]);
  }

  find(fn:(v:V, i?:number)=>boolean, globals?:any):ScalarCompilable<T, V> {
    let tr = CompileUtil.tag(fn, extend(Transformers.find, {globals}));
    return new ScalarCompilable<T, V>(this.source, [...this.chain,tr]);
  }

  some(fn:(v:V, i?:number)=>boolean, globals?:any):ScalarCompilable<T, boolean> {
    let tr = CompileUtil.tag(fn, extend(Transformers.some, {globals}));
    return new ScalarCompilable<T, boolean>(this.source, [...this.chain,tr]);
  }
}