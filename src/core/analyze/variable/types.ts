import { AST } from '../../../../node_modules/@arcsine/ecma-ast-transform/src';


export interface VariableHandler {
  (name:AST.Identifier, node?:AST.Node):void;
}

export interface VariableVisitHandler {
    onFunctionStart?:(node?:AST.BaseFunction)=>void,
    onFunctionEnd?:(node?:AST.BaseFunction)=>void,
    onBlockStart?:(node?:AST.BlockStatement)=>void,
    onBlockEnd?:(node?:AST.BlockStatement)=>void,
    onDeclare?:VariableHandler,
    onComputedAccess?:VariableHandler,
    onAccess?:VariableHandler,
    onWrite?:VariableHandler,
    onInvoke?:VariableHandler,
}