import {ScalarCollector} from '../collector/scalar';
import {Transformer, Transformable, TransformState, Util} from '../collector/util';
import {Transformers} from './transformers';
import {Macro as m} from '../../node_modules/ecma-ast-transform/src';

export class ArrayCollector<T, U, V> extends ScalarCollector<T, V[]> {
  constructor(source:T[], transformables:Transformable[] = []) {
    super(Transformers, source, transformables);
  }

  getInitAST(state:TransformState) {
    return m.Array();
  }

  getCollectAST(state:TransformState) {
    return m.Expr(m.Call(m.GetProperty(state.ret, 'push'), state.element))
  }
   
  filter(fn:(e:V, i?:number)=>boolean, globals?:any):ArrayCollector<T, U, V> {
    Util.tag(fn, 'filter', globals);
    return new ArrayCollector<T, U, V>(this.source, [...this.transformables,fn]);
  }

  map<W>(fn:(e:V, i?:number)=>W, globals?:any):ArrayCollector<T, V, W> {
    Util.tag(fn, 'map', globals);
    return new ArrayCollector<T, V, W>(this.source, [...this.transformables,fn]);
  }

  reduce<W>(fn:(acc:W, e:V)=>W, init:W, globals?:any):ScalarCollector<T, W> {
    Util.tag(fn, 'reduce', globals);
    return new ScalarCollector<T, W>(this.mapping, this.source, [...this.transformables,fn], init);
  }

  forEach(fn:(e:V, i?:number)=>void, globals?:any):ScalarCollector<T, void> {
    Util.tag(fn, 'forEach', globals);
    return new ScalarCollector<T, void>(this.mapping, this.source, [...this.transformables,fn]);
  }

  find(fn:(e:V, i?:number)=>void, globals?:any):ScalarCollector<T, V> {
    Util.tag(fn, 'find', globals);
    return new ScalarCollector<T, V>(this.mapping, this.source, [...this.transformables,fn]);
  }

  some(fn:(e:V, i?:number)=>boolean, globals?:any):ScalarCollector<T, boolean> {
    Util.tag(fn, 'some', globals);
    return new ScalarCollector<T, boolean>(this.mapping, this.source, [...this.transformables,fn]);
  }
}