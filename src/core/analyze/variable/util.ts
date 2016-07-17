import { AST, Visitor, Macro as m } from '../../../../node_modules/@arcsine/ecma-ast-transform/src';
import {TransformResponse} from '../../transform';
import {VariableStack} from './stack';
import {VariableVisitHandler, VariableHandler} from './types';


export class VariableVisitorUtil {
    static rewritePatterns(node:AST.Pattern, stack:VariableStack) {
    if (AST.isObjectPattern(node)) {
      for (let p of node.properties) {
        VariableVisitorUtil.rewritePatterns(p, stack);
      }
    } else if (AST.isArrayPattern(node)) {
      for (let p of node.elements) {
        VariableVisitorUtil.rewritePatterns(p, stack);
      }
    } else if (AST.isIdentifier(node)) {
      stack.register(node);
      node.name = stack.top[node.name] = m.Id().name
    } else if (AST.isProperty(node)) {
      node.shorthand = false;
      node.value = {} as any;
      for (var k in node.key) { node.value[k] = node.key[k] }
      VariableVisitorUtil.rewritePatterns(node.value, stack);      
    }
    return node;
  }

  static visitVariableNames(handler:VariableHandler, target:AST.Pattern, root:AST.Node, isDeclare = false):void { 
    if (AST.isIdentifier(target)) {
      handler(target, root || target);
    } else if (AST.isObjectPattern(target)) {
      for (let prop of target.properties) {
        VariableVisitorUtil.visitVariableNames(handler, isDeclare ? prop.value : prop.key, root || target, isDeclare);
      }
    } else if (AST.isArrayPattern(target)) {
      for (let el of target.elements) {
        VariableVisitorUtil.visitVariableNames(handler, el, root || target, isDeclare);
      }
    }
  }

  static findHoistedDeclarations(handler:VariableVisitHandler, node:AST.Node) {
    //Hoist vars, remove nested functions
    new Visitor({
      FunctionDeclaration : (x:AST.FunctionDeclaration) => {
        handler.onDeclare(x.id, x.id);
      },            
      FunctionStart : (x:AST.BaseFunction) => { 
        return Visitor.PREVENT_DESCENT //Only look at current function
      },
      VariableDeclaration : (x:AST.VariableDeclaration) => {
        if (x.kind === 'var') {
          x.declarations.forEach(d => {
            VariableVisitorUtil.visitVariableNames(handler.onDeclare, d.id, x, true);
            VariableVisitorUtil.visitVariableNames(handler.onAccess, d.id, x);
            VariableVisitorUtil.visitVariableNames(handler.onAccess, d.init, x);
          });
        }
      }
    }).exec(node);
  }

  static visitIdentifier(handler:VariableVisitHandler, target:AST.Node, root:AST.Node) {
    if (AST.isIdentifier(target))  handler.onAccess(target, root);
  }

  static getFunctionBlock(x:AST.BaseFunction):AST.BlockStatement {
    if (AST.isFunctionDeclaration(x) || AST.isFunctionExpression(x)) {
      return x.body;
    } else if (AST.isArrowFunctionExpression(x)) {
      if (AST.isBlockStatement(x.body)) {
        return x.body;
      } else {
        let body = m.Block(m.Return(x.body));
        x.expression = false;        
        x.body = body;
        return body;
      }
    }
  }
}