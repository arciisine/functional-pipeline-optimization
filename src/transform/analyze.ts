import { Util } from '../../node_modules/@arcsine/ecma-ast-transform/src';
import { TransformLevel, Transformable, TransformTag } from './types';
import { md5 } from './md5';

export class Analyzer {
  private static tagged:{[key:string]:TransformTag} = {};
  private static id:number = 0;
  
  static getFunctionTag(el:Function):TransformTag {
    //Try to lookup remaining information
    let checksum = md5(el.toString());
    let tag = Analyzer.tagged[checksum]; 
    if (!tag) {
      tag = {
        key : `${Analyzer.id++}`,
        check : checksum,
        level : Util.isPureFunction(el) ? 
          TransformLevel.NO_DEPENDENCE : 
          TransformLevel.UNKNOWN,      
        closed : {}
      };
      Analyzer.tagged[checksum] = tag;
    }      
    return tag;
  }

  static mergeTags(tag:TransformTag, i:{tag?:TransformTag}) {
    tag.key += "|" +  i.tag.key;
    tag.level = Math.min(tag.level, i.tag.level);
    return tag;
  }

  static getTransformableTag<I, O, T extends Transformable<I,O>>(el:T):TransformTag {
    return el.callbacks.reduce(Analyzer.mergeTags, {
      key : "~",
      level : TransformLevel.NO_DEPENDENCE,
    });
  }

  static tag<I, O, T extends Transformable<I,O>>(el:T):T {
    el.callbacks.forEach(x => x.tag = Analyzer.getFunctionTag(x))
    el.tag = Analyzer.getTransformableTag(el);
    return el;
  }
}