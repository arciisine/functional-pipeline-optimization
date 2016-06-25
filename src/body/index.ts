import {AST, Transform, Macro as m} from '../../node_modules/ecma-ast-transform/src';

function rewriteBody(content:string) {
  let body = Transform.parseExpression<AST.Node>(content);

  Transform.visit(Transform.visitor({

  }), body);

  return Transform.compileExpression(body);
}