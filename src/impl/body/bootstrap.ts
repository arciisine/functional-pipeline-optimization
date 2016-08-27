import {ArrayBuilder} from '../array/builder';
import {MAPPING} from '../array/transform';
import {Util, CompilerUtil, ExecOutput, Compilable} from '../../core';

export class Helper {

  static exec<T>(data:T[], key:string, ops:string[], context:any[][],  passed:boolean[], closed:any[], post:(all:any[])=>T):T[] {
    let res = CompilerUtil.computed[key];    
    if (res) {
      let ret = res({value:data, closed, context })
      post && post(ret.assigned);
      return ret.value; 
    } else if (res === null) {
      for (let i = 0; i < ops.length; i++) {
        data = (data[ops[i]] as any)(...context[i]);
      }
      return data;
    } else if (!Array.isArray(data)) {
      CompilerUtil.computed[key] = null;
    } else {
      let ret:ExecOutput<T[]> = null;
      let builder = new ArrayBuilder<any, T>(data);
      for (let i = 0; i < ops.length; i++) {
        if (passed[i]) {
          //Tag function as passed
          context[i][0]['passed'] = true;
        }
        builder.chain(MAPPING[ops[i]], context[i]);
      }
      try {
        builder.exec(closed, key)
      } catch (e) {
        if (e.invalid) {
          CompilerUtil.computed[key] = null;
        } else {
          console.log(e);
          throw e;
        }
      } 
    }
    //Recurse on invalid states
    return Helper.exec(data, key, ops, context, passed, closed, post);
  }
} 

export let SYMBOL = "_zzx8";
Util.global[`${SYMBOL}_exec`] = Helper.exec