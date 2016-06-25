import {AST, Util, Macro as m, Visitor} from '../../../node_modules/ecma-ast-transform/src';
import {md5} from './md5';

type Ops = 'filter'|'map'|'reduce'|'forEach';

export interface Transformer {
  (...args:any[]):any,
  key? : string,
  id? : number,
  type? : Ops,
  init?: any,
  globals?:any,
  pure?: boolean
}

export interface TransformReference {
  node:AST.Node,
  params?:AST.Identifier[],
  onReturn?:(node:AST.ReturnStatement)=>AST.Node
}

export interface TransformState {
  element:AST.Identifier,
  ret?:AST.Identifier
  continueLabel?:AST.Identifier    
}

export interface TransformResponse {
  body:AST.Node[],
  vars:AST.Node[]
}

let cache = {};
let i = 0;

export function tag(fn:Transformer, name:Ops, globals?:any) {
  fn.type = name;
  fn.globals = globals;
}

export function annotate(fn:Transformer):Transformer {
  if (fn.pure === undefined) {
    fn.pure = Util.isPureFunction(fn, fn.globals || {});
  } 

  if (fn.pure) {
    if (!fn.key) {
      fn.key = md5(fn.toString());
    }

    if (cache[fn.key]) {
      fn = cache[fn.key];
    } else {
      cache[fn.key] = fn;
    }

    if (!fn.id) {
      fn.id = i++;
    }
  }

  return fn;
};

export function standardHandler(tr:TransformReference):TransformResponse {
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

export class Transformers {
  static filter(ref:TransformReference, state:TransformState):TransformResponse {
    ref.params = [state.element];
    ref.onReturn = node => m.IfThen(m.Negate(node.argument), [m.Continue(state.continueLabel)]);
    return standardHandler(ref);
  }

  static map(ref:TransformReference, state:TransformState):TransformResponse {
    ref.params = [state.element];
    ref.onReturn = node => m.Expr(m.Assign(state.element, node.argument));
    return standardHandler(ref);
  }
  
  static reduce(ref:TransformReference, state:TransformState):TransformResponse {
    ref.params = [state.ret, state.element];
    ref.onReturn = node => m.Expr(m.Assign(state.ret, node.argument));
    return standardHandler(ref);
  }
}