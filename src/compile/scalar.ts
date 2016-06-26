import {AST, Util} from '../../node_modules/ecma-ast-transform/src';
import { CompileUtil } from './util';
import { Compilable } from './types';
import { Transformer, Transformable, TransformState } from '../transform';

type Convert = (state:TransformState)=>AST.Node;

export class ScalarCompilable<I,O> implements Compilable<I, O> {

  key:string = null
  pure:boolean = true;

  constructor(public source:I[], public chain:Transformable<any, any>[] = [], 
    private init:Convert|O = null, 
    private collect:Convert = null
  ) {
    this.chain = this.chain.map(fn => {
      let res = CompileUtil.annotate(fn);
      this.pure = this.pure && res.pure;
      return res;
    });
  }

  getInitAST(state:TransformState):AST.Node { 
    if (this.init !== undefined) {
      if (typeof this.init === 'function') {
        return (this.init as Convert)(state);
      } else {
        let src = `let a = ${JSON.stringify(this.init)}`;
        let res = Util.parseExpression<AST.VariableDeclaration>(src).declarations[0].init;
        return res;
      }
    }
  }

  getCollectAST(state:TransformState):AST.Node { 
    if (this.collect) {
      return this.collect(state);
    }
  }

  exec(data:I[] = this.source):O {
    return CompileUtil.getCompiled(this).call(this, data);
  }

  execManual(data:I[] = this.source):O {
    return this.chain.reduce((data, fn) => fn.manual(data), data) as any as O;
  }
}
