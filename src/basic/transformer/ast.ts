import {Utils, helper} from "../../lib/ast";
import {md5} from '../../lib/md5';
import * as AST from '../../lib/ast/types';

export interface Transformer {
  (...args:any[]):any
}

export let tag = (fn, name) => fn['type'] = name;

export interface Response {
  body:AST.Node[],
  vars:AST.Node[]
}

export let annotate = (function() {
  let cache = {};

  let i = 0;
  return (fn:Transformer):Transformer => {
    if (!fn['key']) {
      fn['key'] = md5(fn.toString());
    }

    let fnKey = fn['key'];
    
    if (cache[fnKey]) {
      fn = cache[fnKey];
    } else {
      cache[fnKey] = fn;
    }
    if (!fn['id']) fn['id'] = i++;

    return fn;
  };
})()

function standardHandler(node:AST.Node, el:AST.Identifier, fnParams:AST.Identifier[], onReturn:(node:AST.ReturnStatement)=>AST.Node):Response {
  let params:{[key:string]:AST.Identifier} = {};       
  let pos = helper.Id();
  fnParams.push(pos);

  if (node.type === 'ExpressionStatement') {
    node = (node as AST.ExpressionStatement).expression;
  }

  let res = Utils.visit(Utils.visitor({
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

export class Transformers {
  static filter(node:AST.Node, el:AST.Identifier, ret:AST.Identifier, continueLabel:AST.Identifier):Response {
    return standardHandler(node, el, [el], node => {
      return helper.IfThen(helper.Negate(node.argument), [helper.Continue(continueLabel)]);
    })
  }

  static map(node:AST.Node, el:AST.Identifier, ret:AST.Identifier, continueLabel:AST.Identifier):Response {
    return standardHandler(node, el, [el], node => {
      return helper.Expr(helper.Assign(el, node.argument));
    })
  }
  
  static reduce(node:AST.Node, el:AST.Identifier, ret:AST.Identifier, continueLabel:AST.Identifier):Response {
    return standardHandler(node, el, [ret, el], node => {
      return helper.Expr(helper.Assign(ret, node.argument));
    })
  }
}