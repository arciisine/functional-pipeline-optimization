import { Util, AST } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import { Analysis, Analyzable, AccessType } from './types';
import { md5 } from './md5';
import {VariableVisitor} from './variable';


export class FunctionAnalyzer {
  
  private static analyzed:{[key:string]:Analysis} = {};
  private static id:number = 0;

  static analyzeAST(ast:AST.BaseFunction, globals?:any):Analysis {
    let analysis = new Analysis(`${FunctionAnalyzer.id++}`);
    analysis.globals = globals || {};

    let scope = [{}];
    let top = scope[0]

    let checkClose = (name:string, level:AccessType) => {
      if (!!top[name]) analysis.closed[name] = (analysis.closed[name]  || 0) | level;
    }

    let nest = () => {
      let out = {};
      for (var k in top) {
        out[k] = top[k];
      }
      scope.push(top = out);
    }

    let denest = () => {
      scope.pop() 
      top = scope[scope.length-1];
    }    

    VariableVisitor.visit({
      onBlockStart : nest,
      onBlockEnd : denest,
      onDeclare : name => {
        top[name] = true;
      },
      onAccess : (name, node:AST.Node) => {        
        if (name === 'this') {
          analysis.hasThisExpression = true;
        } else {
          checkClose(name, AccessType.ACCESS)
        }
        if (AST.isMemberExpression(node)) {
          analysis.hasMemberExpression = true;
        }
      },
      onWrite : name => {
        checkClose(name, AccessType.WRITE)
      },
      onInvoke : (name, node) => {
        checkClose(name, AccessType.INVOKE)
        if (AST.isNewExpression(node)) {
          analysis.hasNewExpression = true;
        }
      },
    }, ast)

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