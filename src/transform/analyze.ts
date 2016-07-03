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
    if (p.type === 'ThisExpression') {
      return 'this';
    } else if (p.type === "Identifier") {
      return (p as AST.Identifier).name;
    } else {
      return null;
    }
  }

  static findClosedVariables(fn:Function, globals:any = {}) {

    let ast:AST.ASTFunction = Util.parse(fn);

    let res:{[key:string]:AccessType} = {};
    let declared:{};
    let hasNested = false;
    let hasExpression = false;

    let init = (ds:AST.VariableDeclaration, kinds:{[key:string]:boolean}) => {
      if (kinds[ds.kind]) {
        ds.declarations.forEach(p => { 
          let id = Analyzer.readVariable(p); 
          declared[id] = true;
        });
      }
      return ds;
    }

    let processVariableSite = (node:AST.Node|string, type:AccessType) =>  {
      let id = typeof node === 'string' ? node : Analyzer.readVariable(node);
      if (!declared[id] && !globals[id]) { //If access before read and not global
        res[id] = Math.max(res[id] || 0, type);  
      }
    }

    //Hoist vars, remove nested functions
    ast = new Visitor({
      FunctionStart : (x:AST.ASTFunction) => {
        //Ignore sub children
        hasNested = true;
        return false; //Do not process
      },
      VariableDeclaration : (x:AST.VariableDeclaration) => init(x, {'var':true})
    }).exec(ast);

    //Find all variable usages
    new Visitor({
      FunctionStart : (x:AST.ASTFunction) => false, //Do not process

      VariableDeclaration : (x:AST.VariableDeclaration) => init(x, {'const':true, 'let':true}),

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

      //Handle invocation
      CallExpression : (x:AST.CallExpression) => {
        processVariableSite(x.callee, AccessType.INVOKE);
      }
    }).exec(ast);
    
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