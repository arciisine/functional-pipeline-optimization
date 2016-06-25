import {AST, Transform, Macro as m} from '../../../node_modules/ecma-ast-transform/src';
import {md5} from '../../md5';

export interface Transformer {
  (...args:any[]):any
}

export let tag = (fn, name) => fn['type'] = name;

export interface TransformReference {
  node:AST.Node,
  element:AST.Identifier,
  ret?:AST.Identifier
  continueLabel?:AST.Identifier,
  params?:AST.Identifier[],
  onReturn?:(node:AST.ReturnStatement)=>AST.Node  
}

export interface TransformResponse {
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
})();

function standardHandler(tr:TransformReference):TransformResponse {
  let params:{[key:string]:AST.Identifier} = {};       
  let pos = m.Id();
  tr.params.push(pos);

  if (tr.node.type === 'ExpressionStatement') {
    tr.node = (tr.node as AST.ExpressionStatement).expression;
  }

  let res = Transform.visit(Transform.visitor({
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
  }), tr.node) as (AST.FunctionExpression|AST.ArrowExpression);

  let plen = Object.keys(params).length;
  let body = res.body
  let min = tr.params.length - 1;

  return {
    body : plen > min ? [body, m.Expr(m.Increment(pos))] : [body],
    vars : plen > min ? [pos, m.Literal(0)] : []
  }
}

export class Transformers {
  static filter(ref:TransformReference):TransformResponse {
    ref.params = [ref.element];
    ref.onReturn = node => m.IfThen(m.Negate(node.argument), [m.Continue(ref.continueLabel)]);
    return standardHandler(ref);
  }

  static map(ref:TransformReference):TransformResponse {
    ref.params = [ref.element];
    ref.onReturn = node => m.Expr(m.Assign(ref.element, node.argument));
    return standardHandler(ref);
  }
  
  static reduce(ref:TransformReference):TransformResponse {
    ref.params = [ref.ret, ref.element];
    ref.onReturn = node => m.Expr(m.Assign(ref.ret, node.argument));
    return standardHandler(ref);
  }
}