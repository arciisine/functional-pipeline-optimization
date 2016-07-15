import { AST, Macro as m, Util as ASTUtil} from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import { Compiler, Compilable, CompilerUtil, TransformResponse } from '../../core';
import { TransformState } from './types';
import { AccessType } from '../../core'; 

export class ArrayCompiler implements Compiler<TransformState> {

  createState():TransformState {
    return {
      stepId : null,
      contextId: m.Id(),
      elementId : m.Id(),
      returnValueId : m.Id(),
      continueLabel : m.Id(),
      iteratorId : m.Id(),
      arrayId : m.Id(),
    	functionId : m.Id()
    }
  }

  compile<I, O>(compilable:Compilable<I,O>, state:TransformState):AST.Node {
    let pos = 0;
    let {vars, body} = CompilerUtil.readChain(compilable, state, s => (s.stepId = m.Id(`__${pos++}`)) && s);

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

    if (vars.length === 0) {
      vars.push(state.returnValueId, undefined);
    }

    let lengthId = m.Id();
    let wrapperId = m.Id();
    let closedId = m.Id();
    let inputId = m.Id();

    return m.Func(wrapperId, [inputId], [
      m.Vars('var',
        state.arrayId, m.GetProperty(inputId, 'value'),
        state.contextId, m.GetProperty(inputId, 'context'),
        closedId, m.GetProperty(inputId, 'closed'),
      m.ObjectExpr({value:state.arrayId, context:state.contextId, closed:closedId}) 
        AST.ArrayPattern({ elements:[...assignedIds, ...closedIds] }), closedId),
      m.Func(state.functionId, [state.arrayId], [
        m.Vars('var', ...vars, lengthId, m.GetProperty(state.arrayId, "length")),
        m.Labeled(state.continueLabel,
          m.ForLoop(state.iteratorId, m.Literal(0), lengthId,
            [
              m.Vars('var', state.elementId, m.GetProperty(state.arrayId, state.iteratorId)),
              ...ASTUtil.reduceBlocks(body)
            ]        
          )
        ),
        m.Return(state.returnValueId)
      ]),
      m.Return(m.ObjectExpr({
        value : AST.CallExpression({
          callee : state.functionId,
          arguments : [state.arrayId]
        }), 
        assigned : m.Array(...assignedIds)
      }))
    ]);
  }
}