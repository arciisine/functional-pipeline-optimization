import { Util, AST, Visitor } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import { Analysis, Analyzable, AccessType } from './types';
import { md5 } from './md5';

export class FunctionAnalyzer {
  
  private static analyzed:{[key:string]:Analysis} = {};
  private static id:number = 0;

  static getVariableName(p:AST.Node):string { 
      while (AST.isMemberExpression(p)) {
        p = (p as AST.MemberExpression).object
    }

    if (AST.isVariableDeclarator(p)) {
      let id = p.id;
      return AST.isIdentifier(id) ? id.name : null;
    } else if (AST.isThisExpression(p)) {
      return 'this';
    } else if (AST.isIdentifier(p)) {
      return p.name;
    }
    return null;
  }

  static processVariableDeclarations(analysis:Analysis, ds:AST.Pattern[]) {
    let {declared} = analysis;
    
    ds.forEach(p => { 
      let id = FunctionAnalyzer.getVariableName(p); 
      declared[id] = true;
    });
  }

  static processVariableSite(analysis:Analysis, node:AST.Node|string, type:AccessType) {
    let {globals, closed, declared} = analysis;

    analysis.all = (analysis.all || 0) | type;  

    let id = typeof node === 'string' ? node : FunctionAnalyzer.getVariableName(node);
    if (id && !declared[id] && !globals[id]) { //If access before read and not global
      closed[id] = (closed[id] || 0) | type;  
    }
  } 

  static findVarDeclarations(analysis:Analysis, node:AST.Node) {
    //Hoist vars, remove nested functions
    new Visitor({
      FunctionStart : (x:AST.BaseFunction) => {
        //Ignore sub children
        analysis.hasNestedFunction = true;
        x[Visitor.SKIP_FLAG] = true; //Do not process
      },
      VariableDeclaration : (x:AST.VariableDeclaration) => {
        if (x.kind === 'var') FunctionAnalyzer.processVariableDeclarations(analysis, x.declarations);
      }
    }).exec(node);
  }

  static findVariableSites(analysis:Analysis, node:AST.Node) {

    //Find all variable usages
    new Visitor({
      FunctionStart : (x:AST.BaseFunction) => x[Visitor.SKIP_FLAG] = true, //Do not process

      VariableDeclaration : (x:AST.VariableDeclaration) => {
        if (x.kind !== 'var') FunctionAnalyzer.processVariableDeclarations(analysis, x.declarations);
      },

      //Handle reads
      MemberExpression : (x:AST.MemberExpression) => {
        analysis.hasMemberExpression = true;
        let obj = x.object;
        if (AST.isIdentifier(obj)) {
          FunctionAnalyzer.processVariableSite(analysis, obj, AccessType.READ);
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
        FunctionAnalyzer.processVariableSite(analysis, x.argument, AccessType.WRITE);
      },

      AssignmentExpression : (x:AST.AssignmentExpression) => {
        FunctionAnalyzer.processVariableSite(analysis, x.left, AccessType.WRITE);
      },

      //Handle invocation
      CallExpression : (x:AST.CallExpression) => {
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

  static analyzeAST(ast:AST.BaseFunction, globals?:any):Analysis {
    let analysis = new Analysis(`${FunctionAnalyzer.id++}`);
    analysis.globals = globals || {};

    FunctionAnalyzer.processVariableDeclarations(analysis, ast.params);
    if (AST.isFunctionDeclaration(ast) || AST.isFunctionExpression(ast) || AST.isArrowFunctionExpression(ast)) {
      FunctionAnalyzer.findVarDeclarations(analysis, ast.body);
      FunctionAnalyzer.findVariableSites(analysis, ast.body);
    }

    return analysis;
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

    let ast:AST.BaseFunction = Util.parse(src);
    analysis = FunctionAnalyzer.analyzeAST(ast, globals);
    analysis.check = check;
    FunctionAnalyzer.analyzed[check] = analysis;
    return analysis;    
  }
}