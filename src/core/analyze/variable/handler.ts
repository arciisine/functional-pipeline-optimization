import { AST, Visitor, Macro as m } from '../../../../node_modules/@arcsine/ecma-ast-transform/src';
import {VariableStack} from './stack';
import {VariableVisitHandler, VariableHandler} from './types';
import {VariableVisitorUtil} from './util';

let noop = (...args:any[]) => {}

function invoke(ctx, fn, ...args) {
  if (fn) fn.apply(ctx, args);
}

export class VariableNodeHandler<T> implements AST.NodeHandler<Visitor> {

  constructor(
    private handler:VariableVisitHandler, 
    private stack:VariableStack<T> = new VariableStack<T>()
  ) {
    let ogbs = handler.Block;
    let ogbe = handler.BlockEnd;
    let ogd = handler.Declare;

    handler.Block = (a) => { this.stack.push(); invoke(null, ogbs, a) }
    handler.BlockEnd = (a) => { this.stack.pop(); invoke(null, ogbe, a) }
    handler.Declare = (name, a) => { this.stack.register(name); invoke(null, ogd, name, a); }      
  }

  private onWrite(node:AST.Node, root:AST.Node) {
    let id = VariableVisitorUtil.getPrimaryId(node);
    if (id) invoke(this, this.handler.Write, id, root);
  }

  private onInvoke(node:AST.Node, root:AST.Node) {
    let id = VariableVisitorUtil.getPrimaryId(node);
    if (id) invoke(this, this.handler.Invoke, id, root);
  }

  //Function blocks
  Function(x:AST.BaseFunction) {
    invoke(this, this.handler.Function, x);
    let block = VariableVisitorUtil.getFunctionBlock(x);
    invoke(this, this.handler.Block, block);

    if (x.id !== null) {
      invoke(this, this.handler.Declare, x.id, x);
    }
    VariableVisitorUtil.readPatternIds(x.params).forEach(id => {
      invoke(this, this.handler.Declare, id, x);
    })
    VariableVisitorUtil.findHoistedDeclarationIds(x).forEach(id => {
      invoke(this, this.handler.Declare, id, x)
    });
  }
  
  FunctionEnd(x:AST.BaseFunction) {
    let block = VariableVisitorUtil.getFunctionBlock(x);
    invoke(this, this.handler.BlockEnd, block);
    invoke(this, this.handler.FunctionEnd, x);
  }

  //Declarations      
  ForLoop(x:AST.ForStatement|AST.ForInStatement|AST.ForOfStatement, v:Visitor) {
    let block = VariableVisitorUtil.getForLoopBlock(x);
    invoke(this, this.handler.Block, block);
    if (!AST.isForStatement(x)) {
      if (!AST.isVariableDeclaration(x.left)) {
        VariableVisitorUtil.readPatternIds(x.left).forEach(id => {
          invoke(this, this.handler.Write, id, x);
        })
      } else {
        //Ensure init vars are declared before descent
        VariableVisitorUtil.readDeclarationIds(x.left.declarations)
          .forEach(id => invoke(this, this.handler.Declare, id, x)); 
      }
    } else if (AST.isVariableDeclaration(x.init)) {
      //Ensure init vars are declared before descent
      VariableVisitorUtil.readDeclarationIds(x.init.declarations)
        .forEach(id => invoke(this, this.handler.Declare, id, x));
    }
  }

  ForLoopEnd(x:AST.ForStatement|AST.ForInStatement|AST.ForOfStatement, v:Visitor)  {
    let block = VariableVisitorUtil.getForLoopBlock(x);
    invoke(this, this.handler.BlockEnd, block);
  }
  
  BlockStatement(x:AST.BlockStatement, v:Visitor) {
    let cont = v.parent.container as AST.Node;
    if (!AST.isFunction(cont) && !AST.isForLoop(cont) && !AST.isCatchClause(cont)) {
      invoke(this, this.handler.Block, x);
    }
  }

  BlockStatementEnd(x:AST.BlockStatement, v:Visitor) {
    let cont = v.parent.container as AST.Node;
    if (!AST.isFunction(cont) && !AST.isForLoop(cont) && !AST.isCatchClause(cont)) {
      invoke(this, this.handler.BlockEnd, x);
    }
  }

  VariableDeclaration(x:AST.VariableDeclaration) {
    VariableVisitorUtil.readDeclarationIds(x.declarations)
      .forEach(id => 
        x.kind === 'var' ? 
          invoke(this, this.handler.Write, id,x) : //var, post-hoist, is just an assign
          invoke(this, this.handler.Declare, id, x)
      );
  }

  ClassDeclaration(x:AST.ClassDeclaration) {        
    invoke(this, this.handler.Declare, x.id, x);
  }

  CatchClause(x:AST.CatchClause) {
    invoke(this, this.handler.Block, x.body);

    VariableVisitorUtil.readPatternIds(x.param).forEach(i => {
      invoke(this, this.handler.Declare, i, x.param);
    })
  }

  CatchClauseEnd(x:AST.CatchClause) {
    invoke(this, this.handler.BlockEnd, x.body);
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
    invoke(this, this.handler.ThisAccess, x);
  }

  MemberExpression(x:AST.MemberExpression, v:Visitor) {
    //Handle top-level property reference (object is literal)
    if (AST.isIdentifier(x.object)) {
      let chain:AST.Identifier[] = [x.object];
      
      if (AST.isIdentifier(x.property) && !x.computed) {
        chain.push(x.property);

        for (let parent of v.parents) {
          if (AST.isMemberExpression(parent.node) && AST.isIdentifier(x.property)) {
            chain.push(x.property);
          } else {
            break;
          }
        }
      }

      invoke(this, this.handler.PropertyAccess, chain, x);
    }
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
      invoke(this, this.handler.Access, x, pnode);
    }
  }
}