import { AST, Macro as m, Util } from '../../node_modules/@arcsine/ecma-ast-transform/src';
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

  initRaw:string = null;

  constructor(raw, globals, initValue:U = null) {
    super(raw, globals);
    if (initValue !== null) {
      this.initRaw = JSON.stringify(initValue);
    }
  }

  init(state:TransformState):AST.Node {
    let decl = Util.parseExpression(`let a = ${this.initRaw}`) as AST.VariableDeclaration;
    return decl.declarations[0].init;
  }
}

export abstract class ArrayTransformable<T, U> extends ScalarTransformable<T, U[]> {
  constructor(raw, globals) {
    super(raw, globals);
  }

  init(state:TransformState) {
    return m.Array();
  }

  collect(state:TransformState):AST.Node {
    return m.Expr(m.Call(m.GetProperty(state.returnValueId, 'push'), state.elementId))
  }
}
