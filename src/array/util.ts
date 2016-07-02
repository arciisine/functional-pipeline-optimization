import {AST, Macro as m, Visitor, Util} from '../../node_modules/@arcsine/ecma-ast-transform/src';
import {TransformResponse } from '../transform';

export class ArrayUtil {
  static standardTransformer(
    callback : string|Function, 
    params : AST.Identifier[], 
    onReturn : (x:AST.ReturnStatement)=>AST.Node
  ):TransformResponse {
    let node = Util.parse(callback) as AST.Node;
    let paramMap:{[key:string]:AST.Identifier} = {};       
    let pos = m.Id();
    params.push(pos);

    if (node.type === 'ExpressionStatement') {
      node = (node as AST.ExpressionStatement).expression;
    }

    let res = new Visitor({
      FunctionExpression : (node:AST.FunctionExpression) => {
        node.params.forEach((p,i) => paramMap[(p as AST.Identifier).name] = params[i]);
        return node;
      },
      ArrowFunctionExpression : (node:AST.ArrowExpression) => {
        if (node.body.type !== 'BlockStatement') {
          node.body = m.Block(m.Return(node.body))          
        }
        node.params.forEach((p,i) => {
          let name = (p as AST.Identifier).name;
          paramMap[name] = params[i]
        })
        return node;
      },
      ReturnStatement : x => {
        return onReturn(x);
      },
      Identifier : x => {
        return paramMap[x.name] || x;
      }
    }).exec(node) as (AST.FunctionExpression|AST.ArrowExpression);

    let plen = Object.keys(paramMap).length;
    let body = res.body
    let min = params.length - 1;

    return {
      body : plen > min ? [body, m.Expr(m.Increment(pos))] : [body],
      vars : plen > min ? [pos, m.Literal(0)] : []
    }
  }
}