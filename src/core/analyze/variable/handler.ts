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

export class VariableNodeHandler implements AST.NodeHandler<Visitor> {

  constructor(
    private handler:VariableVisitHandler, 
    private stack:VariableStack = new VariableStack()
  ) {
    for (let k in DEFAULT_HANDLER) {
      handler[k] = handler[k] || noop;
    }

    let ogbs = handler.onBlockStart;
    let ogbe = handler.onBlockEnd;
    let ogd = handler.onDeclare;

    handler.onBlockStart = (a) => { this.stack.push(); ogbs(a) }
    handler.onBlockEnd = (a) => { this.stack.push(); ogbe(a) }
    handler.onDeclare = (name, a) => { this.stack.register(name); ogd(name, a); }      
  }

  private onWrite(node:AST.Node, root:AST.Node) {
    let id = VariableVisitorUtil.getPrimaryId(node);
    if (id) this.handler.onWrite(id, root);
  }

  private onInvoke(node:AST.Node, root:AST.Node) {
    let id = VariableVisitorUtil.getPrimaryId(node);
    if (id) this.handler.onInvoke(id, root);
  }

  //Function blocks
  Function(x:AST.BaseFunction)  {
    this.handler.onFunctionStart(x);
    let block = VariableVisitorUtil.getFunctionBlock(x);
    this.handler.onBlockStart(block);

    if (x.id) {
      this.handler.onDeclare(x.id, x);
    }
    VariableVisitorUtil.readPatternIds(x.params).forEach(id => {
      this.handler.onDeclare(id, x);         
    })
    VariableVisitorUtil.findHoistedDeclarationIds(x).forEach(id => {
      this.handler.onDeclare(id, x)
    });
  }
  
  FunctionEnd(x:AST.BaseFunction) {
    let block = VariableVisitorUtil.getFunctionBlock(x);
    this.handler.onBlockEnd(block);
    this.handler.onFunctionEnd(x);
  }

  //Declarations      
  ForLoop(x:AST.ForStatement|AST.ForInStatement|AST.ForOfStatement, v:Visitor) {
    let block = VariableVisitorUtil.getForLoopBlock(x);
    this.handler.onBlockStart(block);
    if (!AST.isForStatement(x)) {
      if (!AST.isVariableDeclaration(x.left)) {
        VariableVisitorUtil.readPatternIds(x.left).forEach(id => {
          this.handler.onWrite(id, x);
        })
      } else {
        //Ensure init vars are declared descent
        VariableVisitorUtil.readDeclarationIds(x.left.declarations)
          .forEach(id => this.handler.onDeclare(id, x)); 
      }
    } else if (AST.isVariableDeclaration(x.init)) {
      //Ensure init vars are declared before descent
      VariableVisitorUtil.readDeclarationIds(x.init.declarations)
        .forEach(id => this.handler.onDeclare(id, x));
    }
  }

  ForLoopEnd(x:AST.ForStatement|AST.ForInStatement|AST.ForOfStatement, v:Visitor)  {
    let block = VariableVisitorUtil.getForLoopBlock(x);
    this.handler.onBlockEnd(block);
  }
  
  BlockStatement(x:AST.BlockStatement, v:Visitor) {
    let cont = v.parent.container as AST.Node;
    if (!AST.isFunction(cont) && !AST.isForLoop(cont) && !AST.isCatchClause(cont)) {
      this.handler.onBlockStart(x);
    }
  }

  BlockStatementEnd(x:AST.BlockStatement, v:Visitor) {
    let cont = v.parent.container as AST.Node;
    if (!AST.isFunction(cont) && !AST.isForLoop(cont) && !AST.isCatchClause(cont)) {
      this.handler.onBlockEnd(x);
    }
  }

  VariableDeclaration(x:AST.VariableDeclaration) {
    if (x.kind !== 'var') {
      VariableVisitorUtil.readDeclarationIds(x.declarations)
        .forEach(id => this.handler.onDeclare(id, x));
    }
  }

  ClassDeclaration(x:AST.ClassDeclaration) {        
    this.handler.onDeclare(x.id, x);
  }

  CatchClause(x:AST.CatchClause) {
    this.handler.onBlockStart(x.body);

    VariableVisitorUtil.readPatternIds(x.param).forEach(i => {
      this.handler.onDeclare(i, x.param);
    })
  }

  CatchClauseEnd(x:AST.CatchClause) {
    this.handler.onBlockEnd(x.body);
  }

  //Handle assignment
  UpdateExpression(x:AST.UpdateExpression) {
    this.onWrite(x.argument, x);
  }

  AssignmentExpression(x:AST.AssignmentExpression) {
    this.onWrite(x.left, x);
  }

  //Handle invocation
  CallExpression(x:AST.CallExpression) {
    this.onInvoke(x.callee, x);
  }

  //New
  NewExpression(x:AST.NewExpression) {
    this.onInvoke(x.callee, x);
  }

  //This
  ThisExpression(x:AST.ThisExpression) {
    this.handler.onThisAccess(x);
  }

  //Prevent reading patterns, already handled manually
  ObjectPattern() { return Visitor.PREVENT_DESCENT }
  ArrayPattern() { return Visitor.PREVENT_DESCENT }

  //Ids are being read
  Identifier(x:AST.Identifier, v:Visitor) {
    let pnode = v.parent.node;
    let ptype = pnode.type;
    if (!(AST.isFunction(pnode) && v.parent.container !== pnode.params) && //Not a function param
      !(AST.isVariableDeclarator(pnode) && pnode.id === x) && //Not redeclaring declarations  
      !(AST.isMemberExpression(pnode) && x === pnode.property && !pnode.computed) && //Not a member property
      !(AST.isProperty(pnode) && x === pnode.key && !pnode.computed) //Not a property key 
    ) {
      this.handler.onAccess(x, pnode);
    }
  }
}