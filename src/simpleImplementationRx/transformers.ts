import {genSymbol, parse, compile, visit, rewrite, visitor} from "../lib/util";
import * as helper from "../lib/util/helper";
import * as AST from '../lib/ast';

interface Response {
  body:AST.Node[],
  vars:AST.Node[]
}

class Transformers {
  static idCollector (params:AST.Pattern[], ids:AST.Identifier[]):{[key:string]:AST.Identifier} {
    let out:{[key:string]:AST.Identifier} = {};
    params.forEach((p,i) => {
      out[(p as AST.Identifier).name] = ids[i];
    })
    return out;
  }

  static idTranslator(params:{[key:string]:AST.Identifier}, id:AST.Identifier):AST.Identifier {
    return params[id.name] || id;
  }

  static filter(node:AST.Node, el:AST.Identifier):Response {
    let params = null;       
    let pos = helper.Id();
    let res = visit(visitor({
      //FunctionExpression : extractBody,
      ArrowFunctionExpression : (node:AST.ArrowExpression) => {
        params = Transformers.idCollector(node.params, [el, pos]);
        return helper.IfThen(helper.Negate(node.body), [helper.Continue()]);
      },
      Identifier : x => Transformers.idTranslator(params, x)
    }), node);

    let ifElse = helper.Expr((res as any as AST.ExpressionStatement).expression);
    let plen = Object.keys(params).length;

    return {
      body : plen > 1 ? [ifElse, helper.Expr(helper.Increment(pos))] : [ifElse],
      vars : plen > 1 ? [pos, helper.Literal(0)] : []
    }
  }

  static map(node:AST.Node, el:AST.Identifier):Response {
    let params = null;
    let pos = helper.Id();
    let res = visit(visitor({
      //FunctionExpression : extractBody,
      ArrowFunctionExpression : (node:AST.ArrowExpression) => {
        params = Transformers.idCollector(node.params, [el, pos]);
        return node.body;
      },
      Identifier : x => Transformers.idTranslator(params, x)
    }), node);

    let assign = helper.Expr(helper.Assign(el, (res as any as AST.ExpressionStatement).expression));
    let plen = Object.keys(params).length;

    return {
      body : plen > 1 ? [assign, helper.Expr(helper.Increment(pos))] : [assign],
      vars : plen > 1 ? [pos, helper.Literal(0)] : []
    } 
  }
  
  static reduce(node:AST.Node, el:AST.Identifier, ret:AST.Identifier):Response {
    let params = null;
    let pos = helper.Id();
    let res = visit(visitor({
      //FunctionExpression : extractBody,
      ArrowFunctionExpression : (node:AST.ArrowExpression) => {
        params = Transformers.idCollector(node.params, [ret, el, pos]);
        return node.body;
      },
      Identifier : x => Transformers.idTranslator(params, x)
    }), node);

    let assign = helper.Expr(helper.Assign(ret, (res as any as AST.ExpressionStatement).expression));
    let plen = Object.keys(params).length;

    return {
      body : plen > 2 ? [assign, helper.Expr(helper.Increment(pos))] : [assign],
      vars : plen > 2 ? [pos, helper.Literal(0)] : []
    } 
  }
}

export let reduce = Transformers.reduce;
export let filter = Transformers.filter;
export let map = Transformers.map;