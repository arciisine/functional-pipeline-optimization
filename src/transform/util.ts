import { Util } from '../../node_modules/@arcsine/ecma-ast-transform/src';
import {TrackedFunction, TransformLevel, Transformable, Tracked} from './types';
import { md5 } from './md5';

export class TransformUtil {

  private static tracked:{[key:string]:Tracked<any,any>} = {};
  private static id:number = 0;

  static track<I,O,T extends Tracked<I,O>>(tracked:T):T {
      if (TransformUtil.tracked[tracked.key]) {
        tracked = TransformUtil.tracked[tracked.key] as T;
      } else {
        TransformUtil.tracked[tracked.key] = tracked;
      }

      if (!tracked.id) {
        tracked.id = TransformUtil.id++;
      }
      return tracked;
  }

  static annotateTracked<I, O>(fn:TrackedFunction<I,O>):TrackedFunction<I,O> {
    if (fn.level === null) {
      fn.level = Util.isPureFunction(fn) ? 
        TransformLevel.NO_DEPDENDENCE : 
        TransformLevel.UNKNOWN
    }        

    if (fn.level >= TransformLevel.READ_DEPENDENCE) {
      if (!fn.key) {  
        fn.key = md5(fn.toString());
      }
      fn = TransformUtil.track(fn);
    }
    
    return fn;
  }

  static annotateTransformable<I, O>(fn:Transformable<I,O>):Transformable<I,O> {
    if (fn.level === null) {
      fn.level = fn.input
        .filter(x => _.isFunction(x))
        .map(TransformUtil.annotateTracked)
        .reduce((acc, l) => acc < l.level ? acc : l.level, TransformLevel.NO_DEPDENDENCE);
    } 

    if (fn.level >= TransformLevel.READ_DEPENDENCE) {
      if (!fn.key) {
        fn.key = fn.input
          .filter(x => _.isFunction(x))
          .map(x => x.key).join("~");
      }
      fn = TransformUtil.track(fn);
    }

    return fn;
  }
}