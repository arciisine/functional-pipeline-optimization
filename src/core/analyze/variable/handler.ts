import { AST, Visitor, Macro as m } from '../../../../node_modules/@arcsine/ecma-ast-transform/src';
import {VariableStack} from './stack';
import {VariableVisitHandler, VariableHandler} from './types';
import {VariableVisitorUtil} from './util';

let noop = (...args:any[]) => {}

export class VariableNodeHandler<T> implements AST.NodeHandler<Visitor> {

  constructor(
    private handler:VariableVisitHandler, 
    private stack:VariableStack<T> = new VariableStack<T>()
  ) {
    ['Function', 'FunctionEnd', 'Block', 'BlockEnd', 
      'ComputedAccess', 'Declare', 'ThisAccess', 'Write', 'Invoke', 
      'PropertyAccess', 'Access'
    ].forEach(k => handler[k] = handler[k] || noop)

    let ogbs = handler.Block;
    let ogbe = handler.BlockEnd;
    let ogd = handler.Declare;

    handler.Block = (a) => { this.stack.push(); ogbs(a) }
    handler.BlockEnd = (a) => { this.stack.pop(); ogbe(a) }
    handler.Declare = (name, a) => { this.stack.register(name); ogd(name, a); }      
  }

  private onWrite(node:AST.Node, root:AST.Node) {
    let id = VariableVisitorUtil.getPrimaryId(node);
    if (id) this.handler.Write(id, root);
  }

  private onInvoke(node:AST.Node, root:AST.Node) {
    let id = VariableVisitorUtil.getPrimaryId(node);
    if (id) this.handler.Invoke(id, root);
  }

  //Function blocks
  Function(x:AST.BaseFunction) {
    this.handler.Function(x);
    let block = VariableVisitorUtil.getFunctionBlock(x);
    this.handler.Block(block);

    if (x.id) {
      this.handler.Declare(x.id, x);
    }
    VariableVisitorUtil.readPatternIds(x.params).forEach(id => {
      this.handler.Declare(id, x);         
    })
    VariableVisitorUtil.findHoistedDeclarationIds(x).forEach(id => {
      this.handler.Declare(id, x)
    });
  }
  
  FunctionEnd(x:AST.BaseFunction) {
    let block = VariableVisitorUtil.getFunctionBlock(x);
    this.handler.BlockEnd(block);
    this.handler.FunctionEnd(x);
  }

  //Declarations      
  ForLoop(x:AST.ForStatement|AST.ForInStatement|AST.ForOfStatement, v:Visitor) {
    let block = VariableVisitorUtil.getForLoopBlock(x);
    this.handler.Block(block);
    if (!AST.isForStatement(x)) {
      if (!AST.isVariableDeclaration(x.left)) {
        VariableVisitorUtil.readPatternIds(x.left).forEach(id => {
          this.handler.Write(id, x);
        })
      } else {
        //Ensure init vars are declared before descent
        VariableVisitorUtil.readDeclarationIds(x.left.declarations)
          .forEach(id => this.handler.Declare(id, x)); 
      }
    } else if (AST.isVariableDeclaration(x.init)) {
      //Ensure init vars are declared before descent
      VariableVisitorUtil.readDeclarationIds(x.init.declarations)
        .forEach(id => this.handler.Declare(id, x));
    }
  }

  ForLoopEnd(x:AST.ForStatement|AST.ForInStatement|AST.ForOfStatement, v:Visitor)  {
    let block = VariableVisitorUtil.getForLoopBlock(x);
    this.handler.BlockEnd(block);
  }
  
  BlockStatement(x:AST.BlockStatement, v:Visitor) {
    let cont = v.parent.container as AST.Node;
    if (!AST.isFunction(cont) && !AST.isForLoop(cont) && !AST.isCatchClause(cont)) {
      this.handler.Block(x);
    }
  }

  BlockStatementEnd(x:AST.BlockStatement, v:Visitor) {
    let cont = v.parent.container as AST.Node;
    if (!AST.isFunction(cont) && !AST.isForLoop(cont) && !AST.isCatchClause(cont)) {
      this.handler.BlockEnd(x);
    }
  }

  VariableDeclaration(x:AST.VariableDeclaration) {
    VariableVisitorUtil.readDeclarationIds(x.declarations)
      .forEach(id => 
        x.kind === 'var' ? 
          this.handler.Write(id,x) : //var, post-hoist, is just an assign
          this.handler.Declare(id, x)
      );
  }

  ClassDeclaration(x:AST.ClassDeclaration) {        
    this.handler.Declare(x.id, x);
  }

  CatchClause(x:AST.CatchClause) {
    this.handler.Block(x.body);

    VariableVisitorUtil.readPatternIds(x.param).forEach(i => {
      this.handler.Declare(i, x.param);
    })
  }

  CatchClauseEnd(x:AST.CatchClause) {
    this.handler.BlockEnd(x.body);
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
    this.handler.ThisAccess(x);
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

      this.handler.PropertyAccess(chain, x);
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
      this.handler.Access(x, pnode);
    }
  }
}