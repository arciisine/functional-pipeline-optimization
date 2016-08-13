import {AST, ParseUtil, CompileUtil, Macro as m, Visitor } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import {SYMBOL} from '../array/bootstrap';
import {MAPPING as supported} from '../array/transform';
import {FunctionAnalyzer, AccessType, Analysis, VariableVisitorUtil} from '../../core';
import {BodyTransformUtil, EXEC, TAG} from './util';

export const CANDIDATE = m.genSymbol();
export const CANDIDATE_START = m.genSymbol();
export const CANDIDATE_FUNCTIONS = m.genSymbol();
export const CANDIDATE_RELATED = m.genSymbol();
export const ANALYSIS = m.genSymbol();
const GLOBAL_ASSIGN = m.Id('_$_')


//Function wrappers
export class BodyTransformHandler {

  static transform(content:string) {
    let body = ParseUtil.parseProgram<AST.Node>(content);
    Visitor.exec(new BodyTransformHandler(BodyTransformUtil.getPragmas(body.body)), body);
    body.body.push(m.Vars(GLOBAL_ASSIGN, null))
    let source = CompileUtil.compileExpression(body);
    return source;
  }

  optimize:boolean[]
  active:boolean;
  thisScopes:(AST.FunctionDeclaration|AST.FunctionExpression)[] = [];
  functionScopes:AST.BaseFunction[] = [];

  constructor(pragmas) {

    this.optimize = [
      pragmas.some(x => x.startsWith('use optimize'))
    ]

    this.active = this.optimize[0]
  }

  Function(x:AST.BaseFunction) {
    let block = VariableVisitorUtil.getFunctionBlock(x);
    let pragmas = BodyTransformUtil.getPragmas(block.body);

    if (pragmas.some(x => x.startsWith('use optimize'))) {
      this.active = true;
    } else if (pragmas.some(x => x.startsWith('disable optimize'))) {
      this.active = false;
    }

    this.optimize.push(this.active);
    this.functionScopes.push(x);

    if (this.active && (AST.isFunctionExpression(x) || AST.isFunctionDeclaration(x))) {
      this.thisScopes.push(x);
    }

    return x;
  }

  FunctionEnd(x:AST.BaseFunction, v:Visitor) {
    this.active = this.optimize.pop();      
    this.functionScopes.pop();

    if (this.thisScopes.length && x === this.thisScopes[this.thisScopes.length-1]) {
      this.thisScopes.pop();
    }

    return x;
  }

  BlockStatementEnd(x:AST.BlockStatement) {
    if (x['_this']) {
      x.body.unshift(m.Vars(x['_this'], AST.ThisExpression({})));
      delete x['_this']
    }
  }

  ThisExpressionEnd(x:AST.ThisExpression, v:Visitor) {
    let fnScope = this.functionScopes[this.functionScopes.length-1]; 
    if (this.active && AST.isArrowFunctionExpression(fnScope))  {
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
    if (!this.optimize[this.optimize.length-1]) return;
    
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

    let arg = x.arguments[0];

    if (AST.isFunction(arg)) {
      x[ANALYSIS] = FunctionAnalyzer.analyzeAST(arg as AST.BaseFunction);
      let fn:AST.BaseFunction = x.arguments[0] as AST.BaseFunction;
      if (AST.isArrowFunctionExpression(fn)) {
        fn = AST.FunctionExpression({
          body : fn.body as AST.BlockStatement,
          params : fn.params,
          generator : fn.generator,
          id : null
        })
      }
      fn.id = m.Id('__inline', true)
      x.arguments[0] = fn
    } else if (AST.isIdentifier(arg)) {
      let passed = false;
      let name = arg.name;
      for (let fn of this.functionScopes) {
        passed = passed || VariableVisitorUtil.readPatternIds(fn.params).some(x => x.name === name);
        if (passed) break;
      }
      x.arguments[0] = passed ? m.Call(TAG, arg) : m.Call(TAG, arg, m.Literal(m.genSymbol()));
    }
      
    let endNode = x[CANDIDATE_FUNCTIONS] ? x : visitor.findParent(x => !!x.node[CANDIDATE_FUNCTIONS]).node as AST.CallExpression;

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

      x[CANDIDATE_FUNCTIONS].map((x:AST.CallExpression) => {
        ops.push(m.Literal((x.callee as AST.MemberExpression).property['name']));
        inputs.push(AST.ArrayExpression({ elements : x.arguments }))
      });      

      let analysis = x[CANDIDATE_FUNCTIONS]
        .map(x => x[ANALYSIS])
        .filter(x => !!x)
        .reduce((total:Analysis, x) => total.merge(x), new Analysis("~"))

      let params = BodyTransformUtil.getExecArguments(x, analysis);

      return m.Call(EXEC, (x[CANDIDATE_START] as AST.MemberExpression).object, AST.ArrayExpression({elements:ops}), AST.ArrayExpression({elements:inputs}), ...params);
    }
  }
}