import {AST, Transform, Macro as m, VisitParents} from '../../node_modules/ecma-ast-transform/src';

function rewriteBody(content:string) {
  let body = Transform.parseExpression<AST.Node>(content);

  Transform.visit(Transform.visitor({
    MemberExpression : (x:AST.MemberExpression, parents:VisitParents) => {
      
    },
    CallExpression : (x : AST.CallExpression, parents:VisitParents) => {
      
    }
  }), body);

  return Transform.compileExpression(body);
}