import {AST, Util, Macro as m, Visitor} from '../../node_modules/ecma-ast-transform/src';

export function rewriteBody(content:string) {
  let body = Util.parseExpression<AST.Node>(content);

  const verifiable = {reduce:true, filter:true, map:true,forEach:true};
  const containers = ['FunctionExpression', 'ArrowFunctionExpression'];

  body = new Visitor({
    MemberExpression : (x:AST.MemberExpression, visitor:Visitor) => {
      if (x.property.type === 'Identifier'){ 
        let name = (x.property as AST.Identifier).name;
        if (verifiable[name]) {
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