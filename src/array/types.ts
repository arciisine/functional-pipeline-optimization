import { AST, Macro as m } from '../../node_modules/ecma-ast-transform/src';
import { Transformable } from '../transform';

export interface TransformState {
  elementId:AST.Identifier,
  returnValueId:AST.Identifier
  continueLabel:AST.Identifier,
  iteratorId:AST.Identifier,
  arrayId:AST.Identifier,
  functionId:AST.Identifier
}

export abstract class ScalarTransformable<T, U> extends Transformable<T[], U> {

  protected initRaw:string;

  constructor(raw, globals, init:U = null) {
    super(raw, globals);
    this.initRaw = JSON.stringify(init);
  }

  init(state:TransformState):AST.Node {
    return m.Literal(JSON.parse(this.initRaw));
  }
}

export abstract class ArrayTransformable<T, U> extends ScalarTransformable<T, U[]> {
  constructor(raw, globals) {
    super(raw, globals, [])
  }
  
  collect(state:TransformState):AST.Node {
    return m.Expr(m.Call(m.GetProperty(state.returnValueId, 'push'), state.elementId))
  }
}
