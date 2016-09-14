import { AST, Macro as m, Util as ASTUtil} from '@arcsine/ecma-ast-transform/src';
import { Compiler, Compilable, CompilerUtil, TransformResponse } from '../../core';
import { TransformState, ExtraState } from './types';
import { AccessType, Analysis } from '../../core'; 

export class ArrayCompiler implements Compiler<TransformState> {

  createState(extraState:ExtraState):TransformState {
    let assignedReturn = m.Array();
    let state = {
      contextId: m.Id(),
      elementId : m.Id(),
      returnValueId : m.Id(),
      returnFnId  : m.Id(),
      continueLabel : m.Id(),
      iteratorId : m.Id(),
      arrayId : m.Id(),
    	functionId : m.Id(),
      assignedReturn,
      buildReturn : (id:AST.Node) => {
        return m.Return(m.ObjectExpr({
          value : id, 
          assigned : assignedReturn
        }));
      },
      analysis : new Analysis("~"),
      operations : extraState.operations
    }
    return state;
  }

  compileBody<I, O>(compilable:Compilable<I, O>, state:TransformState):TransformResponse {
    let {vars, body, after} = CompilerUtil.readChain(compilable, state);

    let last = compilable.chain[compilable.chain.length-1];
    if (last['collect']) {
      body.push(last['collect'](state));
    }
    if (last['init']) {
      vars.push(state.returnValueId, last['init'](state));
    }
    if (vars.length === 0) {
      vars.push(state.returnValueId, undefined);
    }
    return {vars,body,after};
  }

  processIds<I, O>(compilable:Compilable<I,O>, state:TransformState):{closedIds:AST.Identifier[], assignedIds:AST.Identifier[], allIds:AST.Identifier[]} {
    let ids = state.analysis.getExternalVariables();

    //Define call site
    let closedIds =  ids.closed.map((x) => m.Id(x));
    let assignedIds = ids.assigned.map((x) => m.Id(x));
    let allIds =  [...assignedIds, ...closedIds]

    return {closedIds, assignedIds, allIds}
  }

  compile<I, O>(compilable:Compilable<I,O>, state:TransformState):AST.Node {
    let lengthId = m.Id();
    let closedId = m.Id();

    let {body,vars,after} = this.compileBody(compilable, state);
    let {closedIds, assignedIds, allIds} = this.processIds(compilable, state);

    state.assignedReturn.elements = assignedIds

    return m.Func(m.Id(), [state.arrayId, state.contextId, closedId], [
      allIds.length ? m.Vars('var', ...allIds.map((x,i) => [x, m.GetProperty(closedId, m.Literal(i))])) : null,
      m.Vars('var', ...vars, lengthId,  m.GetProperty(state.arrayId, "length")),
      m.Labeled(state.continueLabel,
        m.ForLoop(state.iteratorId, m.Literal(0), lengthId,
          [
            m.Vars('var', state.elementId, m.GetProperty(state.arrayId, state.iteratorId)),
            ...ASTUtil.reduceBlocks(body)
          ]        
        )
      ),
      ...(after||[]),
      state.buildReturn(state.returnValueId)
    ]);
  }
}