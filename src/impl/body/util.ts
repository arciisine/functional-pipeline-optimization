import {AST, Macro as m } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import {MAPPING as supported} from '../array/transform';
import {VariableState} from '../array/types';
import {FunctionAnalyzer, VariableVisitorUtil} from '../../core/analyze';
import {AccessType, Analysis } from '../../core';
import {OptimizeState, OPTIMIZE_CHECK, ANALYSIS, CANDIDATE_KEY} from './types';

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


  static parsePragma(body:AST.BlockStatement) {
    let pragmas = BodyTransformUtil.getPragmas(body.body)
    let pragma = pragmas.find(x => OPTIMIZE_CHECK.test(x))

    if (!pragma) {
      return null;
    } else if (pragma.indexOf('disable')>=0) {
      return { active : false };
    } else {
      let flags = pragma
        .split(OPTIMIZE_CHECK)[1]
        .split(';')
        .map(x => x.trim().split(/\s*=\s*/, 2))
        .filter(x => x[0] && x[1])

      let config:any = flags        
        .reduce((acc, pair) => (acc[pair[0]] = pair[1]) && acc, {active:true})

      if (config.globals && typeof config.globals === 'string') {
        config.globals = config.globals.split(',');
      }

      return config as OptimizeState;
    }
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
    let ids = analysis.getExternalVariables();

    //Define call site
    let closedIds =  ids.closed.map((x) => m.Id(x));
    let assignedIds = ids.assigned.map((x) => m.Id(x));
    let allIds =  m.Array(...[...assignedIds, ...closedIds])

    let execParams:{closed?:AST.Expression, assign?:AST.BaseFunction|AST.Literal} = {
      closed : null,
      assign : null,
    };

    //Handle if we have to reassign closed variables
    if (allIds.elements.length > 0) {
      execParams.closed = allIds;
      if (assignedIds.length > 0) {
        let id = m.Id()
        execParams.assign = AST.ArrowFunctionExpression({
          params : [id],
          expression: true,
          body : AST.AssignmentExpression({
            left : AST.ArrayPattern({ elements : assignedIds }),
            operator : '=',
            right : id
          }),
          generator: false,
          id: null
        }); 
      }          
    }
    
    //Wrap with exec
    return execParams;
  }

  static buildVariableState(args:AST.Expression[], scopes:AST.BaseFunction[]):AST.Literal {
    let el = args[0];
    let state = VariableState.dynamic;

    if (AST.isIdentifier(el)) { //If a variable
      let passed = false;
      let name = el.name;
      for (let fn of scopes) {
        passed = passed || VariableVisitorUtil.readPatternIds(fn.params).some(x => x.name === name);
        if (passed) break;
      }
      if (!passed) {
        state = VariableState.static;
      }
    } else if (AST.isFunction(el)) { //If a literal
      state = VariableState.inline;
    }

    return m.Literal(state);
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
      fn.id = m.Id(fn.id && fn.id.name+'_', true)
      x[CANDIDATE_KEY] = fn.id.name;
      x.arguments[0] = fn
    } 
  }
}