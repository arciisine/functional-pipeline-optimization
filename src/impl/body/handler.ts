import {AST, ParseUtil, CompileUtil, Macro as m, Visitor } from '@arcsine/ecma-ast-transform/src';
import {MAPPING as supported} from '../array/transform';
import {FunctionAnalyzer, AccessType, Analysis, VariableVisitorUtil} from '../../core';
import {BodyTransformUtil} from './util';
import {
  OptimizeState, SYMBOL,
  EXEC, CANDIDATE, CANDIDATE_FUNCTIONS, CANDIDATE_KEY,
  CANDIDATE_RELATED, CANDIDATE_START, ANALYSIS
} from './types';

//Function wrappers
export class BodyTransformHandler {

  static transform(content:string) {
    let body = ParseUtil.parseProgram<AST.Node>(content);
    Visitor.exec(new BodyTransformHandler(body), body);
    let source = CompileUtil.compileExpression(body);
    return source;
  }

  optimizeScopes:OptimizeState[] = []
  thisScopes:(AST.FunctionDeclaration|AST.FunctionExpression)[] = [];
  functionScopes:AST.BaseFunction[] = [];

  optimizeScope:OptimizeState = {active:false};

  constructor(block:AST.Program) {
    this.OptimizeScopeOpen(block);
  }

  OptimizeScopeOpen(node:AST.BlockStatement|AST.BaseFunction|AST.Program) {
    let block = AST.isFunction(node) ?  VariableVisitorUtil.getFunctionBlock(node) : node; 
    this.optimizeScope =  BodyTransformUtil.parsePragma(block) || this.optimizeScope;
    this.optimizeScopes.push(this.optimizeScope)
    if (AST.isFunction(node)) {
      this.functionScopes.push(node);
      if (this.optimizeScope.active && (AST.isFunctionExpression(node) || AST.isFunctionDeclaration(node))) {
        this.thisScopes.push(node);
      }
    }

    return node;
  }

  OptimizeScopeClose(node:AST.BlockStatement|AST.BaseFunction) {
    this.optimizeScopes.pop();
    this.optimizeScope = this.optimizeScopes[this.optimizeScopes.length -1];      
    this.functionScopes.pop();

    if (this.thisScopes.length && node === this.thisScopes[this.thisScopes.length-1]) {
      this.thisScopes.pop();
    }

    return node;
  }

  Function(x:AST.BaseFunction) {
    return this.OptimizeScopeOpen(x);
  }

  FunctionEnd(x:AST.BaseFunction) {
    return this.OptimizeScopeClose(x);
  }

  BlockStatementEnd(x:AST.BlockStatement) {
    if (x['_this']) {
      x.body.unshift(m.Vars(x['_this'], AST.ThisExpression({})));
      delete x['_this']
    }
  }

  ThisExpressionEnd(x:AST.ThisExpression, v:Visitor) {
    let fnScope = this.functionScopes[this.functionScopes.length-1]; 
    if (this.optimizeScope.active && AST.isArrowFunctionExpression(fnScope))  {
      let body  = this.thisScopes[this.thisScopes.length-1].body;
      let id:AST.Identifier = null;

      if (body['_this']) {
        id = body['_this'];
      } else {
        id = m.Id()
        body['_this'] = id;
      }

      return m.Id(id.name);
    } else {
      return x;
    }
  }

  CallExpression(x : AST.CallExpression, visitor:Visitor) {
    if (!this.optimizeScope.active) return;
    
    let callee = x.callee;
    if (AST.isMemberExpression(callee)) {
      if (AST.isIdentifier(callee.property) && supported[callee.property.name] && x.arguments.length > 0) {
        x[CANDIDATE] = true; //Mark call as candidate
        callee[CANDIDATE_RELATED] = true;
        //At end
        if (!visitor.parent.node[CANDIDATE_RELATED]) {
          x[CANDIDATE_FUNCTIONS] = [];
        }
      }
    }
  }

  CallExpressionEnd(x : AST.CallExpression, visitor:Visitor) {
    if (!x[CANDIDATE]) return;

    BodyTransformUtil.renameExpressions(x);
      
    let endNode = x[CANDIDATE_FUNCTIONS] ? 
      x : 
      visitor.findParent(x => !!x.node[CANDIDATE_FUNCTIONS]).node as AST.CallExpression;

    //Check for start of chain
    let callee = x.callee;
    if (AST.isMemberExpression(callee) && BodyTransformUtil.isChainStart(callee)) {
       endNode[CANDIDATE_START] = callee;
    }

    //Check end of chain
    if (!x[CANDIDATE_FUNCTIONS]) {
      endNode[CANDIDATE_FUNCTIONS].push(x);
    } else {
      x[CANDIDATE_FUNCTIONS].push(x); //All in order now

      let ops = [];
      let inputs = [];

      x[CANDIDATE_FUNCTIONS].forEach((x:AST.CallExpression) => {
        let name = (
          AST.isMemberExpression(x.callee) && 
          AST.isIdentifier(x.callee.property) && 
          x.callee.property.name
        );

        ops.push(
          m.Array(
            m.Literal(name), 
            BodyTransformUtil.buildVariableState(x.arguments, this.functionScopes)
          )
        );
        inputs.push(AST.ArrayExpression({ elements : x.arguments }))
      });      

      if (ops.length === 1) {
        let name = ops[0].elements[0].value
        //Don't optimize single chains of slice/join 
        if (name === 'slice' || name === 'join') {
          return;
        }
      }
  
      //Only process the inline callbacks
      let analysis = x[CANDIDATE_FUNCTIONS]
        .map(x => AST.isCallExpression(x) && AST.isFunction(x.arguments[0]) ? x.arguments[0] : x)
        .map(x => FunctionAnalyzer.analyzeAST(x, this.optimizeScope.globals))
        .filter(x => !!x)
        .reduce((total:Analysis, x) => total.merge(x), new Analysis("~"))

      let params = BodyTransformUtil.getExecArguments(x, analysis);

      let root = visitor.parents[visitor.parents.length-1].node;

      let opsId = m.Id();

      if (AST.isProgram(root)) {
        root.body.push(m.Vars('const', opsId, m.Array(...ops)))
      }

      let extra = [];
      if (params.closed) {
        extra.push(params.closed);
        if (params.assign) {
          extra.push(params.assign);
        }
      }

      return m.Call(EXEC,  
          (x[CANDIDATE_START] as AST.MemberExpression).object,
          m.Literal(m.Id('__key', true).name),
          opsId,
          m.Array(...inputs),
          ...extra
      );
    }
  }
}