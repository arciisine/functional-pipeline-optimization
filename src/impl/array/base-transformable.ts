import { AST, Macro as m, Util, Visitor } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import { Transformable, TransformResponse, Analysis } from '../../core';
import { TransformState } from './types';

export abstract class BaseTransformable<T, U, V extends Function, W extends Function> 
  implements Transformable<T[], U> 
{
  private static cache = {};
  
  private static getArrayFunction<V extends BaseTransformable<any, any, any, any>>(inst:any) {
    let key = inst.constructor.name
    if (!BaseTransformable.cache[key]) {
      let fn = key.split('Transform')[0];
      fn = fn.charAt(0).toLowerCase() + fn.substring(1);
      BaseTransformable.cache[key] = Array.prototype[fn];
    }
    return BaseTransformable.cache[key];
  }

  public manual:W;
  public inputs:any[];
  public callbacks:Function[];
  public analysis:Analysis = null;

  constructor(public callback:V, public context?:any) {
    this.inputs = [callback, context];
    this.callbacks = [callback];
    this.manual = BaseTransformable.getArrayFunction(this);
  }

  abstract onReturn(state:TransformState, node:AST.ReturnStatement):AST.Node;

  getParams(state:TransformState):AST.Identifier[] {
    return [state.elementId];
  }

  transform(state:TransformState):TransformResponse  {
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
      ReturnStatement : x =>  this.onReturn(state, x),
      Identifier : x => paramMap[x.name] || x
    }).exec(node) as (AST.FunctionExpression|AST.ArrowExpression);

    let hasIndex = Object.keys(paramMap).length > params.length; //If requesting index
    return {
      body : hasIndex ? [res.body, m.Expr(m.Increment(pos))] : [res.body],
      vars : hasIndex ? [pos,  m.Literal(0)] : []
    }
  }

  manualTransform(data:T[]):U {
    return this.manual.apply(data, this.inputs) as U; 
  }
}