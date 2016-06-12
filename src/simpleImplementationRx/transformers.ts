import {genSymbol, parse, compile, visit, rewrite, visitor} from "../lib/util";
import * as helper from "../lib/util/helper";
import * as AST from '../lib/ast';

interface Response {
  body:AST.Node[],
  vars:AST.Node[]
}

function standardHandler(node:AST.Node, el:AST.Identifier, fnParams:AST.Identifier[], onReturn:(node:AST.ReturnStatement)=>AST.Node):Response {
  let params:{[key:string]:AST.Identifier} = {};       
  let pos = helper.Id();
  fnParams.push(pos);

  if (node.type === 'ExpressionStatement') {
    node = (node as AST.ExpressionStatement).expression;
  }

  let res = visit(visitor({
    FunctionExpression : (node:AST.FunctionExpression) => {
      node.params.forEach((p,i) => params[(p as AST.Identifier).name] = fnParams[i]);
      return node;
    },
    ArrowFunctionExpression : (node:AST.ArrowExpression) => {
      if (node.body.type !== 'BlockStatement') {
        node.body = helper.Block(helper.Return(node.body))          
      }
      node.params.forEach((p,i) => {
        let name = (p as AST.Identifier).name;
        params[name] = fnParams[i]
      })
      return node;
    },
    ReturnStatement : x => {
      return onReturn(x);
    },
    Identifier : x => {
      return params[x.name] || x;
    }
  }), node) as (AST.FunctionExpression|AST.ArrowExpression);

  let plen = Object.keys(params).length;
  let body = res.body
  let min = fnParams.length - 1;

  return {
    body : plen > min ? [body, helper.Expr(helper.Increment(pos))] : [body],
    vars : plen > min ? [pos, helper.Literal(0)] : []
  }
}

class Transformers {
  static filter(node:AST.Node, el:AST.Identifier):Response {
    return standardHandler(node, el, [el], node => {
      return helper.IfThen(helper.Negate(node.argument), [helper.Continue()]);
    })
  }

  static map(node:AST.Node, el:AST.Identifier):Response {
    return standardHandler(node, el, [el], node => {
      return helper.Expr(helper.Assign(el, node.argument));
    })
  }
  
  static reduce(node:AST.Node, el:AST.Identifier, ret:AST.Identifier):Response {
    return standardHandler(node, el, [ret, el], node => {
      return helper.Expr(helper.Assign(ret, node.argument));
    })
  }
}

export let reduce = Transformers.reduce;
export let filter = Transformers.filter;
export let map = Transformers.map;