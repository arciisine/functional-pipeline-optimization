import { Util, AST, Visitor, Macro as m } from '../../../node_modules/@arcsine/ecma-ast-transform/src';

export interface VariableHandler {
  (name:AST.Identifier, node?:AST.Node):void;
}

let noop = (...args:any[]) => {}

export interface VariableVisitHandler {
    onFunctionStart?:(node?:AST.BaseFunction)=>void,
    onFunctionEnd?:(node?:AST.BaseFunction)=>void,
    onBlockStart?:(node?:AST.BlockStatement)=>void,
    onBlockEnd?:(node?:AST.BlockStatement)=>void,
    onDeclare?:VariableHandler,
    onComputedAccess?:VariableHandler,
    onAccess?:VariableHandler,
    onWrite?:VariableHandler,
    onInvoke?:VariableHandler,
}

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

export class VariableStack {
  top = null;
  scope = [null];
  length = 0;

  register(name:string|AST.Identifier) {
    if (this.top === null) {
      this.scope[this.length] = (this.top = {});
    }
    if (typeof name === 'string') {
      this.top[name] = true;
    } else {
      this.top[name.name] = true;
    }
  }

  contains(name:string|AST.Identifier) {
    if (typeof name === 'string') {
      return !!this.top[name];
    } else {
      return !!this.top[name.name];
    }
  }

  push() {
    let out = {};
    for (var k in this.top) {
      out[k] = this.top[k];
    }
    this.length += 1
    this.scope.unshift(this.top = out);
  }

  pop() {
    if (this.scope.length > 0) {
      this.scope.shift()
      this.length -= 1     
      this.top = this.scope[0];
    }
  }
}

export class VariableVisitor {

  static visitVariableNames(handler:VariableHandler, target:AST.Pattern, root:AST.Node, isDeclare = false):void { 
    if (AST.isIdentifier(target)) {
      handler(target, root || target);
    } else if (AST.isObjectPattern(target)) {
      for (let prop of target.properties) {
        VariableVisitor.visitVariableNames(handler, isDeclare ? prop.value : prop.key, root || target, isDeclare);
      }
    } else if (AST.isArrayPattern(target)) {
      for (let el of target.elements) {
        VariableVisitor.visitVariableNames(handler, el, root || target, isDeclare);
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
            VariableVisitor.visitVariableNames(handler.onDeclare, d.id, x, true);
            VariableVisitor.visitVariableNames(handler.onAccess, d.id, x);
            VariableVisitor.visitVariableNames(handler.onAccess, d.init, x);
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
        let block = VariableVisitor.getFunctionBlock(x);
        handler.onBlockStart(block);
        x.params.forEach(p => VariableVisitor.visitVariableNames(handler.onDeclare, p, x, true))
        VariableVisitor.findHoistedDeclarations(handler, x);
      },
      
      FunctionEnd : (x:AST.BaseFunction) => {
        let block = VariableVisitor.getFunctionBlock(x);
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
          VariableVisitor.visitVariableNames(handler.onDeclare, d, x, true));
      },

      VariableDeclarationEnd : () => {
        inDeclaration = false;
      }, 

      ClassDeclaration : (x:AST.ClassDeclaration) => {
        handler.onDeclare(x.id, x);
      },

      CatchClause : (x:AST.CatchClause) => {
        VariableVisitor.visitVariableNames(handler.onDeclare, x.param, x, true);
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
        VariableVisitor.visitVariableNames(handler.onWrite, x.argument, x)
      },

      AssignmentExpression : (x:AST.AssignmentExpression) => {
        VariableVisitor.visitVariableNames(handler.onWrite, x.left, x)
        VariableVisitor.visitIdentifier(handler, x.right, x);
      },

      //Handle invocation
      CallExpression : (x:AST.CallExpression) => {
        VariableVisitor.visitVariableNames(handler.onInvoke, x.callee, x)
        x.arguments.forEach(a => VariableVisitor.visitIdentifier(handler, a, x))
      },

      //New
      NewExpression : (x:AST.NewExpression) => {
        VariableVisitor.visitVariableNames(handler.onInvoke, x.callee, x)
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