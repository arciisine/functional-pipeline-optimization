import { AST, Macro as m, ParseUtil, Visitor } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import { Transformable, TransformResponse} from '../../core';
import { Analysis, FunctionAnalyzer } from '../../core/analyze';
import { RewriteContext, VariableStack, RewriteUtil }  from '../../core/analyze/variable';
import { TransformState } from './types';

export abstract class BaseTransformable<T, U, V extends Function, W extends Function> 
  implements Transformable<T[], U> 
{
  private static cache = {};
  private static id = 0;
  private static DEFAULT_MAPPING = {
    callback : 0,
    context : 1
  };

  static getArrayFunction<V extends BaseTransformable<any, any, any, any>>(inst:any) {
    let key = inst.constructor.name
    if (!BaseTransformable.cache[key]) {
      let fn = key.split('Transform')[0];
      fn = fn.charAt(0).toLowerCase() + fn.substring(1);
      BaseTransformable.cache[key] = Array.prototype[fn];
    }
    return BaseTransformable.cache[key];
  }

  public manual:W;
  public position = -1;

  constructor(protected inputs:any[], protected inputMapping:{[key:string]:number} = BaseTransformable.DEFAULT_MAPPING) {}

  abstract onReturn(state:TransformState, node:AST.ReturnStatement):AST.Node;

  getInput(key:'context'):any
  getInput(key:'callback'):V
  getInput(key:string) {
    return this.inputs[this.inputMapping[key]];
  }

  analyze():Analysis {
    return FunctionAnalyzer.analyze(this.getInput('callback'));
  }

  getContextValue(state:TransformState, key:string):AST.MemberExpression {
    return m.GetProperty(
        m.GetProperty(state.contextId, m.Literal(this.position)), 
        AST.Literal({value:this.inputMapping[key]}));
  }

  getParams(state:TransformState):AST.Identifier[] {
    return [state.elementId];
  }

  /**
   * When we cannot inline, we just call the function directly
   */
  buildFunctionCallResult(state:TransformState, out:TransformResponse, params:AST.Identifier[]):void {
    let stepContextId = m.Id();
    let stepCallbackId = m.Id()

    out.vars.push(
      stepContextId, this.getContextValue(state, 'context'), 
      stepCallbackId, m.GetProperty(this.getContextValue(state, 'callback'), 'call')
    )

    out.body.push(
      this.onReturn(state, 
        m.Return(m.Call(stepCallbackId, stepContextId, ...params))
      )
    );
  }

  /**
   * Inline the function
   */
  buildInlineResult(state:TransformState, out:TransformResponse, params:AST.Identifier[], fn:AST.FunctionExpression):void {
    let stack = new VariableStack<RewriteContext>();

    //Handle context variable
    if (this.getInput('context') !== undefined) {
      let ctx = m.Id();
      out.vars.push(ctx, this.getContextValue(state, 'context'));
      stack.register('this').rewriteName = ctx.name;
    }

    //Rewrite all variables in the function
    let res = RewriteUtil.rewriteVariables(stack, fn, params);
    out.vars.push(...res.vars);
    out.body.unshift(...res.body);
    
    //Handle returns
    Visitor.exec({
      Function : (x:AST.BaseFunction) => x !== fn ? Visitor.PREVENT_DESCENT : null,
      ReturnStatementEnd : (x:AST.ReturnStatement) => this.onReturn(state, x)
    }, fn)

    out.body.push(...fn.body.body);
  }

  transform(state:TransformState):TransformResponse  {
    let node = ParseUtil.parse(this.getInput('callback')) as AST.Node;
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

    let res = {vars:[], body:[]};

    //If not defined inline, and it has closed variables
    //TODO: Allow for different levels of assumptions
    if (!this.getInput('callback').name.startsWith('__inline') && Object.keys(this.analyze().closed).length > 0) {
       this.buildFunctionCallResult(state, res, params); 
    } else {
      this.buildInlineResult(state, res, params, fn);
    }
    
    if (fn.params.length === params.length) { //If using index
      res.vars.push(pos, m.Literal(0))
      res.body.push(m.Expr(m.Increment(pos)))
    }

    return res;
  }

  manualTransform(data:T[]):U {
    if (!this.manual) {
      this.manual = BaseTransformable.getArrayFunction(this);
    }
    return this.manual.apply(data, this.inputs) as U; 
  }
}