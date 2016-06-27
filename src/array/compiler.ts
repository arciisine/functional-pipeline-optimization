import { AST, Macro as m} from '../../node_modules/ecma-ast-transform/src';
import { Compiler, Compilable } from '../compile';
import { TransformState, ArrayTransformable, ScalarTransformable } from './types';
import { TransformResponse } from '../transform';

export class ArrayCompiler<I, O> extends Compiler<I[], O, TransformState> {

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

  generate(collector:Compilable<I[], O>, state:TransformState):TransformResponse {
    let res = super.generate(collector, state);
    let last = collector.chain[collector.chain.length-1];
    if (last instanceof ArrayTransformable) {
      res.body.push(last.collect(state));
    }
    if (last instanceof ScalarTransformable) {
      res.vars.push(state.returnValueId, last.init(state));
    }
    console.log(last.raw.toString());
    return res;
  }

  compile(collector:Compilable<I[], O>, state:TransformState):AST.Node {
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