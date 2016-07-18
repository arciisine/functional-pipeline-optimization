import { AST, Macro as m, Util as ASTUtil} from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import { Compiler, Compilable, CompilerUtil, TransformResponse } from '../../core';
import { TransformState } from './types';
import { AccessType } from '../../core'; 

export class ArrayCompiler implements Compiler<TransformState> {

  createState():TransformState {
    let state = {
      contextId: m.Id(),
      elementId : m.Id(),
      returnValueId : m.Id(),
      returnFnId  : m.Id(),
      continueLabel : m.Id(),
      iteratorId : m.Id(),
      arrayId : m.Id(),
    	functionId : m.Id(),
      buildReturn : null
    }
    return state;
  }

  compile<I, O>(compilable:Compilable<I,O>, state:TransformState):AST.Node {
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

    //Exposed build return function
    state.buildReturn = (id:AST.Node) => {
      return m.Return(m.ObjectExpr({
        value : id, 
        assigned : m.Array(...assignedIds)
      }));
    }

    let {vars, body} = CompilerUtil.readChain(compilable, state);

    let last = compilable.last;
    if (last['collect']) {
      body.push(last['collect'](state));
    }
    if (last['init']) {
      vars.push(state.returnValueId, last['init'](state));
    }
    if (vars.length === 0) {
      vars.push(state.returnValueId, undefined);
    }

    let lengthId = m.Id();
    let wrapperId = m.Id();
    let closedId = m.Id();
    let inputId = m.Id();

    return m.Func(wrapperId, [inputId], [
      m.Vars('var',
        [state.arrayId, m.GetProperty(inputId, 'value')],
        [state.contextId, m.GetProperty(inputId, 'context')],
        [closedId, m.GetProperty(inputId, 'closed')],
        ...[...assignedIds, ...closedIds].map((x,i) =>
        [x, m.GetProperty(closedId, m.Literal(i))])
      ),
      m.Vars('var',
        ...vars, 
        lengthId,  m.GetProperty(state.arrayId, "length"),
      ),
      m.Labeled(state.continueLabel,
        m.ForLoop(state.iteratorId, m.Literal(0), lengthId,
          [
            m.Vars('var', state.elementId, m.GetProperty(state.arrayId, state.iteratorId)),
            ...ASTUtil.reduceBlocks(body)
          ]        
        )
      ),
      state.buildReturn(state.returnValueId)
    ]);
  }
}