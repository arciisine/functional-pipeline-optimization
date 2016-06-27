import { AST, Macro as m} from '../../node_modules/ecma-ast-transform/src';
import { Compiler, Compilable } from '../compile';
import { TransformState } from './types';
import { TransformResponse } from '../transform';

export class ArrayCompiler<I, O> extends Compiler<I[], O[], TransformState> {

  init():TransformState {
    return {
      elementId : m.Id(),
      returnValueId : m.Id(),
      continueLabel : m.Id(),
      iteratorId : m.Id(),
      arrayId : m.Id(),
    	functionId : m.Id()
    }
  }

  generate(collector:Compilable<I[], O[]>, state:TransformState):TransformResponse {
    let res = super.generate(collector, state);
        //Handle collector    
    let collect = collector.getCollectAST(state);
    let init = collector.getInitAST(state)

    if (init) res.vars.push(state.returnValueId, init);
    if (collect) res.body.push(collect);
    return res;
  }

  compile(collector:Compilable<I[], O[]>, state:TransformState):AST.Node {
    let {vars, body} = this.generate(collector, state);

    return m.Func(state.functionId, [state.arrayId], [
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
    ]);
  }
}