import { AST, Macro as m, Util, Visitor } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import { Transformable, TransformResponse, Analysis, VariableVisitor, VariableStack } from '../../core';
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
    let pos = m.Id();
    let params = [...this.getParams(state), pos];

    let fn:AST.FunctionExpression = null;

    if (AST.isExpressionStatement(node)) {
      node = node.expression;
    }

    if (AST.isArrowFunctionExpression(node) || AST.isFunctionExpression(node)) {
      fn = node as AST.FunctionExpression;
    } else {
      throw new Error(`Invalid type: ${node.type}`);
    }

    //Rename all variables to unique values
    let stack = new VariableStack();
    VariableVisitor.visit({
      onDeclare:(name:AST.Identifier, parent:AST.Node) => {
        name.name = stack.top[name.name] = m.Id().name;
      },
      onAccess:(name:AST.Identifier) => {
        if (stack.contains(name)) {
          name.name = stack.top[name.name]; //Rewrite
        }
      }
    }, fn, stack) 
    
    //Handle returns
    new Visitor({
      ReturnStatementEnd : (x:AST.ReturnStatement) =>  this.onReturn(state, x),
    }).exec(fn)

    let vars = [];
    let body:AST.Node[] = [...fn.body.body];
    body.unshift(AST.VariableDeclaration({
      kind : 'let',
      declarations : fn.params.map((p, i) => {
        return AST.VariableDeclarator({
          id : p,
          init : params[i]
        })
      })
    }));

    if (fn.params.length === params.length) { //If using index
      vars.push(pos, m.Literal(0))
      body.push(m.Expr(m.Increment(pos)))      
    }

    return { body, vars };
  }

  manualTransform(data:T[]):U {
    return this.manual.apply(data, this.inputs) as U; 
  }
}