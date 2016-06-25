import {AST, Util, Macro as m, Visitor} from '../../node_modules/ecma-ast-transform/src';

function rewriteBody(content:string) {
  let body = Util.parseExpression<AST.Node>(content);

  body = new Visitor({
    MemberExpression : (x:AST.MemberExpression, parents:Visitor) => {
      
    },
    CallExpression : (x : AST.CallExpression, parents:Visitor) => {
      
    }
  }).exec(body);

  return Util.compileExpression(body);
}