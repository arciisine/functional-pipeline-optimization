import { AST, Macro as m, Util, Visitor } from '../../node_modules/@arcsine/ecma-ast-transform/src';
import { Transformable, TrackedFunction, TransformResponse } from '../transform';
import {TransformState} from './types';

export abstract class BaseArrayTransformable<T, U, V extends Function, W extends Function> extends 
  Transformable<T[], U> 
{
  private static cache = {};
  public fn:W;

  constructor(public callback:V, public context?:any) {
    super(callback, context);

    let key = (this as any).name
    if (!BaseArrayTransformable.cache[key]) {
      BaseArrayTransformable.cache[key] = Array.prototype[key.split('Transformable')[0].toLowerCase()];
    }
    
    this.fn = BaseArrayTransformable.cache[key];
  }

  abstract onReturn(state:TransformState, node:AST.ReturnStatement):AST.Node;
  abstract getParams(state:TransformState):AST.Identifier[];

  transformer(state:TransformState):TransformResponse  {
    let node = Util.parse(this.callback) as AST.Node;
    let paramMap:{[key:string]:AST.Identifier} = {};       
    let pos = m.Id();
    let params = this.getParams(state);
    params.push(pos);

    if (node.type === 'ExpressionStatement') {
      node = (node as AST.ExpressionStatement).expression;
    }

    let res = new Visitor({
      FunctionExpression : (node:AST.FunctionExpression) => {
        node.params.forEach((p,i) => paramMap[(p as AST.Identifier).name] = params[i]);
        return node;
      },
      ArrowFunctionExpression : (node:AST.ArrowExpression) => {
        if (node.body.type !== 'BlockStatement') {
          node.body = m.Block(m.Return(node.body))          
        }
        node.params.forEach((p,i) => {
          let name = (p as AST.Identifier).name;
          paramMap[name] = params[i]
        })
        return node;
      },
      ReturnStatement : x => {
        return this.onReturn(state, x);
      },
      Identifier : x => {
        return paramMap[x.name] || x;
      }
    }).exec(node) as (AST.FunctionExpression|AST.ArrowExpression);

    let plen = Object.keys(paramMap).length;
    let body = res.body
    let min = params.length - 1;

    return {
      body : plen > min ? [body, m.Expr(m.Increment(pos))] : [body],
      vars : plen > min ? [pos, m.Literal(0)] : []
    }
  }

  manual(data:T[]):U { 
    return this.fn.apply(data, this.inputs) as U; 
  }
}

export abstract class ScalarTransformable<T, U, V> extends 
  BaseArrayTransformable<T, U, (el:T, i?:number, arr?:T[])=>V, 
    (callback:(el:T, i?:number, arr?:T[])=>V, context?:any)=>U> 
{
  constructor(public callback:(el:T, i?:number, arr?:T[])=>V, public context?:any) {
    super(callback, context);
  }

  getParams(state:TransformState) {
    return [state.elementId];
  }
}

export abstract class ReduceTransformable<T, U, V> extends 
  BaseArrayTransformable<T, U, (acc:U, el:T, i?:number, arr?:T[])=>V, 
    (callback:(acc:U, el:T, i?:number, arr?:T[])=>V, context?:any)=>U> 
{
  constructor(callback:(acc:U, el:T, i?:number, arr?:T[])=>V, public initValue?:U, context?:any) {
    super(callback, context);
    this.inputs.splice(1, 0, this.initValue); //put init value in the right arg
  }

  getParams(state:TransformState) {
    return [state.returnValueId, state.elementId];
  }
}