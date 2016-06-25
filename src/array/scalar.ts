import {AST, Util} from '../../node_modules/ecma-ast-transform/src';
import { CompileUtil, Compilable} from '../compile';
import { Transformer, Transformable, TransformState } from '../transform';

export class ScalarCollector<I,O> implements Compilable<I, O> {

  key:string = null
  pure:boolean = true;

  constructor(public source:I[], public chain:Transformable[] = [], public init:O = undefined) {
    this.chain = this.chain.map(fn => {
      let res = CompileUtil.annotate(fn);
      this.pure = this.pure && res.pure;
      return res;
    });
  }

  getInitAST(state:TransformState):AST.Node { 
    if (this.init !== undefined) {
      let src = `let a = ${JSON.stringify(this.init)}`;
      let res = Util.parseExpression<AST.VariableDeclaration>(src).declarations[0].init;
      return res;
    }
  }

  getCollectAST(state:TransformState):AST.Node { 
    return null 
  }

  exec(data:I[] = this.source):O {
    return CompileUtil.getCompiled(this).call(this, data);
  }
}
