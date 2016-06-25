import {Transformable, TransformState} from '../transform';
import {CompileUtil, ScalarCompilable } from '../compile';
import {Transformers} from './transformers';
import {Macro as m} from '../../node_modules/ecma-ast-transform/src';

export class ArrayCollector<T, U, V> extends ScalarCompilable<T, V[]> {
  constructor(source:T[], chain:Transformable[] = []) {
    super(source, chain, []);
  }

  getCollectAST(state:TransformState) {
    return m.Expr(m.Call(m.GetProperty(state.ret, 'push'), state.element))
  }
   
  filter(fn:(e:V, i?:number)=>boolean, globals?:any):ArrayCollector<T, U, V> {
    CompileUtil.tag(fn, Transformers.filter, globals);
    return new ArrayCollector<T, U, V>(this.source, [...this.chain,fn]);
  }

  map<W>(fn:(e:V, i?:number)=>W, globals?:any):ArrayCollector<T, V, W> {
    CompileUtil.tag(fn, Transformers.map, globals);
    return new ArrayCollector<T, V, W>(this.source, [...this.chain,fn]);
  }

  reduce<W>(fn:(acc:W, e:V)=>W, init:W, globals?:any):ScalarCompilable<T, W> {
    CompileUtil.tag(fn, Transformers.reduce, globals);
    return new ScalarCompilable<T, W>(this.source, [...this.chain,fn], init);
  }

  forEach(fn:(e:V, i?:number)=>void, globals?:any):ScalarCompilable<T, void> {
    CompileUtil.tag(fn, Transformers.forEach, globals);
    return new ScalarCompilable<T, void>(this.source, [...this.chain,fn]);
  }

  find(fn:(e:V, i?:number)=>void, globals?:any):ScalarCompilable<T, V> {
    CompileUtil.tag(fn, Transformers.find, globals);
    return new ScalarCompilable<T, V>(this.source, [...this.chain,fn]);
  }

  some(fn:(e:V, i?:number)=>boolean, globals?:any):ScalarCompilable<T, boolean> {
    CompileUtil.tag(fn, Transformers.some, globals);
    return new ScalarCompilable<T, boolean>(this.source, [...this.chain,fn]);
  }
}