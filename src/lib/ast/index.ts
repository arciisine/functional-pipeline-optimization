import * as _ from "lodash"
import * as esprima from "esprima"
import * as escodegen from '../escodegen';
import * as _AST from "./types"
import * as _helper from './helper';

interface Transformer {
  <T extends _AST.Node>(node:T):T
}

interface Visitor { 
  process:Transformer
}

export class Utils {
  
  static visit<T extends _AST.Node>(visitor:Visitor, node:T, parent:_AST.Node|[_AST.Node] = null, key:string|number = null):T {   
    node = visitor.process(node);
    [
      'body', 'declarations', 'argument', 'arguments', 'alternate', 'consequent',
      'left', 'right', 'init', 'expression', 'callee', 'elements', 
      'handlers', 'handler', 'block', 'finalizer', 'test', 'object', 'property'
    ]
      .filter(function(p) { return !!node[p]; })
      .forEach(function(p) { 
        let x = node[p];
        if (Array.isArray(x)) {
          x.forEach(function(y, i) {
            Utils.visit(visitor, y, x, i);
          })
        } else if (typeof x !== 'string' && typeof x !== 'boolean' && typeof x !== 'number') {
          Utils.visit(visitor, x, node, p);
        }
      });

    if (parent) parent[key] = node;
    return node;
  }
  
  static parse(fn:Function|string):_AST.FunctionExpression {
    let ast = <_AST.FunctionExpression>(esprima.parse(fn.toString()) as any as _AST.BlockStatement).body[0];
    return ast;
  }
  
  static compile(node:_AST.FunctionExpression, globals:any):Function {
    let src = `(function() {     
      var id_ = new Date().getTime();
      var genSymbol = function ${_helper.genSymbol.toString()};
      ${Object.keys(globals || {}).map(k => `var ${k} = ${globals[k].toString()}`).join('\n')} 
      return ${escodegen.generate(node)}; 
    })()`;
    console.log(src);
    return eval(src);
  }

  static visitor(conf:{[key:string]:Transformer}) {
    let out = {
      process : function<T extends _AST.Node>(node:T):_AST.Node {
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
  
  static rewrite(fn:Function, visitor:Visitor, globals:any = {}) {
    let ast = Utils.parse(fn); 
    ast = Utils.visit(visitor, ast);
    return Utils.compile(ast, globals);
  }
}

export * from './helper';
export const AST = _AST
export const helper = _helper;