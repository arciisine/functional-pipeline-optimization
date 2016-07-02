import {AST} from '../../node_modules/@arcsine/ecma-ast-transform/src';

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
  NO_DEPDENDENCE = 3
}

export interface Tracked<I, O> {
  key: string;
  id: number;
  level: TransformLevel;
}

export interface TrackedFunction<I, O> extends Function, Tracked<I,O> {

}

export abstract class Transformable<I, O> implements Tracked<I, O> {

  key: string;
  id: number;
  level: TransformLevel = null;

  constructor(public input:any[], public globals?:any) {}

  abstract transformer<T>(state:T):TransformResponse;
  abstract manual(data:I):O;
}