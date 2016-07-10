import { AST, Macro as m} from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import { Compiler, Compilable, CompilerUtil, TransformResponse } from '../../core';
import { TransformState } from './types';
import { AccessType } from '../../core'; 

export class ArrayCompiler implements Compiler<TransformState> {

  createState():TransformState {
    return {
      elementId : m.Id(),
      returnValueId : m.Id(),
      continueLabel : m.Id(),
      iteratorId : m.Id(),
      arrayId : m.Id(),
    	functionId : m.Id()
    }
  }

  compile<I, O>(compilable:Compilable<I,O>, state:TransformState):AST.Node {
    let {vars, body} = CompilerUtil.readChain(compilable, state);

    let last = compilable.chain[compilable.chain.length-1];
    if (last['collect']) {
      body.push(last['collect'](state));
    }
    if (last['init']) {
      vars.push(state.returnValueId, last['init'](state));
    }

    let x = compilable.analysis.closed;
    let assigned = {};
    let closed = {}
    for (var k in x) {
      if ((x[k] & AccessType.WRITE) > 0) {
        assigned[k] = true;
      } else if (x[k] > 0) {
        closed[k] = true;
      }
    }
        //Define call site
    let closedIds =  Object.keys(closed).sort().map(m.Id);
    let assignedIds = Object.keys(assigned).sort().map(m.Id);

    function exprStmt(x:AST.Expression):AST.ExpressionStatement {
      return {
        type: "ExpressionStatement",
        expression : x
      }
    };


    let invoke:AST.CallExpression = {
      type : "CallExpression",
      callee : m.FuncExpr(state.functionId, [state.arrayId], [
        m.Vars('let', ...vars),
        m.Labeled(state.continueLabel,
          m.ForLoop(state.iteratorId, m.Literal(0), m.GetProperty(state.arrayId, "length"),
            [
              m.Vars('let', state.elementId, m.GetProperty(state.arrayId, state.iteratorId)),
              ...body
            ]        
          )
        ),
        m.Return(state.returnValueId)
      ]),
      arguments : [state.arrayId]
    };

    let wrapperId = m.Id();
    let wrappedRet = m.Id();
    
    return m.Func(wrapperId, [state.arrayId, ...assignedIds, ...closedIds], [
      m.Vars(wrappedRet, exprStmt(invoke)),
      m.Return(m.Array(wrappedRet, ...assignedIds))
    ]);
  }
}