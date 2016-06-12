import {Collector} from './collector';
import {AnyCollector} from './any';
import {Transformer, tag} from '../transformers';
import * as helper from '../../lib/util/helper';


export class ArrayCollector<T, U, V> extends Collector<T, V[]> {
  constructor(source:T[], transformers:Transformer[] = []) {
    super(source, transformers);
  }

  getInitAST() {
    return helper.Array();
  }

  getCollectAST(ret:AST.Identifier, el:AST.Identifier) {
    return helper.Expr(helper.Call(helper.GetProperty(ret, 'push'), el))
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