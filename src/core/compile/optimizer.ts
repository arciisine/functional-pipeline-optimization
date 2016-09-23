import {AST, Visitor, Macro as m} from '@arcsine/ecma-ast-transform/src';


export class Optimizer {
  static optimize(node:AST.Node):AST.Node {
    return Visitor.exec({
      ExpressionStatementEnd : (stmt:AST.ExpressionStatement) => {
        if (AST.isAssignmentExpression(stmt.expression)) {
          let node = stmt.expression;
          //remove reassignments
          if (AST.isIdentifier(node.left) && AST.isIdentifier(node.right) && node.left.name === node.right.name) {
            return Visitor.DELETE_FLAG;
          }
        }        
      },
      BinaryExpressionEnd : (node:AST.BinaryExpression) => {
        if (AST.isLiteral(node.left) && AST.isLiteral(node.right)) {
          let l = node.left.value;
          let r = node.right.value;
          let o = node.operator;
          if (typeof l === 'number' && typeof r === 'number' && !Number.isNaN(l) && !Number.isNaN(r)) {
            switch(o) {
              case '+': return m.Literal(l+r);
              case '-': return m.Literal(l-r);
              case '*': return m.Literal(l*r);
              case '/': return m.Literal(l/r);
            }
          }
          if (typeof l === 'string' && o === '+') {
            return m.Literal(l+o);
          }
        }
      }
    }, node);
  } 
}