import { AST, Macro as m, ParseUtil, Visitor } from '../../../node_modules/@arcsine/ecma-ast-transform/src';
import { Transformable, TransformResponse, BaseTransformable} from '../../core';
import { Analysis, FunctionAnalyzer } from '../../core/analyze';
import { RewriteContext, VariableStack, RewriteUtil }  from '../../core/analyze/variable';
import { TransformState } from './types';

export abstract class BaseArrayTransformable<T, U, V extends Function, W extends Function> extends BaseTransformable<T[], U>
{
  private static cache = {};
  private static id = 0;
  private static DEFAULT_MAPPING = {
    callback : 0,
    context : 1
  };

  static getArrayFunction<V extends BaseArrayTransformable<any, any, any, any>>(inst:any) {
    let key = inst.constructor.name
    if (!BaseArrayTransformable.cache[key]) {
      let fn = key.split('Transform')[0];
      fn = fn.charAt(0).toLowerCase() + fn.substring(1);
      BaseArrayTransformable.cache[key] = Array.prototype[fn];
    }
    return BaseArrayTransformable.cache[key];
  }

  public manual:W;
  public position = -1;

  constructor(inputs:any[], inputMapping:{[key:string]:number} = BaseArrayTransformable.DEFAULT_MAPPING) {
    super(inputs, inputMapping)
  }

  abstract onReturn(state:TransformState, node:AST.ReturnStatement):AST.Node;

  getInput(key:'context'):any
  getInput(key:'callback'):V
  getInput(key:string) {
    return this.inputs[this.inputMapping[key]];
  }

  analyze():Analysis {
    return FunctionAnalyzer.analyze(this.getInput('callback'));
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
    let input = this.getInput('callback');
    let node = ParseUtil.parse(input) as AST.Node;
    
    let fn:AST.FunctionExpression = null;

    if (AST.isExpressionStatement(node)) {
      node = node.expression;
    }

    if (AST.isFunction(node)) {
      fn = node as AST.FunctionExpression;
    } else {
      throw { message : `Invalid type: ${node.type}`, invalid : true };
    }

    let pos = m.Id();
    let params = [...this.getParams(state), pos];

    if (fn.params.length > params.length) { //If using array notation
      throw { message : "Array references are not supported", invalid : true };
    }

    let res = {vars:[], body:[]};
    let hasIndex = fn.params.length === params.length; //If using index
    let isStatic = input.key.startsWith('__inline') || !this.analyze().hasClosed

    //If not defined inline, and it has closed variables
    //TODO: Allow for different levels of assumptions
    if (!isStatic) {
      this.buildFunctionCallResult(state, res, params.slice(0, !hasIndex ? -1 : params.length)); 
    } else {
      this.buildInlineResult(state, res, params, fn);
    }
    
    if (hasIndex) { //If using index
      res.vars.push(pos, m.Literal(0))
      res.body.push(m.Expr(m.Increment(pos)))
    }

    return res;
  }

  manualTransform(data:T[]):U {
    if (!this.manual) {
      this.manual = BaseArrayTransformable.getArrayFunction(this);
    }
    return this.manual.apply(data, this.inputs) as U; 
  }
}