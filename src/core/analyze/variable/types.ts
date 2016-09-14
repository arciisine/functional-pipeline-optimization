import { AST } from '@arcsine/ecma-ast-transform/src';


export interface VariableHandler {
  (name:AST.Identifier, node?:AST.Node):void;
}

export interface VariableVisitHandler {
  Function?:(node?:AST.BaseFunction)=>void,
  FunctionEnd?:(node?:AST.BaseFunction)=>void,
  Block?:(node?:AST.BlockStatement)=>void,
  BlockEnd?:(node?:AST.BlockStatement)=>void,
  PropertyAccess?:(chain:AST.Identifier[], node?:AST.MemberExpression)=>void,  
  Declare?:VariableHandler,
  ComputedAccess?:VariableHandler,
  Access?:VariableHandler,
  ThisAccess?:(node:AST.ThisExpression)=>void,
  Write?:VariableHandler,
  Invoke?:VariableHandler
}