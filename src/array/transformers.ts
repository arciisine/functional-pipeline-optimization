import {Macro as m} from '../../node_modules/ecma-ast-transform/src';
import {
  TransformResponse, 
  TransformReference, 
  TransformState, 
  TransformUtil 
} from '../transform';

export class Transformers {
  static filter = {
    transformer : (ref:TransformReference, state:TransformState):TransformResponse => {
      ref.params = [state.element];
      ref.onReturn = node => m.IfThen(m.Negate(node.argument), [m.Continue(state.continueLabel)]);
      return TransformUtil.standardTransformer(ref);
    },
    manual : <T>(data:T[], fn:(v:T, i?:number)=>boolean):T[] => { return data.filter(fn) }
  }
  
  static map = {
    transformer : (ref:TransformReference, state:TransformState):TransformResponse => {
      ref.params = [state.element];
      ref.onReturn = node => m.Expr(m.Assign(state.element, node.argument));
      return TransformUtil.standardTransformer(ref);
    },
    manual : <T, U>(data:T[], fn:(v:T, i?:number)=>U):U[] => { return data.map(fn); }
  } 
  
  static reduce = {
    transformer : (ref:TransformReference, state:TransformState):TransformResponse => {
      ref.params = [state.ret, state.element];
      ref.onReturn = node => m.Expr(m.Assign(state.ret, node.argument));
      return TransformUtil.standardTransformer(ref);
    },
    manual : <T,U>(data:T[], fn:(acc:U, v:T, i?:number, arr?:T[])=>U, init:U):U => { 
      return data.reduce(fn, init); 
    }
  }

  static forEach = {
    transformer : (ref:TransformReference, state:TransformState):TransformResponse => {
      ref.params = [state.element];
      ref.onReturn = node => m.Continue(state.continueLabel);
      return TransformUtil.standardTransformer(ref);
    },
    manual : <T>(data:any[], fn:(v:T, i?:number)=>void):void => { data.forEach(fn); }
  }

  static find = {
    transformer : (ref:TransformReference, state:TransformState):TransformResponse => {
      ref.params = [state.element];
      ref.onReturn = node => m.IfThen(node.argument, [m.Return(state.element)]);
      return TransformUtil.standardTransformer(ref);
    },
    manual : <T>(data:T[], fn:(v:T, i?:number)=>boolean):T => { return data.find(fn); }
  }

  static some = {
    transformer : (ref:TransformReference, state:TransformState):TransformResponse => {
      ref.params = [state.element];
      ref.onReturn = node => m.IfThen(node.argument, [m.Return(m.Literal(true))]);
      return TransformUtil.standardTransformer(ref);
    },
    manual : <T>(data:T[], fn:(v:T, i?:number)=>boolean):boolean => { return data.some(fn); }
  }
}
