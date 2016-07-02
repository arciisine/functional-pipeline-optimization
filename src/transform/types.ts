import {AST} from '../../node_modules/@arcsine/ecma-ast-transform/src';

export interface Transformer {
  <T>(ref:TransformReference, state:T):TransformResponse
}

export interface TransformReference {
  node:AST.Node,
  params?:AST.Identifier[],
  onReturn?:(node:AST.ReturnStatement)=>AST.Node
}

export interface TransformResponse {
  body:AST.Node[],
  vars:AST.Node[]
}

export enum TransformLevel {
  UNKNOWN = 0,
  WRITE_DEPENDENCE = 1,
  READ_DEPENDENCE = 2,
  NO_DEPDENDENCE = 3
}

export abstract class Transformable<I, O> {

  key: string;
  id: number;
  level: TransformLevel = null;
  constructor(public raw:(...args:any[])=>any, public globals?:any) {}

  abstract transformer<T>(ref:TransformReference, state:T):TransformResponse;
  abstract manual(data:I):O;
}