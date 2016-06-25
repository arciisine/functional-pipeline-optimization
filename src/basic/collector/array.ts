import {Collector} from './collector';
import {AnyCollector} from './any';
import {Transformer, tag, TransformState} from '../transformer';
import {AST, Transform, Macro as m} from '../../../node_modules/ecma-ast-transform/src';


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
   
  filter(fn:(e:V, i?:number)=>boolean):ArrayCollector<T, U, V> {
    tag(fn, 'filter');
    return new ArrayCollector<T, U, V>(this.source, [...this.transformers,fn]);
  }

  map<W>(fn:(e:V, i?:number)=>W):ArrayCollector<T, V, W> {
    tag(fn, 'map');
    return new ArrayCollector<T, V, W>(this.source, [...this.transformers,fn]);
  }

  reduce<W>(fn:(acc:W, e:V)=>W, init:W):AnyCollector<T, W> {
    tag(fn, 'reduce');
    return new AnyCollector<T, W>(init, this.source, [...this.transformers,fn]);
  }
}