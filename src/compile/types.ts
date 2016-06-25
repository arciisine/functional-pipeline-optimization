import {AST} from '../../node_modules/ecma-ast-transform/src';
import {Transformable, TransformState} from '../transform';

export interface Compilable<I, O> {
  key:string;
  pure:boolean;
  chain:Transformable[],
  getCollectAST(state:TransformState):AST.Node
  getInitAST(state:TransformState):AST.Node
}