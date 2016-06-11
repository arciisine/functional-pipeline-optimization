/// <reference path="index.d.ts" />

import * as _ from "lodash"
import * as esprima from "esprima"
import * as escodegen from '../escodegen';

let id_:number = new Date().getTime()%10000;
type Transformer<T> = (node:T)=>T

interface Visitor { 
  process:Transformer<AST.Node>
}

export class AST {

  static genSymbol() {
    return "__gen"+parseInt(`${Math.random()*1000}`)+(id_++); 
  }
  
  static visit(visitor:Visitor, node:AST.Node, parent:AST.Node|[AST.Node] = null, key:string|number = null) {   
    node = visitor.process(node);
    [
      'body', 'declarations', 'argument', 'arguments', 'alternate', 'consequent',
      'left', 'right', 'init', 'expression', 'callee', 'elements', 
      'handlers', 'handler', 'block', 'finalizer', 'test', 'object'
    ]
      .filter(function(p) { return !!node[p]; })
      .forEach(function(p) { 
        let x = node[p];
        if (Array.isArray(x)) {
          x.forEach(function(y, i) {
            AST.visit(visitor, y, x, i);
          })
        } else {
          AST.visit(visitor, x, node, p);
        }
      });

    if (parent) parent[key] = node;
    return node;
  }
  
  static parse(fn:Function):AST.FunctionExpression {
    let ast = <AST.FunctionExpression>(esprima.parse(fn.toString()) as any as AST.BlockStatement).body[0];
    return ast;
  }
  
  static compile(node:AST.FunctionExpression, globals:any):Function {
    let src = `(function() {     
      var id_ = new Date().getTime();
      var genSymbol = ${AST.genSymbol.toString()};
      ${Object.keys(globals || {}).map(k => `var ${k} = ${globals[k].toString()}`).join('\n')} 
      return ${escodegen.generate(node)}; 
    })()`;
    return eval(src);
  }

  static visitor(conf:{[key:string]:Transformer<AST.Node>}) {
    let out = {
      process : function(node:AST.Node):AST.Node {
        if (node['visited']) {
          return node;
        } else {
          node['visited'] = true;
          if (this[node['type'] as string]) {
            let res = this[node['type'] as string](node);
            return res || node; 
          } else {
            return node;
          }
        }
      }
    };
    return _.extend(out, conf) as typeof out;
  };
  
  static rewrite(fn:Function, visitor:Visitor, globals:any) {
    let ast = AST.parse(fn); 
    console.log(ast);  
    ast = <AST.FunctionExpression>AST.visit(visitor, ast);
    return AST.compile(ast, globals);
  }
}