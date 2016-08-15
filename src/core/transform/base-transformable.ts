import { AST, Macro as m } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import { Transformable, TransformResponse, Analysis} from '../../core';

export abstract class BaseTransformable<I, O> implements Transformable<I, O>  {

  public position = -1;

  constructor(protected inputs:any[], protected inputMapping:{[key:string]:number}) {}

  getContextValue(state:{contextId:AST.Identifier}, key:string):AST.MemberExpression {
    return m.GetProperty(
        m.GetProperty(state.contextId, m.Literal(this.position)), 
        AST.Literal({value:this.inputMapping[key]}));
  }

  abstract analyze():Analysis;
  abstract transform<S>(state:S):TransformResponse;
  abstract manualTransform(data:I):O;
}