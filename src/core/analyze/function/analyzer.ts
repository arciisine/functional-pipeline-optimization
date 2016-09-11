import { ParseUtil, AST, Visitor, Macro as m} from '../../../../node_modules/@arcsine/ecma-ast-transform/src';
import { Analysis, AccessType } from './types';
import {VariableStack, VariableNodeHandler} from '../variable';
import {Util, GLOBALS} from '../../util';


export class FunctionAnalyzer {
  
  private static keyCache:{[key:string]:string} = {};
  private static analyzed:{[key:string]:Analysis} = {};
  private static id:number = 0;

  static analyzeAST(ast:AST.BaseFunction, globals?:string[]|{[key:string]:any}):Analysis {
    if (!AST.isFunction(ast)) {
      return null;
    }
    let analysis = new Analysis(`${FunctionAnalyzer.id++}`);
    if (Array.isArray(globals)) {
      analysis.globals = globals.reduce((acc, x) => acc[x] = true && acc, {});
    } else {
      analysis.globals = globals || {};
    }

    let stack = new VariableStack();

    let checkClosed = (name:AST.Identifier, access:AccessType) => {
      if (!stack.contains(name) && !analysis.globals[name.name]) {        
        analysis.closed[name.name] = (analysis.closed[name.name] || 0) | access;
      }
    }

    let handler = new VariableNodeHandler({
      ComputedAccess : (name:AST.Identifier) => {
        analysis.hasComputedMemberAccess = true;
      },
      PropertyAccess : (chain:AST.Identifier[], node:AST.Node) =>{
        
        let resolved = null

        //Check vm globals
        if (!resolved) {
          resolved = chain.reduce((o, p) => o ? o[p.name] : null, GLOBALS);
        }

        //Check supplied globals
        if (!resolved) {
          resolved = chain.reduce((o, p) => o ? o[p.name] : null, analysis.globals);
        }        

        if (resolved) {
          analysis.globals[chain[0].name] = true;
        }
      },
      Access : (name:AST.Identifier, node:AST.Node) => {
        checkClosed(name, AccessType.ACCESS)

        if (AST.isMemberExpression(node)) {
          analysis.hasMemberAccess = true;
        }
      },
      ThisAccess : (node:AST.ThisExpression) => {
        analysis.hasThisReference = true;
      },
      Write : (name:AST.Identifier, node:AST.Node) => {
        checkClosed(name, AST.isIdentifier(node) ? AccessType.ASSIGN : AccessType.WRITE)
      },
      Invoke : (name:AST.Identifier) => {
        checkClosed(name, AccessType.INVOKE)
        analysis.hasInvocation = true;
      },
    }, stack);

    Visitor.exec(handler, ast)

    return analysis;
  }

  static analyze(fn:Function, globals?:any):Analysis {
    let key = Function.getKey(fn);
    let analysis = FunctionAnalyzer.analyzed[key];
    if (analysis) {
      return analysis;
    }

    let input = fn.toString();

    let ast:AST.BaseFunction = ParseUtil.parse(input);
    analysis = FunctionAnalyzer.analyzeAST(ast, globals);

    if (key) {
      FunctionAnalyzer.analyzed[key] = analysis;
    }
    return analysis;    
  }
}