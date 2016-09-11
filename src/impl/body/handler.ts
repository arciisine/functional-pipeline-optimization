import {AST, ParseUtil, CompileUtil, Macro as m, Visitor } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import {SYMBOL} from './bootstrap';
import {MAPPING as supported} from '../array/transform';
import {FunctionAnalyzer, AccessType, Analysis, VariableVisitorUtil} from '../../core';
import {BodyTransformUtil, 
  EXEC, CANDIDATE, CANDIDATE_FUNCTIONS, CANDIDATE_KEY,
  CANDIDATE_RELATED, CANDIDATE_START, ANALYSIS
} from './util';

//Function wrappers
export class BodyTransformHandler {

  static transform(content:string) {
    let body = ParseUtil.parseProgram<AST.Node>(content);
    Visitor.exec(new BodyTransformHandler(BodyTransformUtil.getPragmas(body.body)), body);
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
    this.optimize.pop();
    this.active = this.optimize[this.optimize.length -1];      
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
        .map(x => FunctionAnalyzer.analyzeAST(x))
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