import {AST, Util, Macro as m, Visitor } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import * as Transformers from '../array/transform';
import {BaseTransformable} from '../array/base-transformable';

//Read name of manual fn from transformers
let supported = Object.keys(Transformers)
  .filter(x => x.endsWith('Transform'))
  .map(x => (new Transformers[x]() as BaseTransformable<any, any, any, any>))
  .filter(x => !!x.manual)
  .reduce((acc,x) => (acc[x.manual.name] = true) && acc, {});

const REWRITE = m.genSymbol();

export function rewriteBody(content:string) {
  let body = Util.parseExpression<AST.Node>(content);

  //Collect variables
  new Visitor({
    VariableDeclaration : (x:AST.VariableDeclaration) => {

    },
    FunctionDeclaration : (x:AST.FunctionDeclaration) => {

    },
    ClassDeclaration : (x:AST.ClassDeclaration) => {
      
    }
  })
  
  body = new Visitor({
    MemberExpression : (x:AST.MemberExpression, visitor:Visitor) => {
      let p = x.property;
      if (AST.isIdentifier(p) && supported[p.name]) {
        let container = visitor.findParent(x =>  !Array.isArray(x.node) && AST.isFunction(x.node as AST.Node));
        if (container && !container.node[REWRITE]) {
          container.node[REWRITE] = true;
        }        
      }
    },
    CallExpression : (x : AST.CallExpression, visitor:Visitor) => {
      
    }
  }).exec(body);

  return Util.compileExpression(body);
}