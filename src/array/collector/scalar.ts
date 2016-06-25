import {Transformer, TransformState} from '../transformer';
import {Collector} from './collector';
import {AST, Util} from '../../../node_modules/ecma-ast-transform/src';

export class ScalarCollector<T, U> extends Collector<T, U> {
  constructor(source:T[], transformers:Transformer[] = [], protected init:U = undefined) {
    super(source, transformers);
  }

  getInitAST(state:TransformState) {
    if (this.init !== undefined) {
      let src = `let a = ${JSON.stringify(this.init)}`;
      let res = Util.parseExpression<AST.VariableDeclaration>(src).declarations[0].init;
      return res;
    }
  }

  getCollectAST(state:TransformState) {
    return null;
  }
}