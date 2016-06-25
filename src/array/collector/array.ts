import {Collector} from './collector';
import {ScalarCollector} from './scalar';
import {Transformer, tag, TransformState} from '../transformer';
import {Macro as m} from '../../../node_modules/ecma-ast-transform/src';


export class ArrayCollector<T, U, V> extends Collector<T, V[]> {
  constructor(source:T[], transformers:Transformer[] = []) {
    super(source, transformers);
  }

  getInitAST(state:TransformState) {
    return m.Array();
  }

  getCollectAST(state:TransformState) {
    return m.Expr(m.Call(m.GetProperty(state.ret, 'push'), state.element))
  }
   
  filter(fn:(e:V, i?:number)=>boolean, globals?:any):ArrayCollector<T, U, V> {
    tag(fn, 'filter', globals);
    return new ArrayCollector<T, U, V>(this.source, [...this.transformers,fn]);
  }

  map<W>(fn:(e:V, i?:number)=>W, globals?:any):ArrayCollector<T, V, W> {
    tag(fn, 'map', globals);
    return new ArrayCollector<T, V, W>(this.source, [...this.transformers,fn]);
  }

  reduce<W>(fn:(acc:W, e:V)=>W, init:W, globals?:any):ScalarCollector<T, W> {
    tag(fn, 'reduce', globals);
    return new ScalarCollector<T, W>(this.source, [...this.transformers,fn], init);
  }

  forEach(fn:(e:V, i?:number)=>void, globals?:any):ScalarCollector<T, void> {
    tag(fn, 'forEach', globals);
    return new ScalarCollector<T, void>(this.source, [...this.transformers,fn]);
  }

  find(fn:(e:V, i?:number)=>void, globals?:any):ScalarCollector<T, V> {
    tag(fn, 'find', globals);
    return new ScalarCollector<T, V>(this.source, [...this.transformers,fn]);
  }

  some(fn:(e:V, i?:number)=>boolean, globals?:any):ScalarCollector<T, boolean> {
    tag(fn, 'some', globals);
    return new ScalarCollector<T, boolean>(this.source, [...this.transformers,fn]);
  }
}