import {AST, Macro as m } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import {MAPPING as supported} from '../array/transform';
import {SYMBOL} from '../array/bootstrap';
import {AccessType, Analysis } from '../../core';

export const EXEC = m.Id(`${SYMBOL}_exec`);
export const WRAP = m.Id(`${SYMBOL}_wrap`)
export const TAG  = m.Id(`${SYMBOL}_tag`)
export const FREE = m.Id()

export class BodyTransformUtil {

  static getPragmas(nodes:AST.Node[]):string[] {
    let i = 0;
    let out = [];
    while (i < nodes.length) {
      let child = nodes[i++];
      if (!(AST.isExpressionStatement(child) && 
          AST.isLiteral(child.expression) && 
          typeof child.expression.value === 'string')) break;

      out.push(child.expression.value as string);
    }
    return out;
  }

  static handleChainStart(callee:AST.MemberExpression) {
    //Check for start of chain
    let sub = callee.object;
    let done = true;
    let subCallee = null;
    //Chain is done
    if (AST.isCallExpression(callee.object) && AST.isMemberExpression(callee.object.callee)) {
      let subCallee = callee.object.callee;
      let prop = callee.property;
      if (AST.isIdentifier(callee.property) && supported[callee.property.name]) {
        if (AST.isIdentifier(subCallee.property) && supported[subCallee.property.name]) {
          done = false;
        }
      }
    }

    if (done) {
      callee.object = m.Call(WRAP, callee.object);
    }
  }

  static handleChainEnd(x:AST.CallExpression, analysis:Analysis) {
    let closed = {};
    let assigned = {};

    for (var k in analysis.closed) {
      let v = analysis.closed[k];
      if ((v & AccessType.WRITE) > 0) {
        assigned[k] = true;
      } else if (v > 0) {
        closed[k] = true;
      }
    }

    //Define call site
    let closedIds =  Object.keys(closed).sort().map(m.Id);
    let assignedIds = Object.keys(assigned).sort().map(m.Id);
    let allIds =  m.Array(...[...assignedIds, ...closedIds])

    let execParams:any = [x];

    //Handle if we have to reassign closed variables
    if (allIds.elements.length > 0) {
      execParams.push(allIds);
      if (assignedIds.length > 0) {
        let id = m.Id()
        execParams.push(AST.ArrowFunctionExpression({
          params : [id],
          expression: true,
          body : AST.AssignmentExpression({
            left : AST.ArrayPattern({ elements : assignedIds }),
            operator : '=',
            right : id
          }),
          generator: false,
          id: null
        })); 
      }          
    }
    
    //Wrap with exec
    return m.Call(EXEC, ...execParams);;
  }
}