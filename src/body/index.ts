import {AST, Util, Macro as m, Visitor} from '../../node_modules/@arcsine/ecma-ast-transform/src';
import * as Transformers from '../array/transform';

//Read name of manual fn from transformers
let supported = {};
Object.keys(Transformers)
  .filter(x => x.endsWith('Transform'))
  .map(x => (new Transformers[x]() as Transformers.ArrayTransformable<any, any, any>).manual.name)
  .forEach(x => supported[x] = true)

console.log(supported);

export function rewriteBody(content:string) {
  let body = Util.parseExpression<AST.Node>(content);

  const containers = ['FunctionExpression', 'ArrowFunctionExpression'];

  body = new Visitor({
    MemberExpression : (x:AST.MemberExpression, visitor:Visitor) => {
      if (x.property.type === 'Identifier'){ 
        let name = (x.property as AST.Identifier).name;
        if (supported[name]) {
          let container = visitor.findParent(x => !Array.isArray(x.node) && containers[(x.node as AST.Node).type] )
          container['rewrite'] = true;
        }
      }
    },
    CallExpression : (x : AST.CallExpression, visitor:Visitor) => {
      
    },
    FunctionExpressionStart : (x : AST.FunctionExpression, visitor:Visitor) => {

    },
    FunctionExpressionEnd : (x : AST.FunctionExpression, visitor:Visitor) => {
      if (x['rewrite']) {
        console.log("Rewriting")
      }
    },
    ArrowFunctionExpressionStart : (x : AST.ArrowExpression, visitor:Visitor) => {

    },
    ArrowFunctionExpressionEnd : (x : AST.ArrowExpression, visitor:Visitor) => {
      if (x['rewrite']) {
        console.log("Rewriting")
      }
    }
  }).exec(body);

  return Util.compileExpression(body);
}