import { Util, AST, Visitor } from '../../node_modules/@arcsine/ecma-ast-transform/src';
import { Transformable, Analysis, Analyzable, AccessType } from './types';
import { md5 } from './md5';

declare var global, window;

const ANALYSIS_BOOLEAN_FIELDS = [
  'Assignment', 'NestedFunction', 'ThisExpression', 'MemberExpression', 'CallExpression', 'NewExpression'
];

export class Analyzer {
  private static analyzed:{[key:string]:Analysis} = {};
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

  static getFunctionAnalysis(fn:Function, globals?:any):Analysis {
    let src = fn.toString();
    let check = md5(src);
    let analysis = Analyzer.analyzed[check];

    if (analysis) { //return if already computed
      return analysis;
    } 

    let ast:AST.ASTFunction = Util.parse(src.startsWith('function') ? src : `function ${src}`);

    let closed:{[key:string]:AccessType} = {};
    let declared:{} = {};

    let hasNestedFunction = false;
    let hasMemberExpression = false;
    let hasThisExpression = false;
    let hasCallExpression = false;
    let hasAssignment = false;
    let hasNewExpression = false;

    globals = globals || {};

    let init = (ds:AST.Pattern[]) => {
      ds.forEach(p => { 
        let id = Analyzer.readVariable(p); 
        declared[id] = true;
      });
    }

    let processVariableSite = (node:AST.Node|string, type:AccessType) =>  {
      let id = typeof node === 'string' ? node : Analyzer.readVariable(node);
      if (id && !declared[id] && !globals[id]) { //If access before read and not global
        closed[id] = Math.max(closed[id] || 0, type);  
      }
    }  

    init(ast.params);

    //Hoist vars, remove nested functions
    let body = new Visitor({
      FunctionStart : (x:AST.ASTFunction) => {
        //Ignore sub children
        hasNestedFunction = true;
        return false; //Do not process
      },
      VariableDeclaration : (x:AST.VariableDeclaration) => {
        if (x.kind === 'var') init(x.declarations);
      }
    }).exec(ast.body);

    //Find all variable usages
    new Visitor({
      FunctionStart : (x:AST.ASTFunction) => false, //Do not process

      VariableDeclaration : (x:AST.VariableDeclaration) => {
        if (x.kind !== 'var') init(x.declarations);
      },

      //Handle reads
      MemberExpression : (x:AST.MemberExpression) => {
        hasMemberExpression = true;
        if (x.object.type === 'Identifier') {
          processVariableSite(x.object, AccessType.READ);
        }          
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

      //Handle assignment
      UpdateExpression : (x:AST.UpdateExpression) => {
        hasAssignment = true;
        processVariableSite(x.argument, AccessType.WRITE);
      },

      AssignmentExpression : (x:AST.AssignmentExpression) => {
        hasAssignment = true;
        processVariableSite(x.left, AccessType.WRITE);
      },

      //Handle invocation
      CallExpression : (x:AST.CallExpression) => {
        hasCallExpression = true;
        processVariableSite(x.callee, AccessType.INVOKE);
      },

      //New
      NewExpression : (x:AST.NewExpression) => {
        hasNewExpression = true;
        processVariableSite(x.callee, AccessType.INVOKE);
      },

      //This
      ThisExpression : (x:AST.ThisExpression) => {
        hasThisExpression = true;
      },

      Identifier : (x:AST.Identifier) => {
        //Do nothing, handled in expression checking
      }
    }).exec(body);

    return {
      key : `${Analyzer.id++}`,
      check,
      closed,
      hasAssignment,
      hasCallExpression,
      hasThisExpression,
      hasNestedFunction,
      hasNewExpression,
      hasMemberExpression
    };
  }

  static mergeAnalyses(i:Analyzable, o:Analyzable) {
    let ia = i.analysis;
    let oa = o.analysis;

    ia.key += "|" +  oa.key;
    for (let key of ANALYSIS_BOOLEAN_FIELDS) {
      ia[key] = ia[key] || oa[key];
    }
    return i;
  }

  static analyze<I, O, T extends Transformable<I,O>>(el:T):T {
    el.callbacks.forEach(x => x.analysis = Analyzer.getFunctionAnalysis(x))
    el.callbacks.reduce(Analyzer.mergeAnalyses, { analysis : { key : "~" }})
    return el;
  }
}