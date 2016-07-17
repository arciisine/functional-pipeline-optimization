import { AST, Visitor, Macro as m } from '../../../../node_modules/@arcsine/ecma-ast-transform/src';
import {VariableStack} from './stack';
import {VariableVisitHandler, VariableHandler} from './types';
import {VariableVisitorUtil} from './util';

let noop = (...args:any[]) => {}


const DEFAULT_HANDLER:VariableVisitHandler = {
    onFunctionStart:noop,
    onFunctionEnd:noop,
    onBlockStart:noop,
    onBlockEnd:noop,
    onComputedAccess:noop,
    onDeclare:noop,
    onAccess:noop,
    onWrite:noop,
    onInvoke:noop
}

export class VariableVisitor {

 /**
  * Find all variable usages
  */
  static visit(handler:VariableVisitHandler, node:AST.Node, stack?:VariableStack) {
    
    for (var k in DEFAULT_HANDLER) {
      if (!handler[k]) {
        handler[k] = DEFAULT_HANDLER[k];
      }
    }

    if (stack) {
      let ogbs = handler.onBlockStart;
      let ogbe = handler.onBlockEnd;
      let ogd = handler.onDeclare;
      handler.onBlockStart = (a) => { stack.push(); ogbs(a) }
      handler.onBlockEnd = (a) => { stack.push(); ogbe(a) }
      handler.onDeclare = (name, a) => { stack.register(name); ogd(name, a); }      
    }

    let inDeclaration = false;

    new Visitor({
      FunctionStart : (x:AST.BaseFunction) => {
        handler.onFunctionStart(x);
        let block = VariableVisitorUtil.getFunctionBlock(x);
        handler.onBlockStart(block);
        x.params.forEach(p => VariableVisitorUtil.visitVariableNames(handler.onDeclare, p, x, true))
        VariableVisitorUtil.findHoistedDeclarations(handler, x);
      },
      
      FunctionEnd : (x:AST.BaseFunction) => {
        let block = VariableVisitorUtil.getFunctionBlock(x);
        handler.onBlockEnd(block);
        handler.onFunctionEnd(x);        
      },
      
      BlockStatementStart : (x:AST.BlockStatement, v:Visitor) => {
        if (!AST.isFunction(v.parent.container as AST.Node)) {
          handler.onBlockStart(x);
        }
      },

      BlockStatementEnd : (x:AST.BlockStatement, v:Visitor) => {
        if (!AST.isFunction(v.parent.container as AST.Node)) {
          handler.onBlockEnd(x);
        }
      },

      VariableDeclarationStart : (x:AST.VariableDeclaration) => {
        inDeclaration = true;
        if (x.kind !== 'var') x.declarations.forEach(d => 
          VariableVisitorUtil.visitVariableNames(handler.onDeclare, d, x, true));
      },

      VariableDeclarationEnd : () => {
        inDeclaration = false;
      }, 

      ClassDeclaration : (x:AST.ClassDeclaration) => {
        handler.onDeclare(x.id, x);
      },

      CatchClause : (x:AST.CatchClause) => {
        VariableVisitorUtil.visitVariableNames(handler.onDeclare, x.param, x, true);
      },

      //Handle reads
      MemberExpression : (x:AST.MemberExpression) => {
        VariableVisitorUtil.visitIdentifier(handler, x.object, x);
      },


      //High level identifiers won't be picked up by member expressions
      BinaryExpression : (x:AST.BinaryExpression) => {
        VariableVisitorUtil.visitIdentifier(handler, x.left, x);
        VariableVisitorUtil.visitIdentifier(handler, x.right, x);
      },

      UnaryExpression : (x:AST.UnaryExpression) => {
        VariableVisitorUtil.visitIdentifier(handler, x.argument, x);
      },

      LogicalExpression : (x:AST.LogicalExpression) => {
        VariableVisitorUtil.visitIdentifier(handler, x.left, x);
        VariableVisitorUtil.visitIdentifier(handler, x.right, x);
      },


      //Handle assignment
      UpdateExpression : (x:AST.UpdateExpression) => {
        VariableVisitorUtil.visitVariableNames(handler.onWrite, x.argument, x)
      },

      AssignmentExpression : (x:AST.AssignmentExpression) => {
        VariableVisitorUtil.visitVariableNames(handler.onWrite, x.left, x)
        VariableVisitorUtil.visitIdentifier(handler, x.right, x);
      },

      //Handle invocation
      CallExpression : (x:AST.CallExpression) => {
        VariableVisitorUtil.visitVariableNames(handler.onInvoke, x.callee, x)
        x.arguments.forEach(a => VariableVisitorUtil.visitIdentifier(handler, a, x))
      },

      //New
      NewExpression : (x:AST.NewExpression) => {
        VariableVisitorUtil.visitVariableNames(handler.onInvoke, x.callee, x)
      },

      //This
      ThisExpression : (x:AST.ThisExpression) => {
        handler.onAccess(AST.Identifier({name:'this'}));
      },

      //Only on parents //Handle reads
      Identifier : (x:AST.Identifier, v:Visitor) => {
        //Do nothing
      }
    }).exec(node);
  }
}