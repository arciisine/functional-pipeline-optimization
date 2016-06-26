import {AST} from '../../node_modules/ecma-ast-transform/src';
import {
  Transformable, 
  TransformState, 
  TransformReference, 
  TransformResponse
} from '../transform';

export interface Compilable<I, O> {
  key:string;
  pure:boolean;
  chain:Transformable<any, any>[],
  getCollectAST(state:TransformState):AST.Node
  getInitAST(state:TransformState):AST.Node
}