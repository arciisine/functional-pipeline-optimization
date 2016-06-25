import {AST, Util as tUtil} from '../../node_modules/ecma-ast-transform/src';

import { Transformers } from './transformers';
import { Util, Collector, Transformer, TransformState } from './util';

export class ScalarCollector<I,O> {

  protected key:string = null
  protected pure:boolean = true;

  constructor(protected mapping:{[type:string]:Transformer}, protected source:I[], protected transformers:Transformer[] = [], protected init:O = undefined) {
    this.transformers = this.transformers.map(fn => {
      let res = Util.annotate(fn);
      this.pure = this.pure && res.pure;
      return res;
    });
  }

  getInitAST(state:TransformState):AST.Node { 
    if (this.init !== undefined) {
      let src = `let a = ${JSON.stringify(this.init)}`;
      let res = tUtil.parseExpression<AST.VariableDeclaration>(src).declarations[0].init;
      return res;
    }
  }

  getCollectAST(state:TransformState):AST.Node { 
    return null 
  }

  exec(data:I[] = this.source):O {
    return Util.getComputed(this, Transformers).call(this, data);
  }
}
