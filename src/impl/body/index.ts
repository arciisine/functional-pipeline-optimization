import {AST, Util, Macro as m, Visitor } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import * as Transformers from '../array/transform';
import {BaseTransformable} from '../array/base-transformable';
import {FunctionAnalyzer, AccessType} from '../../core';

//Read name of manual fn from transformers
let supported = Object.keys(Transformers)
  .filter(x => x.endsWith('Transform'))
  .map(x => (new Transformers[x]() as BaseTransformable<any, any, any, any>))
  .filter(x => !!x.manual)
  .reduce((acc,x) => (acc[x.manual.name] = true) && acc, {});

const REWRITE = m.genSymbol();

//Function wrappers
const CANDIDATE = m.genSymbol();
const CANDIDATE_FUNCTIONS = m.genSymbol();
const CANDIDATE_RELATED = m.genSymbol();
const ANALYSIS = m.genSymbol();

const WRAP = m.Id();
const EXEC = m.Id();
const LOCAL = m.Id();
const LAST = m.Id();

export function rewriteBody(content:string) {
  let body = Util.parseExpression<AST.Node>(content);
  
  body = new Visitor({
    CallExpression : (x : AST.CallExpression, visitor:Visitor) => {
      let callee = x.callee;
      if (AST.isMemberExpression(callee)) {
        let prop = callee.property;
        if (AST.isIdentifier(prop) && supported[prop.name] && x.arguments.length > 0) {
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
        if (AST.isCallExpression(sub) && AST.isMemberExpression(sub.callee)) {
          subCallee = sub.callee;
          let prop = callee.property;
          if (AST.isIdentifier(prop) && supported[prop.name]) {
            prop = subCallee.property;
            if (AST.isIdentifier(prop) && supported[prop.name]) {
              done =false;
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
        let analyses = 
          x[CANDIDATE_FUNCTIONS]
            .map(x => x[ANALYSIS])
            .filter( x=> !!x)
            .map(x => x.closed)

        console.log(analyses)

        analyses
          .forEach(x => {
            for (var k in x) {
              if ((x[k] & AccessType.WRITE) > 0) {
                assigned[k] = true;
              } else if (x[k] > 0) {
                closed[k] = true;
              }
            }
          })

        //Define call site
        let closedIds =  Object.keys(closed).map(m.Id);
        let assignedIds = Object.keys(assigned).map(m.Id);

        let ret:AST.Node = null;

        //Handle if we have to reassign closed variables
        if (assignedIds.length > 0) {
          let assign:AST.AssignmentExpression = {
            type : "AssignmentExpression",
            left : {
              type : "ArrayPattern",
              elements : assignedIds
            } as AST.ArrayPattern,
            operator : '=',
            right : m.Call(EXEC, x, m.Array(...closedIds), m.Array(...assignedIds)) 
          };
          ret = m.Call(LAST, assign);
        } else {
          ret = m.Call(EXEC, x, m.Array(...closedIds), m.Array(...assignedIds));
        }
        return ret;
      }
    }
  }).exec(body);

  return Util.compileExpression(body);
}