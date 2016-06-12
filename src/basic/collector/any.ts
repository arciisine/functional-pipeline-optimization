import {Transformer} from '../transformer';
import {Collector} from './collector';
import {Utils} from '../../lib/ast';
import * as AST from '../../lib/ast/types';

export class AnyCollector<T, U> extends Collector<T, U> {
  constructor(protected init:U, source:T[], transformers:Transformer[] = []) {
    super(source, transformers);
    transformers[transformers.length - 1]['init'] = JSON.stringify(init);
  }

  getInitAST() {
    let src = `let a = ${JSON.stringify(this.init)}`;
    let res = (Utils.parse(src) as any).declarations[0].init;
    return res;
  }

  getCollectAST() {
    return null;
  }
}