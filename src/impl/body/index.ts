import {AST, Util, Macro as m, Visitor } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import * as Transformers from '../array/transform';
import {SYMBOL} from '../array/bootstrap';
import {BaseTransformable} from '../array/base-transformable';
import {FunctionAnalyzer, AccessType, Analysis} from '../../core';

//Read name of manual fn from transformers
let supported = Object.keys(Transformers)
  .map(x => (new Transformers[x]() as BaseTransformable<any, any, any, any>))
  .filter(x => !!x.manual)
  .reduce((acc,x) => (acc[x.manual.name] = true) && acc, {});

//Function wrappers
const CANDIDATE = m.genSymbol();
const CANDIDATE_FUNCTIONS = m.genSymbol();
const CANDIDATE_RELATED = m.genSymbol();
const ANALYSIS = m.genSymbol();

const EXEC = m.Id();
const LOCAL = m.Id();
const WRAP = m.Id();
const FIRST = m.Id();
const GENERIC_ASSIGN = m.Id();
const REFS = {exec:EXEC,local:LOCAL,wrap:WRAP,first:FIRST}

export function rewriteBody(content:string) {
  let body = Util.parseProgram<AST.Node>(content);

  body = new Visitor({
    CallExpression : (x : AST.CallExpression, visitor:Visitor) => {
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
        x[ANALYSIS] = FunctionAnalyzer.analyzeAST(arg); //Analayze function
        x.arguments[0] = m.Call(LOCAL, arg);
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

        let ret:AST.Node = null;

        //Handle if we have to reassign closed variables
        if (assignedIds.length > 0) {
          ret = m.Call(FIRST, AST.AssignmentExpression({
            left : AST.ArrayPattern({
              elements : [GENERIC_ASSIGN, ...assignedIds]
            }),
            operator : '=',
            right : m.Call(EXEC, x, allIds) 
          }));
        } else {
          ret = m.Call(FIRST, m.Call(EXEC, x, allIds));
        }
        return ret;
      }
    }
  }).exec(body);

  body.body.unshift(m.Vars(GENERIC_ASSIGN, null, 
    ...Object.keys(REFS)
      .map(k => [REFS[k], m.GetProperty(m.Id(SYMBOL), k)])
      .reduce((acc, pair) => acc.concat(pair), [])));
  

  return Util.compileExpression(body);
}