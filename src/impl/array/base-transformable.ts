import { AST, Macro as m, ParseUtil, Visitor } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import { Transformable, TransformResponse} from '../../core';
import { Analysis } from '../../core/analyze';
import { RewriteContext, VariableStack, RewriteUtil }  from '../../core/analyze/variable';
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

  public inputArray:any[]
  public manual:W;
  public callbacks:Function[];
  public analysis:Analysis = null;
  public position = -1;

  constructor(public inputs:{callback:V, context?:any}) {
    this.callbacks = [inputs.callback];
    this.manual = BaseTransformable.getArrayFunction(this);
    this.inputArray = [inputs.callback, inputs.context];
  }


  abstract onReturn(state:TransformState, node:AST.ReturnStatement):AST.Node;

  getContextValue(state:TransformState, key:string):AST.MemberExpression {
    return m.GetProperty(m.GetProperty(state.contextId, m.Literal(this.position)), key);
  }

  getParams(state:TransformState):AST.Identifier[] {
    return [state.elementId];
  }

  transform(state:TransformState):TransformResponse  {
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

    let vars = [];
    let body:AST.Node[] = [];

    //If not defined inline, and it has closed variables
    //TODO: Allow for different levels of assumptions
    if (!this.inputs.callback.inline && Object.keys(this.analysis.closed).length > 0) {
      let stepContextId = m.Id();
      let stepCallbackId = m.Id()

      vars.push(
        stepContextId, this.getContextValue(state, 'context'), 
        stepCallbackId, m.GetProperty(this.getContextValue(state, 'callback'), 'call')
      );

      body.push(this.onReturn(state, 
        m.Return(
          m.Call(stepCallbackId, stepContextId, ...params)
        )
      )); 
    } else {
      let stack = new VariableStack<RewriteContext>();

      //Handle context variable
      if (this.inputs.context !== undefined) {
        let ctx = m.Id();
        vars.push(ctx, this.getContextValue(state, 'context'));
        stack.register('this').rewriteName = ctx.name;
      }

      let res = RewriteUtil.rewriteVariables(stack, fn, params);
      vars.push(...res.vars);
      body.unshift(...res.body);
      
      //Handle returns
      Visitor.exec({
        Function : (x:AST.BaseFunction) => x !== fn ? Visitor.PREVENT_DESCENT : null,
        ReturnStatementEnd : (x:AST.ReturnStatement) => this.onReturn(state, x)
      }, fn)

      body.push(...fn.body.body);
    }

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