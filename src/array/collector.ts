import {ScalarCollector} from '../collector/scalar';
import {Transformable, TransformState, Util} from '../collector/util';
import {Transformers} from './transformers';
import {Macro as m} from '../../node_modules/ecma-ast-transform/src';

export class ArrayCollector<T, U, V> extends ScalarCollector<T, V[]> {
  constructor(source:T[], chain:Transformable[] = []) {
    super(source, chain);
  }

  getInitAST(state:TransformState) {
    return m.Array();
  }

  getCollectAST(state:TransformState) {
    return m.Expr(m.Call(m.GetProperty(state.ret, 'push'), state.element))
  }
   
  filter(fn:(e:V, i?:number)=>boolean, globals?:any):ArrayCollector<T, U, V> {
    Util.tag(fn, Transformers.filter, globals);
    return new ArrayCollector<T, U, V>(this.source, [...this.chain,fn]);
  }

  map<W>(fn:(e:V, i?:number)=>W, globals?:any):ArrayCollector<T, V, W> {
    Util.tag(fn, Transformers.map, globals);
    return new ArrayCollector<T, V, W>(this.source, [...this.chain,fn]);
  }

  reduce<W>(fn:(acc:W, e:V)=>W, init:W, globals?:any):ScalarCollector<T, W> {
    Util.tag(fn, Transformers.reduce, globals);
    return new ScalarCollector<T, W>(this.source, [...this.chain,fn], init);
  }

  forEach(fn:(e:V, i?:number)=>void, globals?:any):ScalarCollector<T, void> {
    Util.tag(fn, Transformers.forEach, globals);
    return new ScalarCollector<T, void>(this.source, [...this.chain,fn]);
  }

  find(fn:(e:V, i?:number)=>void, globals?:any):ScalarCollector<T, V> {
    Util.tag(fn, Transformers.find, globals);
    return new ScalarCollector<T, V>(this.source, [...this.chain,fn]);
  }

  some(fn:(e:V, i?:number)=>boolean, globals?:any):ScalarCollector<T, boolean> {
    Util.tag(fn, Transformers.some, globals);
    return new ScalarCollector<T, boolean>(this.source, [...this.chain,fn]);
  }
}