import {AST, ParseUtil, CompileUtil, Macro as m, Visitor } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import * as Transformers from '../array/transform';
import {SYMBOL} from '../array/bootstrap';
import {BaseTransformable} from '../array/base-transformable';
import {FunctionAnalyzer, AccessType, Analysis, VariableVisitorUtil} from '../../core';

//Read name of manual fn from transformers
let supported = Transformers.MAPPING

//Function wrappers
const CANDIDATE = m.genSymbol();
const CANDIDATE_FUNCTIONS = m.genSymbol();
const CANDIDATE_RELATED = m.genSymbol();
const ANALYSIS = m.genSymbol();

const EXEC = m.Id(`${SYMBOL}_exec`);
const WRAP = m.Id(`${SYMBOL}_wrap`)
const TAG  = m.Id(`${SYMBOL}_tag`)
const FREE = m.Id()

function getPragmas(nodes:AST.Node[]):string[] {
  let i = 0;
  let out = [];
  while (i < nodes.length) {
    let child = nodes[i++];
    if (!(AST.isExpressionStatement(child) && 
        AST.isLiteral(child.expression) && 
        typeof child.expression.value === 'string')) break;

    out.push(child.expression.value as string);
  }
  return out;
}

function handleChainStart(callee:AST.MemberExpression) {
  //Check for start of chain
  let sub = callee.object;
  let done = true;
  let subCallee = null;
  //Chain is done
  if (AST.isCallExpression(callee.object) && AST.isMemberExpression(callee.object.callee)) {
    let subCallee = callee.object.callee;
    let prop = callee.property;
    if (AST.isIdentifier(callee.property) && supported[callee.property.name]) {
      if (AST.isIdentifier(subCallee.property) && supported[subCallee.property.name]) {
        done = false;
      }
    }
  }

  if (done) {
    callee.object = m.Call(WRAP, callee.object);
  }
}

function handleChainEnd(x:AST.CallExpression) {
  let closed = {};
  let assigned = {};
  let analysis = x[CANDIDATE_FUNCTIONS]
      .map(x => x[ANALYSIS])
      .filter(x => !!x)
      .reduce((total:Analysis, x) => total.merge(x), new Analysis("~"))

  for (var k in analysis.closed) {
    let v = analysis.closed[k];
    if ((v & AccessType.WRITE) > 0) {
      assigned[k] = true;
    } else if (v > 0) {
      closed[k] = true;
    }
  }

  //Define call site
  let closedIds =  Object.keys(closed).sort().map(m.Id);
  let assignedIds = Object.keys(assigned).sort().map(m.Id);
  let allIds =  m.Array(...[...assignedIds, ...closedIds])

  let execParams:any = [x];

  //Handle if we have to reassign closed variables
  if (allIds.elements.length > 0) {
    execParams.push(allIds);
    if (assignedIds.length > 0) {
      let id = m.Id()
      execParams.push(AST.ArrowFunctionExpression({
        params : [id],
        expression: true,
        body : AST.AssignmentExpression({
          left : AST.ArrayPattern({ elements : assignedIds }),
          operator : '=',
          right : id
        }),
        generator: false,
        id: null
      })); 
    }          
  }
  
  //Wrap with exec
  return m.Call(EXEC, ...execParams);;
}

export function rewriteBody(content:string) {
  let body = ParseUtil.parseProgram<AST.Node>(content);

  let optimize = [
    getPragmas(body.body).some(x => x.startsWith('use optimize'))
  ];

  let active = optimize[0];

  let thisScopes:(AST.FunctionDeclaration|AST.FunctionExpression)[] = [];
  let functionScopes:AST.BaseFunction[] = [];

  body = new Visitor({
    Function : (x:AST.BaseFunction) => {
      let block = VariableVisitorUtil.getFunctionBlock(x);
      let pragmas = getPragmas(block.body);

      if (pragmas.some(x => x.startsWith('use optimize'))) {
        active = true;
      } else if (pragmas.some(x => x.startsWith('disable optimize'))) {
        active = false;
      }

      optimize.push(active);
      functionScopes.push(x);

      if (active && (AST.isFunctionExpression(x) || AST.isFunctionDeclaration(x))) {
        thisScopes.push(x);
      }

      return x;
    },
    FunctionEnd : (x:AST.BaseFunction, v:Visitor) => {
      active = optimize.pop();      
      functionScopes.pop();

      if (thisScopes.length && x === thisScopes[thisScopes.length-1]) {
        thisScopes.pop();
      }

      return x;
    },
    BlockStatementEnd : (x:AST.BlockStatement)=> {
      if (x['_this']) {
        x.body.unshift(m.Vars(x['_this'], AST.ThisExpression({})));
        delete x['_this']
      }
    },
    ThisExpressionEnd : (x:AST.ThisExpression, v:Visitor) => {
      let fnScope = functionScopes[functionScopes.length-1]; 
      if (active && AST.isArrowFunctionExpression(fnScope))  {
        let body  = thisScopes[thisScopes.length-1].body;
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
    },
    CallExpression : (x : AST.CallExpression, visitor:Visitor) => {
      if (!optimize[optimize.length-1]) return;
      
      let callee = x.callee;
      if (AST.isMemberExpression(callee)) {
        if (AST.isIdentifier(callee.property) && supported[callee.property.name] && x.arguments.length > 0) {
          x[CANDIDATE] = true; //Mark call as candidate
          callee[CANDIDATE_RELATED] = true;
          //At end
          if (!visitor.parent.node[CANDIDATE_RELATED]) {
            x[CANDIDATE_FUNCTIONS] = [x];
          }
        }
      }
    },
    CallExpressionEnd : (x : AST.CallExpression, visitor:Visitor) => {
      if (!x[CANDIDATE]) return;

      let arg = x.arguments[0];
      let inline = AST.isFunction(arg)
      if (inline) {
        x[ANALYSIS] = FunctionAnalyzer.analyzeAST(arg as AST.BaseFunction);
      }
      x.arguments[0] = m.Call(TAG, arg, inline ? m.Literal(m.Id().name) : undefined);
        
      //Check for start of chain
      let callee = x.callee;
      if (AST.isMemberExpression(callee)) {
        handleChainStart(callee);
      }

      //Check end of chain
      if (!x[CANDIDATE_FUNCTIONS]) {
        let node = visitor.findParent(x => !!x.node[CANDIDATE_FUNCTIONS]).node as AST.CallExpression;
        node[CANDIDATE_FUNCTIONS].push(x);
      } else {
        return handleChainEnd(x);        
      }
    }
  }).exec(body);

  return CompileUtil.compileExpression(body);
}