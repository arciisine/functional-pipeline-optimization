import { Util, AST, Visitor } from '../../node_modules/@arcsine/ecma-ast-transform/src';
import { TransformLevel, Transformable, TransformTag } from './types';
import { md5 } from './md5';

enum AccessType {
  NONE, READ, WRITE, INVOKE
}

export class Analyzer {
  private static tagged:{[key:string]:TransformTag} = {};
  private static id:number = 0;

  static readVariable(p:AST.Pattern):string { 
    while (p.type === 'MemberExpression') {
      p = (p as AST.MemberExpression).object;
    }
    switch (p.type) {
      case 'VariableDeclarator': return (p as AST.VariableDeclarator).id['name'];
      case 'ThisExpression': return 'this';
      case 'Identifier': return (p as AST.Identifier).name;
      default: return null;
    }
  }

  static findClosedVariables(fn:Function, globals:any = {}) {

    let ast:AST.ASTFunction = Util.parse(fn);

    let res:{[key:string]:AccessType} = {};
    let declared:{} = {};
    let hasNested = false;
    let hasExpression = false;

    let init = (ds:AST.Pattern[]) => {
      ds.forEach(p => { 
        let id = Analyzer.readVariable(p); 
        declared[id] = true;
      });
    }

    let processVariableSite = (node:AST.Node|string, type:AccessType) =>  {
      let id = typeof node === 'string' ? node : Analyzer.readVariable(node);
      if (id && !declared[id] && !globals[id]) { //If access before read and not global
        res[id] = Math.max(res[id] || 0, type);  
      }
    }    
    init(ast['params'] as AST.Pattern[]);

    //Hoist vars, remove nested functions
    let body = new Visitor({
      FunctionStart : (x:AST.ASTFunction) => {
        //Ignore sub children
        hasNested = true;
        return false; //Do not process
      },
      VariableDeclaration : (x:AST.VariableDeclaration) => {
        if (x.kind === 'var') init(x.declarations);
      }
    }).exec(ast['body']);

    //Find all variable usages
    new Visitor({
      FunctionStart : (x:AST.ASTFunction) => false, //Do not process

      VariableDeclaration : (x:AST.VariableDeclaration) => {
        if (x.kind !== 'var') init(x.declarations);
      },

      //Handle reads/property access
      MemberExpressionStart : (x:AST.MemberExpression) => {
        hasExpression = true;
        //If top level expression
        if (x.object.type === 'Identifier') {
          processVariableSite(x.object, AccessType.READ);
        }
      },

      //Handle assignment
      UpdateExpression : (x:AST.UpdateExpression) => {
        processVariableSite(x.argument, AccessType.WRITE);
      },

      AssignmentExpression : (x:AST.AssignmentExpression) => {
        processVariableSite(x.left, AccessType.WRITE);
      },

      BinaryExpression : (x:AST.BinaryExpression) => {
        processVariableSite(x.left, AccessType.READ);
        processVariableSite(x.right, AccessType.READ);
      },

      UnaryExpression : (x:AST.UnaryExpression) => {
        processVariableSite(x.argument, AccessType.READ);
      },

      LogicalExpression : (x:AST.LogicalExpression) => {
        processVariableSite(x.left, AccessType.READ);
        processVariableSite(x.right, AccessType.READ);
      },

      //Handle invocation
      CallExpression : (x:AST.CallExpression) => {
        processVariableSite(x.callee, AccessType.INVOKE);
      },

      Identifier : (x:AST.Identifier) => {
        //Do nothing, handled in expression checking
      }
    }).exec(body);

    return res;
  }

  static getFunctionTag(el:Function):TransformTag {
    //Try to lookup remaining information
    let checksum = md5(el.toString());
    let tag = Analyzer.tagged[checksum]; 
    if (!tag) {
      tag = {
        key : `${Analyzer.id++}`,
        check : checksum,
        closed : Analyzer.findClosedVariables(el),
      };
      tag.level = 0;//Compute level from closed variables
      Analyzer.tagged[checksum] = tag;
    }      
    return tag;
  }

  static mergeTags(tag:TransformTag, i:{tag?:TransformTag}) {
    tag.key += "|" +  i.tag.key;
    tag.level = Math.min(tag.level, i.tag.level);
    return tag;
  }

  static getTransformableTag<I, O, T extends Transformable<I,O>>(el:T):TransformTag {
    return el.callbacks.reduce(Analyzer.mergeTags, {
      key : "~",
      level : TransformLevel.NO_DEPENDENCE,
    });
  }

  static tag<I, O, T extends Transformable<I,O>>(el:T):T {
    el.callbacks.forEach(x => x.tag = Analyzer.getFunctionTag(x))
    el.tag = Analyzer.getTransformableTag(el);
    return el;
  }
}