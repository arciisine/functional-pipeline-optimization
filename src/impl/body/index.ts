import {AST, ParseUtil, CompileUtil, Macro as m, Visitor } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import * as Transformers from '../array/transform';
import {SYMBOL} from '../array/bootstrap';
import {BaseTransformable} from '../array/base-transformable';
import {FunctionAnalyzer, AccessType, Analysis} from '../../core';

//Read name of manual fn from transformers
let supported = Transformers.MAPPING

//Function wrappers
const CANDIDATE = m.genSymbol();
const CANDIDATE_FUNCTIONS = m.genSymbol();
const CANDIDATE_RELATED = m.genSymbol();
const ANALYSIS = m.genSymbol();

const EXEC = m.Id();
const LOCAL = m.Id();
const WRAP = m.Id();
const REFS = {exec:EXEC,local:LOCAL,wrap:WRAP}

export function rewriteBody(content:string) {
  let body = ParseUtil.parseProgram<AST.Node>(content);

  body = new Visitor({
    CallExpressionStart : (x : AST.CallExpression, visitor:Visitor) => {
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
      if (AST.isFunctionExpression(arg) || AST.isArrowFunctionExpression(arg)) {
        let analysis = x[ANALYSIS] = FunctionAnalyzer.analyzeAST(arg); //Analayze function
        if (Object.keys(analysis.closed).length > 0) {
          x.arguments[0] = m.Call(LOCAL, arg);
        }
      }
      
      //Check for start of chain
      let callee = x.callee;
      if (AST.isMemberExpression(callee)) {
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

      //Check end of chain
      if (!x[CANDIDATE_FUNCTIONS]) {
        let node = visitor.findParent(x => !!x.node[CANDIDATE_FUNCTIONS]).node as AST.CallExpression;
        node[CANDIDATE_FUNCTIONS].push(x);
      } else {        
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
    }
  }).exec(body);

  body.body.unshift(m.Vars( 
    ...Object.keys(REFS)
      .map(k => [REFS[k], m.GetProperty(m.Id(SYMBOL), k)])
      .reduce((acc, pair) => acc.concat(pair), [])));
  

  return CompileUtil.compileExpression(body);
}