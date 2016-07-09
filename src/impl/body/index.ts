import {AST, Util, Macro as m, Visitor, Guard as g} from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import * as Transformers from '../array/transform';
import {BaseTransformable} from '../array/base-transformable';

//Read name of manual fn from transformers
let supported = Object.keys(Transformers)
  .filter(x => x.endsWith('Transform'))
  .map(x => (new Transformers[x]() as BaseTransformable<any, any, any, any>))
  .filter(x => !!x.manual)
  .reduce((acc,x) => (acc[x.manual.name] = true) && acc, {});

const REWRITE = m.genSymbol();

const containers = [
  'FunctionExpression',
  'ArrowFunctionExpression',
  'FunctionDeclaration'
].reduce((acc, x) => acc[x] = true && acc, {});

export function rewriteBody(content:string) {
  let body = Util.parseExpression<AST.Node>(content);
  
  body = new Visitor({
    MemberExpression : (x:AST.MemberExpression, visitor:Visitor) => {
      let p = x.property;
      if (g.isIdentifier(p) && supported[p.name]) {
        let container = visitor.findParent(x =>  !Array.isArray(x.node) && g.isFunction((x.node as AST.Node)));
        if (container && !container.node[REWRITE]) {
          container.node[REWRITE] = true;
        }        
      }
    },
    CallExpression : (x : AST.CallExpression, visitor:Visitor) => {
      
    },    
    FunctionStart : (x : AST.ASTFunction, visitor:Visitor) => {
      console.log("HI");
    },
    FunctionEnd : (x : AST.ASTFunction, visitor:Visitor) => {
      if (x[REWRITE]) {
        console.log("Rewriting")
      }
    }
  }).exec(body);

  return Util.compileExpression(body);
}