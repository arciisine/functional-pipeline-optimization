import { Util } from '../../node_modules/@arcsine/ecma-ast-transform/src';
import { TransformLevel, Transformable, Tracked, TrackedCallback} from './types';
import { md5 } from './md5';

export class Analyzer {
  private static tracked:{[key:string]:Tracked<any,any>} = {};
  private static id:number = 0;
  
  static analyzeFunction(el:TrackedCallback<any, any>) {
    if (!el.key) {
      el.key = md5(el.toString());
    }
    //Try to lookup remaining information
    if (Analyzer.tracked[el.key]) {
      if (!el.id) {
        let rel =  Analyzer.tracked[el.key];
        el.id = rel.id;
        el.level = rel.level;
        el.closed = rel.closed;
      }
    } else {
      //Compute information
      el.id = Analyzer.id++;
      el.level = Util.isPureFunction(el) ? 
        TransformLevel.NO_DEPENDENCE : 
        TransformLevel.UNKNOWN;      
      el.closed = {};
      Analyzer.tracked[el.key] = {
        id:el.id, 
        level:el.level, 
        key:el.key,
        closed: el.closed
      };
    }      
  }

  static analyze<I, O, T extends Transformable<I,O>>(el:T):T {
    el.key = "~";
    el.level = TransformLevel.NO_DEPENDENCE;
    el.callbacks.forEach(x => {
      Analyzer.analyzeFunction(x);
      el.key = el.key + "|" +  x.id;
      el.level = Math.min(el.level, x.level); 
    });
    return el;
  }
}