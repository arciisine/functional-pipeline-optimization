import {AST, Macro as m, Visitor, Util} from '../../node_modules/ecma-ast-transform/src';
import {TransformReference, TransformResponse } from '../transform';
import {Compilable, CompileUtil} from '../compile';

export class ArrayUtil {
  static standardTransformer(tr:TransformReference):TransformResponse {
    let params:{[key:string]:AST.Identifier} = {};       
    let pos = m.Id();
    tr.params.push(pos);

    if (tr.node.type === 'ExpressionStatement') {
      tr.node = (tr.node as AST.ExpressionStatement).expression;
    }

    let res = new Visitor({
      FunctionExpression : (node:AST.FunctionExpression) => {
        node.params.forEach((p,i) => params[(p as AST.Identifier).name] = tr.params[i]);
        return node;
      },
      ArrowFunctionExpression : (node:AST.ArrowExpression) => {
        if (node.body.type !== 'BlockStatement') {
          node.body = m.Block(m.Return(node.body))          
        }
        node.params.forEach((p,i) => {
          let name = (p as AST.Identifier).name;
          params[name] = tr.params[i]
        })
        return node;
      },
      ReturnStatement : x => {
        return tr.onReturn(x);
      },
      Identifier : x => {
        return params[x.name] || x;
      }
    }).exec(tr.node) as (AST.FunctionExpression|AST.ArrowExpression);

    let plen = Object.keys(params).length;
    let body = res.body
    let min = tr.params.length - 1;

    return {
      body : plen > min ? [body, m.Expr(m.Increment(pos))] : [body],
      vars : plen > min ? [pos, m.Literal(0)] : []
    }
  }
}