import {AST, Macro as m } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import {MAPPING as supported} from '../array/transform';
import {SYMBOL} from '../array/bootstrap';
import {FunctionAnalyzer, VariableVisitorUtil} from '../../core/analyze';
import {AccessType, Analysis } from '../../core';

export const EXEC = m.Id(`${SYMBOL}_exec`);
export const KEY  = m.Id(`${SYMBOL}_key`)
export const FREE = m.Id()

export const CANDIDATE = m.genSymbol();
export const CANDIDATE_KEY = m.genSymbol();
export const CANDIDATE_START = m.genSymbol();
export const CANDIDATE_FUNCTIONS = m.genSymbol();
export const CANDIDATE_RELATED = m.genSymbol();
export const ANALYSIS = m.genSymbol();

export const INLINE_PREFIX = '__inline';

export class BodyTransformUtil {

  static getPragmas(nodes:AST.Node[]):string[] {
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

  static isChainStart(callee:AST.MemberExpression):boolean {
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

    return done;
  }

  static getExecArguments(x:AST.CallExpression, analysis:Analysis) {
    let closed = {};
    let assigned = {};

    for (var k in analysis.closed) {
      let v = analysis.closed[k];
      if ((v & AccessType.WRITE) > 0) {
        assigned[k] = true;
      } else if (v > 0) {
        closed[k] = true;
      }
    }

    //Define call site
    let closedIds =  Object.keys(closed).sort().map((x) => m.Id(x));
    let assignedIds = Object.keys(assigned).sort().map((x) => m.Id(x));
    let allIds =  m.Array(...[...assignedIds, ...closedIds])

    let execParams:any = [];

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
    return execParams;
  }

  static buildKey(inputs:AST.ArrayExpression[], scopes:AST.BaseFunction[]) {
    let res = inputs.map((x):AST.Expression => {
      let el = x.elements[0];

      if (AST.isIdentifier(el)) { //If a variable
        let passed = false;
        let name = el.name;
        for (let fn of scopes) {
          passed = passed || VariableVisitorUtil.readPatternIds(fn.params).some(x => x.name === name);
          if (passed) break;
        }
        return passed ? m.Call(KEY, el) : m.Literal(m.Id().name);
      } else if (AST.isFunctionExpression(el)) {
        return m.Literal(el.id.name);
      } else if (AST.isLiteral(el)) {
        return m.Literal(`${el.value}`);
      } else if (AST.isCallExpression(el)) {
        return m.Literal(m.genSymbol('__computed'));
      }
    }).reduce((acc:AST.BinaryExpression, expr:AST.Expression) => {
      if (AST.isLiteral(acc.left) && acc.left.value === "") {
        console.log(expr);
        acc.left = expr;
      } else if (AST.isLiteral(acc.right) && acc.right.value === "") {
        console.log(expr);
        acc.right = expr;
      } else if (AST.isLiteral(acc.right) && AST.isLiteral(expr)) {
        acc.right.value += "~" + expr.value;
      } else {
        acc.right = AST.BinaryExpression({left:acc.right, operator:"+", right:expr})
      }
      return acc;
    }, AST.BinaryExpression({left:m.Literal(""), operator:"+", right:m.Literal("")}))

    if (AST.isBinaryExpression(res)) {
      if (AST.isLiteral(res.left) && AST.isLiteral(res.right)) {
        res = m.Literal(m.Id().name); // Static input, shorten
      }
    }
    return res;
  }

  static renameExpressions(x:AST.CallExpression) {
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
      fn.id = m.Id(INLINE_PREFIX, true)
      x[CANDIDATE_KEY] = fn.id.name;
      x.arguments[0] = fn
    } 
  }
}