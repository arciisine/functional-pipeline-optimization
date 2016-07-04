import { Util, AST, Visitor } from '../../node_modules/@arcsine/ecma-ast-transform/src';
import { Analysis, Analyzable, AccessType } from './types';
import { md5 } from './md5';

declare var global, window;

export class FunctionAnalyzer {
  
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
      let id = FunctionAnalyzer.getVariableName(p); 
      analysis.declared[id] = true;
    });
  }

  static processVariableSite(analysis:Analysis, node:AST.Node|string, type:AccessType) {
    let {globals, closed, declared} = analysis;

    let id = typeof node === 'string' ? node : FunctionAnalyzer.getVariableName(node);
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
        if (x.kind === 'var') FunctionAnalyzer.processVariableDeclarations(analysis, x.declarations);
      }
    }).exec(node);
  }

  static findVariableSites(analysis:Analysis, node:AST.Node) {

    //Find all variable usages
    new Visitor({
      FunctionStart : (x:AST.ASTFunction) => false, //Do not process

      VariableDeclaration : (x:AST.VariableDeclaration) => {
        if (x.kind !== 'var') FunctionAnalyzer.processVariableDeclarations(analysis, x.declarations);
      },

      //Handle reads
      MemberExpression : (x:AST.MemberExpression) => {
        analysis.hasMemberExpression = true;
        if (x.object.type === 'Identifier') {
          FunctionAnalyzer.processVariableSite(analysis, x.object, AccessType.READ);
        }          
      },

      BinaryExpression : (x:AST.BinaryExpression) => {
        FunctionAnalyzer.processVariableSite(analysis, x.left, AccessType.READ);
        FunctionAnalyzer.processVariableSite(analysis, x.right, AccessType.READ);
      },

      UnaryExpression : (x:AST.UnaryExpression) => {
        FunctionAnalyzer.processVariableSite(analysis, x.argument, AccessType.READ);
      },

      LogicalExpression : (x:AST.LogicalExpression) => {
        FunctionAnalyzer.processVariableSite(analysis, x.left, AccessType.READ);
        FunctionAnalyzer.processVariableSite(analysis, x.right, AccessType.READ);
      },

      //Handle assignment
      UpdateExpression : (x:AST.UpdateExpression) => {
        analysis.hasAssignment = true;
        FunctionAnalyzer.processVariableSite(analysis, x.argument, AccessType.WRITE);
      },

      AssignmentExpression : (x:AST.AssignmentExpression) => {
        analysis.hasAssignment = true;
        FunctionAnalyzer.processVariableSite(analysis, x.left, AccessType.WRITE);
      },

      //Handle invocation
      CallExpression : (x:AST.CallExpression) => {
        analysis.hasCallExpression = true;
        FunctionAnalyzer.processVariableSite(analysis, x.callee, AccessType.INVOKE);
      },

      //New
      NewExpression : (x:AST.NewExpression) => {
        analysis.hasNewExpression = true;
        FunctionAnalyzer.processVariableSite(analysis, x.callee, AccessType.INVOKE);
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

  static analyze(fn:Function, globals?:any):Analysis {
    let src = fn.toString();
    let check = md5(src);
    let analysis = FunctionAnalyzer.analyzed[check];

    if (analysis) { //return if already computed
      return analysis;
    } 

    //Handle class static methods
    src = /^[A-Za-z0-9_$ ]+\(/.test(src) ? `function ${src}` : src

    let ast:AST.ASTFunction = Util.parse(src);

    analysis = new Analysis(`${FunctionAnalyzer.id++}`);
    analysis.check = check;
    analysis.globals = globals || {};

    FunctionAnalyzer.processVariableDeclarations(analysis, ast.params);
    FunctionAnalyzer.findVarDeclarations(analysis, ast.body);
    FunctionAnalyzer.findVariableSites(analysis, ast.body);

    FunctionAnalyzer.analyzed[check] = analysis;

    return analysis;
  }
}