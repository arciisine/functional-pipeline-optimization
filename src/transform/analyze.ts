import { Util } from '../../node_modules/@arcsine/ecma-ast-transform/src';
import { TransformLevel, Transformable, TransformTag } from './types';
import { md5 } from './md5';

export class Analyzer {
  private static tagged:{[key:string]:TransformTag} = {};
  private static id:number = 0;
  
  static analyzeFunction(el:Function) {
    //Try to lookup remaining information
    if (Analyzer.tagged[el.tag && el.tag.key]) {
      el.tag = Analyzer.tagged[el.tag.key];
    } else {
      //Compute information
      let tag = {
        key : md5(el.toString()) as string,
        id : Analyzer.id++,
        level : Util.isPureFunction(el) ? 
          TransformLevel.NO_DEPENDENCE : 
          TransformLevel.UNKNOWN,      
        closed : {}
      };
      Analyzer.tagged[tag.key] = tag;
      el.tag = tag;
    }      
  }

  static analyze<I, O, T extends Transformable<I,O>>(el:T):T {
    let tag = el.tag = {
      key : "~",
      level : TransformLevel.NO_DEPENDENCE,
    }
    el.callbacks.forEach(x => {
      Analyzer.analyzeFunction(x);
      tag.key = tag.key + "|" +  x.tag.id;
      tag.level = Math.min(tag.level, x.tag.level); 
    });
    return el;
  }
}