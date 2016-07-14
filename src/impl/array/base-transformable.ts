import { AST, Macro as m, ParseUtil, Visitor } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import { Transformable, TransformResponse, Analysis, FunctionAnalyzer, VariableVisitor, VariableStack } from '../../core';
import { TransformState } from './types';

export abstract class BaseTransformable<T, U, V extends Function, W extends Function> 
  implements Transformable<T[], U> 
{
  private static cache = {};
  private static id = 0;

  static getArrayFunction<V extends BaseTransformable<any, any, any, any>>(inst:any) {
    let key = inst.constructor.name
    if (!BaseTransformable.cache[key]) {
      let fn = key.split('Transform')[0];
      fn = fn.charAt(0).toLowerCase() + fn.substring(1);
      BaseTransformable.cache[key] = Array.prototype[fn];
    }
    return BaseTransformable.cache[key];
  }

  static rewritePatterns(node:AST.Pattern, stack:VariableStack) {
    if (AST.isObjectPattern(node)) {
      for (let p of node.properties) {
        BaseTransformable.rewritePatterns(p, stack);
      }
    } else if (AST.isArrayPattern(node)) {
      for (let p of node.elements) {
        BaseTransformable.rewritePatterns(p, stack);
      }
    } else if (AST.isIdentifier(node)) {
      stack.register(node);
      node.name = stack.top[node.name] = m.Id().name
    } else if (AST.isProperty(node)) {
      node.shorthand = false;
      node.value = {} as any;
      for (var k in node.key) { node.value[k] = node.key[k] }
      BaseTransformable.rewritePatterns(node.value, stack);      
    }
    return node;
  }

  public inputArray:any[]
  public manual:W;
  public callbacks:Function[];
  public analysis:Analysis = null;
  public id = null;

  constructor(public inputs:{callback:V, context?:any}) {
    this.callbacks = [inputs.callback];
    this.manual = BaseTransformable.getArrayFunction(this);
    this.inputArray = [inputs.callback, inputs.context];
  }


  abstract onReturn(state:TransformState, node:AST.ReturnStatement):AST.Node;

  getContextValue(state:TransformState, key:string):AST.MemberExpression {
    return m.GetProperty(m.GetProperty(state.contextId, state.stepId.name), key);
  }

  getParams(state:TransformState):AST.Identifier[] {
    return [state.elementId];
  }

  transform(state:TransformState):TransformResponse  {
    this.id = state.stepId.name;

    let node = ParseUtil.parse(this.inputs.callback) as AST.Node;
    let pos = m.Id();
    let params = [...this.getParams(state), pos];

    let fn:AST.FunctionExpression = null;

    if (AST.isExpressionStatement(node)) {
      node = node.expression;
    }

    if (AST.isFunction(node)) {
      fn = node as AST.FunctionExpression;
    } else {
      throw { message : `Invalid type: ${node.type}`, invalid : true };
    }

    if (fn.params.length > params.length) { //If using array notation
      throw { message : "Array references are not supported", invalid : true };
    }

    let stack = new VariableStack();
    let vars = [];
    let body:AST.Node[] = [];

    //Handle wether or not we can reference the element, or if we
    //  we need to assign to leverage pattern usage
    let fnparams = fn.params;
    let assign = {};
    for (let i = 0; i < fn.params.length;i++) {
      let p = fn.params[i];
      if (AST.isArrayPattern(p) || AST.isObjectPattern(p)) {        
        body.unshift(AST.VariableDeclaration({
          kind : 'let',
          declarations : [
            AST.VariableDeclarator({
              id : BaseTransformable.rewritePatterns(p, stack),
              init : params[i]
            })
          ]
        }));
      } else if (AST.isIdentifier(p)) {
        stack.register(p);
        stack.top[p.name] = (params[i] as AST.Identifier).name;
      }
    }

    //Handle context variable
    if (this.inputs.context !== undefined) {
      let ctx = m.Id();
      vars.push(ctx, this.getContextValue(state, 'context'));
      stack.top['this'] = ctx;
    }

    //Rename all variables to unique values
    VariableVisitor.visit({
      onDeclare:(name:AST.Identifier, parent:AST.Node) => {
        if (parent === fn) {
          //Skip parents
        } else {
          name.name = stack.top[name.name] =  m.Id().name;
        }
      },
      onAccess:(name:AST.Identifier, parent:AST.Node) => {
        if (stack.contains(name)) {
          name.name = stack.top[name.name]; //Rewrite
        }
      }
    }, fn, stack); 
    
    //Handle returns
    new Visitor({
      ReturnStatementEnd : (x:AST.ReturnStatement) =>  this.onReturn(state, x),
    }).exec(fn)

    body.push(...fn.body.body);

    if (fn.params.length === params.length) { //If using index
      vars.push(pos, m.Literal(0))
      body.push(m.Expr(m.Increment(pos)))
    }

    return { body, vars };
  }

  manualTransform(data:T[]):U {
    return this.manual.apply(data, this.inputArray) as U; 
  }
}