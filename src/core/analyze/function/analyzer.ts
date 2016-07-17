import { ParseUtil, AST } from '../../../../node_modules/@arcsine/ecma-ast-transform/src';
import { Analysis, Analyzable, AccessType } from './types';
import { md5 } from './md5';
import {VariableVisitor, VariableStack} from '../variable';
import {Util} from '../../util';


export class FunctionAnalyzer {
  
  private static keyCache:{[key:string]:string} = {};
  private static analyzed:{[key:string]:Analysis} = {};
  private static id:number = 0;

  static analyzeAST(ast:AST.BaseFunction, globals?:any):Analysis {
    let analysis = new Analysis(`${FunctionAnalyzer.id++}`);
    analysis.globals = globals || Util.global

    let stack = new VariableStack();

    let checkClosed = (name:AST.Identifier, access:AccessType) => {
      if (!stack.contains(name) && !analysis.globals[name.name]) {        
        analysis.closed[name.name] = (analysis.closed[name.name] || 0) | access;
      }
    }

    VariableVisitor.visit({
      onComputedAccess : (name:AST.Identifier) => {
        analysis.hasComputedMemberAccess = true;
      },
      onAccess : (name:AST.Identifier, node:AST.Node) => {
        if (name.name !== 'this') {
          checkClosed(name, AccessType.ACCESS)
        }
        if (AST.isMemberExpression(node)) {
          analysis.hasMemberAccess = true;
        }
      },
      onWrite : (name:AST.Identifier) => {
        checkClosed(name, AccessType.WRITE)
      },
      onInvoke : (name:AST.Identifier) => {
        checkClosed(name, AccessType.INVOKE)
        analysis.hasInvocation = true;
      },
    }, ast, stack)

    return analysis;
  }

  static analyze(fn:Function, globals?:any):Analysis {
    let src = fn.toString();
    let check = FunctionAnalyzer.keyCache[src]
    if (!check) {
      check = md5(fn.toString());
      FunctionAnalyzer.keyCache[src] = check;
    }
        
    let analysis = FunctionAnalyzer.analyzed[check];

    if (analysis) { //return if already computed
      return analysis;
    } 

    let ast:AST.BaseFunction = ParseUtil.parse(fn.toString());
    analysis = FunctionAnalyzer.analyzeAST(ast, globals);

    analysis.check = check;
    FunctionAnalyzer.analyzed[check] = analysis;
    return analysis;    
  }
}