import { AST, Macro as m, Util } from '../../node_modules/@arcsine/ecma-ast-transform/src';
import { TransformResponse, Transformable } from '../transform';
import { ArrayUtil } from './util'
import { TransformState, ScalarTransformable, ArrayTransformable } from './types';

export const SUPPORTED = ['filter', 'map', 'reduce', 'forEach', 'find' ,'some'];

export class FilterTransform<T> extends ArrayTransformable<T, T, boolean> {
  transformer(state:TransformState):TransformResponse  {
    return ArrayUtil.standardTransformer(this.callback, [state.elementId],
      node => m.IfThen(m.Negate(node.argument), [m.Continue(state.continueLabel)]));
  }
  manual(data:T[]):T[] { 
    return data.filter(this.callback, this.context) 
  }
}

export class MapTransform<T, U> extends ArrayTransformable<T, U, U> {
  transformer(state:TransformState):TransformResponse  {
    return ArrayUtil.standardTransformer(this.callback, [state.elementId],
      node => m.Expr(m.Assign(state.elementId, node.argument)));
  }
  manual(data:T[]):U[] { 
    return data.map(this.callback) 
  }
}

export class ReduceTransform<T, U> extends Transformable<T[], U> {
  initRaw:string = null;

  constructor(public callback:(acc:U, el:T, i?:number, arr?:T[])=>U, public initValue?:U, public context?:any, globals?:any) {
    super([callback, initValue, context], globals);

    if (initValue !== null) {
      this.initRaw = JSON.stringify(initValue);
    }    
  }

  init(state:TransformState):AST.Node {
    let decl = Util.parseExpression(`let a = ${this.initRaw}`) as AST.VariableDeclaration;
    return decl.declarations[0].init;
  }

  transformer(state:TransformState):TransformResponse  {   
    return ArrayUtil.standardTransformer(this.callback,  [state.returnValueId, state.elementId],
      node => m.Expr(m.Assign(state.returnValueId, node.argument)));
  }
  manual(data:T[]):U { 
     return data.reduce(this.callback, JSON.parse(this.initRaw) as U); 
  }
}

export class ForEachTransform<T> extends ScalarTransformable<T, void, void> {
  transformer(state:TransformState):TransformResponse  {    
    return ArrayUtil.standardTransformer(this.callback, [state.elementId],
      node => m.Continue(state.continueLabel));
  }
  manual(data:T[]):void { 
    return data.forEach(this.callback) 
  }
}

export class FindTransform<T> extends ScalarTransformable<T, T, boolean> {
  transformer(state:TransformState):TransformResponse  {
    return ArrayUtil.standardTransformer(this.callback, [state.elementId],
      node => m.IfThen(node.argument, [m.Return(state.elementId)]));
  }
  manual(data:T[]):T { 
    return data.find(this.callback) 
  }
}

export class SomeTransform<T> extends ScalarTransformable<T, boolean, boolean> {
  transformer(state:TransformState):TransformResponse  {
    return ArrayUtil.standardTransformer(this.callback, [state.elementId],
      node => m.IfThen(node.argument, [m.Return(m.Literal(true))]));
  }
  manual(data:T[]):boolean { 
    return data.some(this.callback) 
  }
}