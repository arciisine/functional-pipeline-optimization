import {Macro as m} from '../../../node_modules/ecma-ast-transform/src';
import {standardHandler, TransformResponse, TransformReference, TransformState} from './util';

export class Transformers {
  static filter(ref:TransformReference, state:TransformState):TransformResponse {
    ref.params = [state.element];
    ref.onReturn = node => m.IfThen(m.Negate(node.argument), [m.Continue(state.continueLabel)]);
    return standardHandler(ref);
  }

  static map(ref:TransformReference, state:TransformState):TransformResponse {
    ref.params = [state.element];
    ref.onReturn = node => m.Expr(m.Assign(state.element, node.argument));
    return standardHandler(ref);
  }
  
  static reduce(ref:TransformReference, state:TransformState):TransformResponse {
    ref.params = [state.ret, state.element];
    ref.onReturn = node => m.Expr(m.Assign(state.ret, node.argument));
    return standardHandler(ref);
  }

  static forEach(ref:TransformReference, state:TransformState):TransformResponse {
    ref.params = [state.element];
    ref.onReturn = node => m.Continue(state.continueLabel);
    return standardHandler(ref);
  }

  static find(ref:TransformReference, state:TransformState):TransformResponse {
    ref.params = [state.element];
    ref.onReturn = node => m.IfThen(node.argument, [m.Return(state.element)]);
    return standardHandler(ref);
  }

  static some(ref:TransformReference, state:TransformState):TransformResponse {
    ref.params = [state.element];
    ref.onReturn = node => m.IfThen(node.argument, [m.Return(m.Literal(true))]);
    return standardHandler(ref);
  }
}