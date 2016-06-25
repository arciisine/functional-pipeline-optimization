import {AST, Transform, Macro as m} from '../../../node_modules/ecma-ast-transform/src';
import {md5} from '../../md5';

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
  let pos = m.Id();
  fnParams.push(pos);

  if (node.type === 'ExpressionStatement') {
    node = (node as AST.ExpressionStatement).expression;
  }

  let res = Transform.visit(Transform.visitor({
    FunctionExpression : (node:AST.FunctionExpression) => {
      node.params.forEach((p,i) => params[(p as AST.Identifier).name] = fnParams[i]);
      return node;
    },
    ArrowFunctionExpression : (node:AST.ArrowExpression) => {
      if (node.body.type !== 'BlockStatement') {
        node.body = m.Block(m.Return(node.body))          
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
    body : plen > min ? [body, m.Expr(m.Increment(pos))] : [body],
    vars : plen > min ? [pos, m.Literal(0)] : []
  }
}

export class Transformers {
  static filter(node:AST.Node, el:AST.Identifier, ret:AST.Identifier, continueLabel:AST.Identifier):Response {
    return standardHandler(node, el, [el], node => {
      return m.IfThen(m.Negate(node.argument), [m.Continue(continueLabel)]);
    })
  }

  static map(node:AST.Node, el:AST.Identifier, ret:AST.Identifier, continueLabel:AST.Identifier):Response {
    return standardHandler(node, el, [el], node => {
      return m.Expr(m.Assign(el, node.argument));
    })
  }
  
  static reduce(node:AST.Node, el:AST.Identifier, ret:AST.Identifier, continueLabel:AST.Identifier):Response {
    return standardHandler(node, el, [ret, el], node => {
      return m.Expr(m.Assign(ret, node.argument));
    })
  }
}