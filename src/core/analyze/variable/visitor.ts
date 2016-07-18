import { AST, Visitor, Macro as m } from '../../../../node_modules/@arcsine/ecma-ast-transform/src';
import {VariableStack} from './stack';
import {VariableVisitHandler, VariableHandler} from './types';
import {VariableVisitorUtil} from './util';

let noop = (...args:any[]) => {}

const DEFAULT_HANDLER:VariableVisitHandler = {
    onFunctionStart:null,
    onFunctionEnd:null,
    onBlockStart:null,
    onBlockEnd:null,
    onComputedAccess:null,
    onDeclare:null,
    onAccess:null,
    onThisAccess:null,
    onWrite:null,
    onInvoke:null
}

export class VariableVisitor {

  static visitUsage(handler:VariableHandler, node:AST.Node, root:AST.Node) {
    let id = VariableVisitorUtil.getPrimaryId(node);
    if (id) {
      handler(id, root);
    }
  }

  static visitIdentifier(handler:VariableVisitHandler, target:AST.Node, root:AST.Node) {
    if (AST.isIdentifier(target))  {
      handler.onAccess(target, root);
    }
  } 

  /**
   * Find all variable usages
   */
  static visit(handler:VariableVisitHandler, node:AST.Node, stack?:VariableStack) {
    
    for (let k in DEFAULT_HANDLER) {
      handler[k] = handler[k] || noop;
    }

    if (stack) {
      let ogbs = handler.onBlockStart;
      let ogbe = handler.onBlockEnd;
      let ogd = handler.onDeclare;
      handler.onBlockStart = (a) => { stack.push(); ogbs(a) }
      handler.onBlockEnd = (a) => { stack.push(); ogbe(a) }
      handler.onDeclare = (name, a) => { stack.register(name); ogd(name, a); }      
    }
    
    //Go
    new Visitor({

      //Function blocks
      FunctionStart : (x:AST.BaseFunction) => {
        handler.onFunctionStart(x);
        let block = VariableVisitorUtil.getFunctionBlock(x);
        handler.onBlockStart(block);

        if (x.id) {
          handler.onDeclare(x.id, x);
        }
        VariableVisitorUtil.readPatternIds(x.params).forEach(id => {
          handler.onDeclare(id, x);         
        })
        VariableVisitorUtil.findHoistedDeclarationIds(x).forEach(id => {
          handler.onDeclare(id, x)
        });
      },
      
      FunctionEnd : (x:AST.BaseFunction) => {
        let block = VariableVisitorUtil.getFunctionBlock(x);
        handler.onBlockEnd(block);
        handler.onFunctionEnd(x);
      },

      //Declarations      
      ForLooptStart   : (x:AST.ForStatement|AST.ForInStatement|AST.ForOfStatement, v:Visitor) => {
        let block = VariableVisitorUtil.getForLoopBlock(x);
        handler.onBlockStart(block);
        if (!AST.isForStatement(x)) {
          if (!AST.isVariableDeclaration(x.left)) {
            VariableVisitorUtil.readPatternIds(x.left).forEach(id => {
              handler.onWrite(id, x);
            })
          } else {
            //Ensure init vars are declared descent
            VariableVisitorUtil.readDeclarationIds(x.left.declarations)
              .forEach(id => handler.onDeclare(id, x)); 
          }
        } else if (AST.isVariableDeclaration(x.init)) {
          //Ensure init vars are declared before descent
          VariableVisitorUtil.readDeclarationIds(x.init.declarations)
            .forEach(id => handler.onDeclare(id, x));
        }
      },

      ForLoopEnd : (x:AST.ForStatement|AST.ForInStatement|AST.ForOfStatement, v:Visitor) => {
        let block = VariableVisitorUtil.getForLoopBlock(x);
        handler.onBlockEnd(block);
      },
      
      BlockStatementStart : (x:AST.BlockStatement, v:Visitor) => {
        let cont = v.parent.container as AST.Node;
        if (!AST.isFunction(cont) && !AST.isForLoop(cont) && !AST.isCatchClause(cont)) {
          handler.onBlockStart(x);
        }
      },

      BlockStatementEnd : (x:AST.BlockStatement, v:Visitor) => {
        let cont = v.parent.container as AST.Node;
        if (!AST.isFunction(cont) && !AST.isForLoop(cont) && !AST.isCatchClause(cont)) {
          handler.onBlockEnd(x);
        }
      },

      VariableDeclarationStart : (x:AST.VariableDeclaration) => {
        if (x.kind !== 'var') {
          VariableVisitorUtil.readDeclarationIds(x.declarations)
            .forEach(id => handler.onDeclare(id, x));
        }
      },

      ClassDeclaration : (x:AST.ClassDeclaration) => {        
        handler.onDeclare(x.id, x);
      },

      CatchClauseStart : (x:AST.CatchClause) => {
        handler.onBlockStart(x.body);

        VariableVisitorUtil.readPatternIds(x.param).forEach(i => {
          handler.onDeclare(i, x.param);
        })
      },

      CatchClauseEnd : (x:AST.CatchClause) => {
        handler.onBlockEnd(x.body);
      },

      //Handle assignment
      UpdateExpression : (x:AST.UpdateExpression) => {
        VariableVisitor.visitUsage(handler.onWrite, x.argument, x);
      },

      AssignmentExpression : (x:AST.AssignmentExpression) => {
        VariableVisitor.visitUsage(handler.onWrite, x.left, x);
      },

      //Handle invocation
      CallExpression : (x:AST.CallExpression) => {
        VariableVisitor.visitUsage(handler.onInvoke, x.callee, x);
      },

      //New
      NewExpression : (x:AST.NewExpression) => {
        VariableVisitor.visitUsage(handler.onInvoke, x.callee, x);
      },

      //This
      ThisExpression : (x:AST.ThisExpression) => {
        handler.onThisAccess(x);
      },

      //Prevent reading patterns, already handled manually
      ObjectPattern : () => Visitor.PREVENT_DESCENT,
      ArrayPattern  : () => Visitor.PREVENT_DESCENT,

      //Ids are being read
      Identifier : (x:AST.Identifier, v:Visitor) => {
        let pnode = v.parent.node;
        let ptype = pnode.type;
        if (!(AST.isFunction(pnode) && v.parent.container !== pnode.params) && //Not a function param
          !(AST.isVariableDeclarator(pnode) && pnode.id === x) && //Not redeclaring declarations  
          !(AST.isMemberExpression(pnode) && x === pnode.property && !pnode.computed) && //Not a member property
          !(AST.isProperty(pnode) && x === pnode.key && !pnode.computed) //Not a property key 
        ) {
          handler.onAccess(x, pnode);
        }
      }
    }).exec(node);
  }
}