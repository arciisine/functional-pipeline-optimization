import { AST, Macro as m, ParseUtil, Visitor } from '@arcsine/ecma-ast-transform/src';
import { Transformable, TransformResponse, BaseTransformable} from '../../core';
import { Analysis, FunctionAnalyzer } from '../../core/analyze';
import { RewriteContext, VariableStack, RewriteUtil, VariableNodeHandler }  from '../../core/analyze/variable';
import { TransformState, VariableState } from './types';

interface ConstantParam {
  i: number;
  id: AST.Identifier;
  origId: AST.Identifier;
}

export abstract class BaseArrayTransformable<T, U, V extends Function, W extends Function> extends BaseTransformable<T[], U>
{
  private static cache = {};
  private static id = 0;
  public static DEFAULT_MAPPING = {
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
  public posId = m.Id('idx', true);
  private analysis:Analysis|null = null

  constructor(
    inputs:any[], 
    inputMapping:{[key:string]:number} = BaseArrayTransformable.DEFAULT_MAPPING, 
    private reassignableParams:{[key:number]:boolean} = {}
  ) {
    super(inputs, inputMapping);
  }

  abstract onReturn(state:TransformState, node:AST.ReturnStatement):AST.Node;

  getContinue(state:TransformState):AST.ContinueStatement {
    return m.Continue(state.continueLabel);
  }

  getInput(key:'context'):any
  getInput(key:'callback'):V
  getInput(key:string) {
    return this.inputs[this.inputMapping[key]];
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
      stepCallbackId, this.getContextValue(state, 'callback'), 
    )

    out.body.push(
      this.onReturn(state, 
        m.Return(m.Call(m.GetProperty(stepCallbackId, 'call'), stepContextId, ...params))
      )
    );
  }

  rewriteConstantParams(state:TransformState, out:TransformResponse, params:AST.Identifier[], fn:AST.FunctionExpression) {
    //Check for rewriting constant params
    let temp = {};
    let constantParams:{[key:string]: ConstantParam} = params
      .map((id, i) => ({ i, id, origId : fn.params[i] }))
      .filter(x => !this.reassignableParams[x.i])
      .reduce((acc, x) => (acc[(x.origId as AST.Identifier).name] = x) && acc, {});

    Visitor.exec(new VariableNodeHandler({
      Function : node => Visitor.PREVENT_DESCENT,
      Write : id => {
        if (constantParams[id.name]) {
          let conf = constantParams[id.name];
          let finalId = conf.id;
          
          if (finalId === this.posId) {
            temp['indexId'] =  conf;
          } else if (finalId === state.elementId) {
            temp['elementId'] = conf;
          }
        } 
      }
    }), fn);

    //Project temp to replace the original params
    Object.keys(temp)
      .forEach(k => {
        let conf = temp[k];
        if (!state.tempIds[k]) {
          state.tempIds[k] = m.Id('temp'+k, true);
          out.vars.push(state.tempIds[k], null);
        }
        out.body.unshift(m.Assign(state.tempIds[k], conf.id));
        params[conf.i] = state.tempIds[k];
      });
  }

  /**
   * Inline the function
   */
  buildInlineResult(state:TransformState, out:TransformResponse, params:AST.Identifier[], fn:AST.FunctionExpression):void {
    let stack = new VariableStack<RewriteContext>();

    this.rewriteConstantParams(state, out, params, fn);

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
    let fn:AST.FunctionExpression|null = null;
    let input = this.getInput('callback');
    let params = this.getParams(state);    
    let res:TransformResponse = {vars:[], body:[], after:[]};
    let variableState = state.operations[this.position][1];
    let hasSource = !ParseUtil.isNative(input) && variableState !== VariableState.dynamic
    let isInlinable = variableState === VariableState.inline;
    let hasIndex = true    
    let analysis:Analysis|null = null;

    if (hasSource) { 
      let node = ParseUtil.parse(input) as AST.Node;

      if (AST.isExpressionStatement(node)) {
        node = node.expression;
      }

      if (AST.isFunction(node)) {
        fn = node as AST.FunctionExpression;
        analysis = FunctionAnalyzer.analyzeAST(fn);
        isInlinable = isInlinable || !analysis.hasClosed
        hasIndex = fn.params.length === params.length + 1; //If using index;

        //Assumes native functions will not access the array, can be wrong
        let hasArray = fn.params.length === params.length + 2;   

        if (hasArray) { //If using array notation
          throw { message : "Array references are not supported", invalid : true };
        }
      } else {
        throw { message : `Invalid type: ${node.type}`, invalid : true };
      }
    }

    //To handle if we have to rewrite the index due to modification
    const posId = this.posId;

    if (hasIndex) { //If using index
      res.vars.push(posId, m.Literal(0))
      params.push(posId)
    }
    
    //If can be inlined
    if (isInlinable && fn) {
      this.buildInlineResult(state, res, params, fn);
      if (analysis) {
        state.analysis.merge(analysis);
      }
    } else {
      this.buildFunctionCallResult(state, res, params); 
    }

    if (hasIndex) {
      res.body.push(m.Expr(m.Increment(posId)))
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