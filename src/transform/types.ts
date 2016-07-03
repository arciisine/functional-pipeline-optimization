import {AST, Util} from '../../node_modules/@arcsine/ecma-ast-transform/src';


export interface Transformer {
  <T>(state:T):TransformResponse
}

export interface TransformResponse {
  body:AST.Node[],
  vars:AST.Node[]
}

export enum TransformLevel {
  UNKNOWN = 0,
  WRITE_DEPENDENCE = 1,
  READ_DEPENDENCE = 2,
  NO_DEPENDENCE = 3
}

export interface TransformTag {
  id?: number;
  key: string;
  level: TransformLevel;
  closed?:{[key:string]:any};
}

declare global {
  interface Function {
    tag:TransformTag
  }
}

export interface Transformable<I, O> {
  tag:TransformTag
  inputs:any[];
  callbacks:Function[]
  
  transform<T>(state:T):TransformResponse;
  manualTransform(data:I):O;
}