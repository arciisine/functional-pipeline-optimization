import {Transformer, TransformState} from '../transformer';
import {Collector} from './collector';
import {AST, Util} from '../../../node_modules/ecma-ast-transform/src';

export class AnyCollector<T, U> extends Collector<T, U> {
  constructor(protected init:U, source:T[], transformers:Transformer[] = []) {
    super(source, transformers);
    transformers[transformers.length - 1].init = JSON.stringify(init);
  }

  getInitAST(state:TransformState) {
    let src = `let a = ${JSON.stringify(this.init)}`;
    let res = Util.parseExpression<AST.VariableDeclaration>(src).declarations[0].init;
    return res;
  }

  getCollectAST(state:TransformState) {
    return null;
  }
}