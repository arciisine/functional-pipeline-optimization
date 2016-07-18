import { ParseUtil, AST, Visitor } from '../../../../node_modules/@arcsine/ecma-ast-transform/src';
import { Analysis, Analyzable, AccessType } from './types';
import {VariableStack, VariableNodeHandler} from '../variable';
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

    let handler = new VariableNodeHandler({
      ComputedAccess : (name:AST.Identifier) => {
        analysis.hasComputedMemberAccess = true;
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
      Write : (name:AST.Identifier) => {
        checkClosed(name, AccessType.WRITE)
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
    let ret = FunctionAnalyzer.analyzed[fn.key];
    if (ret) return ret

    let src = fn.toString();        
    let analysis = FunctionAnalyzer.analyzed[fn.key];

    if (analysis) { //return if already computed
      return analysis;
    } 

    let ast:AST.BaseFunction = ParseUtil.parse(fn.toString());
    analysis = FunctionAnalyzer.analyzeAST(ast, globals);

    analysis.check = fn.key;
    FunctionAnalyzer.analyzed[fn.key] = analysis;
    return analysis;    
  }
}