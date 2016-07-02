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
  NO_DEPENDENCE = 3
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
  globals:any = null;
  inputs:any[] = null;

  constructor(...inputs:any[]) {
    this.inputs = inputs;
  }

  abstract transform<T>(state:T):TransformResponse;
  abstract manualTransform(data:I):O;
}