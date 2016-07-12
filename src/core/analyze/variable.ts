import { Util, AST, Visitor, Macro as m } from '../../../node_modules/@arcsine/ecma-ast-transform/src';

export interface VariableHandler {
  (name:string, node?:AST.Node):void;
}

let noop = (...args:any[]) => {}

export interface VariableVisitHandler {
    onFunctionStart?:(node?:AST.BaseFunction)=>void,
    onFunctionEnd?:(node?:AST.BaseFunction)=>void,
    onBlockStart?:(node?:AST.BlockStatement)=>void,
    onBlockEnd?:(node?:AST.BlockStatement)=>void,
    onDeclare?:VariableHandler,
    onAccess?:VariableHandler,
    onWrite?:VariableHandler,
    onInvoke?:VariableHandler,
}

const DEFAULT_HANDLER:VariableVisitHandler = {
    onFunctionStart:noop,
    onFunctionEnd:noop,
    onBlockStart:noop,
    onBlockEnd:noop,
    onDeclare:noop,
    onAccess:noop,
    onWrite:noop,
    onInvoke:noop
}

export class VariableVisitor {

  static visitVariableNames(handler:VariableHandler, target:AST.Node, root:AST.Node = null):void { 
    while (AST.isMemberExpression(target)) {
        target = (target as AST.MemberExpression).object
    }

    if (AST.isIdentifier(target)) {
      handler(target.name, root || target);
    } else if (AST.isObjectPattern(target)) {
      for (let prop of target.properties) {
        VariableVisitor.visitVariableNames(handler, prop.value, root || target);
      }
    } else if (AST.isArrayPattern(target)) {
      for (let el of target.elements) {
        VariableVisitor.visitVariableNames(handler, el, root || target);
      }
    }
  }

  static findHoistedDeclarations(handler:VariableVisitHandler, node:AST.Node) {
    //Hoist vars, remove nested functions
    new Visitor({
      FunctionDeclaration : (x:AST.FunctionDeclaration) => {
        handler.onDeclare(x.id.name, x.id);
      },            
      FunctionStart : (x:AST.BaseFunction) => { 
        return Visitor.PREVENT_DESCENT //Only look at current function
      },
      VariableDeclaration : (x:AST.VariableDeclaration) => {
        if (x.kind === 'var') {
          x.declarations.forEach(d => VariableVisitor.visitVariableNames(handler.onDeclare, d, x));
        }
      }
    }).exec(node);
  }

  static visitIdentifier(handler:VariableVisitHandler, target:AST.Node, root:AST.Node) {
    if (AST.isIdentifier(target))  handler.onAccess(target.name, root);
  }

  static getFunctionBlock(x:AST.BaseFunction):AST.BlockStatement {
    if (AST.isFunctionDeclaration(x) || AST.isFunctionExpression(x)) {
      return x.body;
    } else if (AST.isArrowFunctionExpression(x)) {
      if (AST.isBlockStatement(x.body)) {
        return x.body;
      } else {
        let body = m.Block(m.Return(x.body));
        x.body = body;
        return body;
      }
    }
  }

 /**
  * Find all variable usages
  */
  static visit(handler:VariableVisitHandler, node:AST.Node) {
    
    for (var k in DEFAULT_HANDLER) {
      if (!handler[k]) {
        handler[k] = DEFAULT_HANDLER[k];
      }
    }

    new Visitor({
      FunctionStart : (x:AST.BaseFunction) => {
        handler.onFunctionStart(x);
        let block = VariableVisitor.getFunctionBlock(x);
        handler.onBlockStart(block);
        VariableVisitor.findHoistedDeclarations(handler, x);
      },
      
      FunctionEnd : (x:AST.BaseFunction) => {
        let block = VariableVisitor.getFunctionBlock(x);
        handler.onBlockEnd(block);
        handler.onFunctionEnd(x);        
      },
      
      BlockStatementStart : (x:AST.BlockStatement, v:Visitor) => {
        if (!AST.isFunction(v.parent.node as AST.Node)) {
          handler.onBlockStart(x);
        }
      },

      BlockStatementEnd : (x:AST.BlockStatement, v:Visitor) => {
        if (!AST.isFunction(v.parent.node as AST.Node)) {
          handler.onBlockEnd(x);
        }
      },

      VariableDeclaration : (x:AST.VariableDeclaration) => {
        if (x.kind !== 'var') x.declarations.forEach(d => 
          VariableVisitor.visitVariableNames(handler.onDeclare, d, x));
      },

      ClassDeclaration : (x:AST.ClassDeclaration) => {
        handler.onDeclare(x.id.name, x);
      },

      CatchClause : (x:AST.CatchClause) => {
        VariableVisitor.visitVariableNames(handler.onDeclare, x.param, x);
      },

      //Handle reads
      MemberExpression : (x:AST.MemberExpression) => {
        VariableVisitor.visitIdentifier(handler, x.object, x);
      },

      //High level identifiers won't be picked up by member expressions
      BinaryExpression : (x:AST.BinaryExpression) => {
        VariableVisitor.visitIdentifier(handler, x.left, x);
        VariableVisitor.visitIdentifier(handler, x.right, x);
      },

      UnaryExpression : (x:AST.UnaryExpression) => {
        VariableVisitor.visitIdentifier(handler, x.argument, x);
      },

      LogicalExpression : (x:AST.LogicalExpression) => {
        VariableVisitor.visitIdentifier(handler, x.left, x);
        VariableVisitor.visitIdentifier(handler, x.right, x);
      },

      //Handle assignment
      UpdateExpression : (x:AST.UpdateExpression) => {
        VariableVisitor.visitVariableNames((name:string, node:AST.Node) => {
          handler.onAccess(name, node)
          handler.onWrite(name, node);
        }, x, x)
      },

      AssignmentExpression : (x:AST.AssignmentExpression) => {
        VariableVisitor.visitVariableNames(handler.onWrite, x.left, x)
        VariableVisitor.visitVariableNames(handler.onAccess, x.right, x)
      },

      //Handle invocation
      CallExpression : (x:AST.CallExpression) => {
        VariableVisitor.visitVariableNames(handler.onInvoke, x.callee, x)
      },

      //New
      NewExpression : (x:AST.NewExpression) => {
        VariableVisitor.visitVariableNames(handler.onInvoke, x.callee, x)
      },

      //This
      ThisExpression : (x:AST.ThisExpression) => {
        handler.onAccess('this');
      },

      Identifier : (x:AST.Identifier) => {
        //Do nothing, handled in expression checking
      }
    }).exec(node);
  }
}