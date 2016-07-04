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

  static getVariableName(p:AST.Node):string { 
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

  static processVariableDeclarations(analysis:Analysis, ds:AST.Pattern[]) {
    let {declared} = analysis;
    
    ds.forEach(p => { 
      let id = Analyzer.getVariableName(p); 
      analysis.declared[id] = true;
    });
  }

  static processVariableSite(analysis:Analysis, node:AST.Node|string, type:AccessType) {
    let {globals, closed, declared} = analysis;

    let id = typeof node === 'string' ? node : Analyzer.getVariableName(node);
    if (id && !declared[id] && !globals[id]) { //If access before read and not global
      closed[id] = Math.max(closed[id] || 0, type);  
    }
  }  

  static findVarDeclarations(analysis:Analysis, node:AST.Node) {
    //Hoist vars, remove nested functions
    new Visitor({
      FunctionStart : (x:AST.ASTFunction) => {
        //Ignore sub children
        analysis.hasNestedFunction = true;
        return false; //Do not process
      },
      VariableDeclaration : (x:AST.VariableDeclaration) => {
        if (x.kind === 'var') Analyzer.processVariableDeclarations(analysis, x.declarations);
      }
    }).exec(node);
  }

  static findVariableSites(analysis:Analysis, node:AST.Node) {

    //Find all variable usages
    new Visitor({
      FunctionStart : (x:AST.ASTFunction) => false, //Do not process

      VariableDeclaration : (x:AST.VariableDeclaration) => {
        if (x.kind !== 'var') Analyzer.processVariableDeclarations(analysis, x.declarations);
      },

      //Handle reads
      MemberExpression : (x:AST.MemberExpression) => {
        analysis.hasMemberExpression = true;
        if (x.object.type === 'Identifier') {
          Analyzer.processVariableSite(analysis, x.object, AccessType.READ);
        }          
      },

      BinaryExpression : (x:AST.BinaryExpression) => {
        Analyzer.processVariableSite(analysis, x.left, AccessType.READ);
        Analyzer.processVariableSite(analysis, x.right, AccessType.READ);
      },

      UnaryExpression : (x:AST.UnaryExpression) => {
        Analyzer.processVariableSite(analysis, x.argument, AccessType.READ);
      },

      LogicalExpression : (x:AST.LogicalExpression) => {
        Analyzer.processVariableSite(analysis, x.left, AccessType.READ);
        Analyzer.processVariableSite(analysis, x.right, AccessType.READ);
      },

      //Handle assignment
      UpdateExpression : (x:AST.UpdateExpression) => {
        analysis.hasAssignment = true;
        Analyzer.processVariableSite(analysis, x.argument, AccessType.WRITE);
      },

      AssignmentExpression : (x:AST.AssignmentExpression) => {
        analysis.hasAssignment = true;
        Analyzer.processVariableSite(analysis, x.left, AccessType.WRITE);
      },

      //Handle invocation
      CallExpression : (x:AST.CallExpression) => {
        analysis.hasCallExpression = true;
        Analyzer.processVariableSite(analysis, x.callee, AccessType.INVOKE);
      },

      //New
      NewExpression : (x:AST.NewExpression) => {
        analysis.hasNewExpression = true;
        Analyzer.processVariableSite(analysis, x.callee, AccessType.INVOKE);
      },

      //This
      ThisExpression : (x:AST.ThisExpression) => {
        analysis.hasThisExpression = true;
      },

      Identifier : (x:AST.Identifier) => {
        //Do nothing, handled in expression checking
      }
    }).exec(node);
  }

  static getFunctionAnalysis(fn:Function, globals?:any):Analysis {
    let src = fn.toString();
    let check = md5(src);
    let analysis = Analyzer.analyzed[check];

    if (analysis) { //return if already computed
      return analysis;
    } 

    //Handle class static methods
    src = /^[A-Za-z0-9_$ ]+\(/.test(src) ? `function ${src}` : src

    let ast:AST.ASTFunction = Util.parse(src);

    analysis = {
      key : `${Analyzer.id++}`,
      check,
      closed : {},
      declared : {},
      globals : globals || {}
    }

    Analyzer.processVariableDeclarations(analysis, ast.params);
    Analyzer.findVarDeclarations(analysis, ast.body);
    Analyzer.findVariableSites(analysis, ast.body);

    Analyzer.analyzed[check] = analysis;

    return analysis;
  }

  static mergeAnalyses(i:Analyzable, o:Analyzable) {
    let ia = i.analysis;
    let oa = o.analysis;

    ia.key = `${ia.key}|${oa.key}`;
    ANALYSIS_BOOLEAN_FIELDS
      .forEach(k => { ia[k] = ia[k] || oa[k];})
    return i;
  }

  static analyze<I, O, T extends Transformable<I,O>>(el:T):T {
    el.analysis = { key : "~" };
    el.callbacks.forEach(x => x.analysis = Analyzer.getFunctionAnalysis(x))
    el.callbacks.reduce(Analyzer.mergeAnalyses, el)
    return el;
  }
}