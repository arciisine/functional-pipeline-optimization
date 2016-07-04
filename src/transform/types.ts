import {AST, Util} from '../../node_modules/@arcsine/ecma-ast-transform/src';

export interface TransformResponse {
  body:AST.Node[],
  vars:AST.Node[]
}

export enum AccessType {
  NONE, READ, WRITE, INVOKE
}

export interface Analysis {
  key: string;
  check? : string,
  globals?:{[key:string]:any}
  closed?:{[key:string]:AccessType}
  declared?:{[key:string]:boolean}
  hasAssignment?:boolean
  hasCallExpression?:boolean
  hasThisExpression?:boolean
  hasNestedFunction?:boolean
  hasMemberExpression?:boolean
  hasNewExpression?:boolean
}

export interface Analyzable {
  analysis?:Analysis
};


export interface Transformable<I, O> extends Analyzable {
  inputs:any[];
  callbacks:Function[]
  
  transform<T>(state:T):TransformResponse;
  manualTransform(data:I):O;
}

declare global {
  interface Function {
    analysis?:Analysis
  }
}