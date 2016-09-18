import { AST, Macro as m, Util as ASTUtil} from '@arcsine/ecma-ast-transform/src';
import { 
  AccessType, Analysis , 
  Compiler, Compilable, CompilerUtil, 
  TransformResponse, RewriteUtil,
  RewriteContext,
  VariableStack
} from '../../core';
import { TransformState, ExtraState } from './types';

export class ArrayCompiler implements Compiler<TransformState> {

  createState(extraState:ExtraState):TransformState {
    let assignedReturn = m.Array();
    let state = {
      analysis      : new Analysis("~"),
      operations    : extraState.operations,      
      contextId     : m.Id('ctx', true),
      elementId     : m.Id('el', true),
      returnValueId : m.Id('retval', true),
      returnFnId    : m.Id('retfn', true),
      continueLabel : m.Id('label', true),
      iteratorId    : m.Id('itr', true),
      arrayId       : m.Id('arr', true),
    	functionId    : m.Id('fn', true),
      tempIds       : {},
      assignedReturn,
      buildReturn   : (id:AST.Node) => {
        return m.Return(m.ObjectExpr({
          value : id,
          assigned : assignedReturn
        }));
      }
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

    return {closedIds, assignedIds, allIds};
  }

  compile<I, O>(compilable:Compilable<I,O>, state:TransformState):AST.Node {
    let lengthId = m.Id();
    let closedId = m.Id();

    let {body,vars,after} = this.compileBody(compilable, state);
    let {closedIds, assignedIds, allIds} = this.processIds(compilable, state);

    state.assignedReturn.elements = assignedIds;

    let params = [state.arrayId, state.contextId, closedId];
    let out = m.Func(m.Id(), params, [
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

    return RewriteUtil.rewriteSimple(out, params);
  }
}