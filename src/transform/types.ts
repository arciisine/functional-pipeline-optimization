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

export interface Tracked<I, O> {
  key: string;
  id: number;
  level: TransformLevel;
  closed:{[key:string]:number};
}

export interface TrackedCallback<I,O> extends Function, Tracked<any, any> {}

export abstract class Transformable<I, O> implements Tracked<I, O> {

  key: string;
  id: number;
  level: TransformLevel = null;
  closed:{[key:string]:number};
  callbacks:TrackedCallback<I, O>[];

  constructor(public inputs:any[], callbacks:Function[]) {
    this.callbacks = callbacks as TrackedCallback<I, O>[];
  }

  abstract transform<T>(state:T):TransformResponse;
  abstract manualTransform(data:I):O;
}