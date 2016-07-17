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

    let declaring = false;

    new Visitor({
      FunctionStart : (x:AST.BaseFunction) => {
        handler.onFunctionStart(x);
        let block = VariableVisitorUtil.getFunctionBlock(x);
        handler.onBlockStart(block);
        if (x.id) {
          handler.onDeclare(x.id, x);
        }
        VariableVisitorUtil.readPatternIds(x.params).forEach(id => {
          id['param'] = true;
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
        if (x.kind !== 'var') {
          VariableVisitorUtil.readDeclarationIds(x.declarations)
            .forEach(id => handler.onDeclare(id, x));
        }
      },

      ClassDeclaration : (x:AST.ClassDeclaration) => {
        handler.onDeclare(x.id, x);
      },

      CatchClause : (x:AST.CatchClause) => {
        VariableVisitorUtil.readPatternIds(x.param).forEach(i => {
          handler.onDeclare(i, x.param);
        })
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
        handler.onAccess(AST.Identifier({name:'this'}));
      },

      //Only on parents //Handle reads
      Identifier : (x:AST.Identifier, v:Visitor) => {
        let pnode = v.parent.node;
        let ptype = pnode.type;
        if (!x['param'] && !ptype.endsWith('Declaration') && (!AST.isMemberExpression(pnode) || x === pnode.object)) {
          console.log(x, ptype, pnode)
          handler.onAccess(x, pnode);
        }
        //Do nothing
      }
    }).exec(node);
  }
}

/*


a.b.c = 5 (assign a, read a)
a.b.c() (invoke a, read a)

var a = 5 (delcare a hoisted)
function a() {} (delcare a hoisted)
let a = 5 (delcare a)
const a = 5 (delcare a)

a = 5 (Assign a)
a + b (Read a,b)
a || b (Read a,b)
a < b (Read a,b)

[a,b] = [b,c] (assign a,b, read a,b)
function ({a:c,b:d}) (Declare c,d)
{a:} 











 */