import {AST, Util as tUtil} from '../../node_modules/ecma-ast-transform/src';

import { Util, Collector, Transformer, Transformable, TransformState } from './util';

export class ScalarCollector<I,O> implements Collector<I, O> {

  key:string = null
  pure:boolean = true;

  constructor(public source:I[], public chain:Transformable[] = [], public init:O = undefined) {
    this.chain = this.chain.map(fn => {
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
    return Util.getComputed(this).call(this, data);
  }
}
